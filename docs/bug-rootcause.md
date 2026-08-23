# dsh-Remote-mod 6 个 bug 根因分析（t1）

> 结论先行：当前 mod HEAD（`a323f04`，基于上游 dsh-remote 0.6.10-rc.1 **重开分支**）**丢失了 v0.6.9-mod 的全部修复**。`git log v0.6.9-mod..HEAD` 只有 2 个提交（`e5f9901 release: v0.6.10-rc.1`、`a323f04 ci`），v0.6.9-mod（`836d486`）不在 HEAD 祖先链上——mod 分支是从上游 0.6.10-rc.1 重新拉的，v0.6.9-mod 的 gateway.js deviceViews IP 合并、desktop.js probeGatewayHealth、styles.css 会话页贴底、index.mjs admin 302 统一入口全部丢失。6 个 bug 中 1/3/4/5 在 v0.6.9-mod 里已有修复可直接参照移植，2/6 需要新写。

---

## Bug 1：管理界面双入口（3080 插件源 vs 8787 网关源）

### 【根因】
管理 UI 同一套 admin.html 被两个源托管：
- 网关源 `http://127.0.0.1:8787/admin?token=`（gateway.js serveStatic，public/admin.html）；
- 插件源 `http://127.0.0.1:3080/remote/admin/`（packages/plugin/index.mjs 的 `MOUNT=/remote` serveStatic 直接托管 public/admin.html）。

调用点全量清单（grep `/remote/admin` 全仓）：
| 位置 | 代码 |
|---|---|
| public/plugin.js:13 | `openConsole(){ window.open('/remote/admin/','_blank','noopener') }` |
| public/plugin.js:168 | `$('plugin-console').addEventListener('click', openConsole)` |
| public/plugin.js:171-174 | `plugin-primary` click，action==='console' → openConsole() |
| public/plugin.html:147 | footer 链接 `<a id="plugin-about" href="/remote/admin/" target="_blank">关于与支持</a>` |
| packages/plugin/index.mjs:498-499 | `/remote/admin` → 302 → `/remote/admin/`（仅补斜杠，继续插件源渲染） |
| public/admin.js:10-13 | pluginMode 判定 + API 基址 = `/remote/admin/api`（3080 源下走插件代理） |
| public/admin.js:30 | STATS_API = pluginMode ? API+'/stats' : '/stats' |

desktop 端**没有** /remote/admin 引用（desktop.js 仅 :1478 用 `/remote/api/command` 斜杠命令桥）。插件抽屉 iframe（packages/plugin/client.js:87-92）嵌的是 `/remote/plugin.html`，**不嵌 admin**——所以把 /remote/admin 改成重定向不影响抽屉。

插件源 admin 能工作吗？**能**。admin.js 在 3080 源下 pluginMode=true：所有 `/remote/admin/api/*`（state/note/kick/token-rotate/config/gateway/dsh/stats）在 index.mjs:505-660 均有代理；admin.js:435 状态的"打开网关"用 state.port 拼 `http://host:port/admin`。所以是**架构性双入口、功能均可用**——问题在维护双份路由/代理、token 两套账本、用户困惑。

### 【历史对照】
v0.6.9-mod index.mjs 已实现唯一入口：`adminRedirectBase(req)`（DSH_REMOTE_GATEWAY 显式配置时以其为基准）+ 对 `/remote/admin`、`/remote/admin/`、`/remote/admin.html`、`/remote/admin/index.html` 四条路径统一 302 到 `<base>/admin?token=<token>`（保留其他 query 参数），admin.js 相应删除 pluginMode 分支。当前树丢失了它。

### 【最小改动点】
- packages/plugin/index.mjs serveStatic/resolveFile 分支（现 :498-499 附近）：把"补斜杠 302"改成"带 token 的网关 302"。
- public/plugin.js:13、public/plugin.html:147：**不用改**——302 后 `/remote/admin/` 自动落到 `http://127.0.0.1:<gatewayPort>/admin?token=<token>`。改入口反而要多一次 fetch 拿 port/token，违背最小 diff。

### 【建议实现】（index.mjs 内，约 8 行）
```js
function adminRedirectBase(req) {
  const explicit = process.env.DSH_REMOTE_GATEWAY
  // ponytail: 显式网关配置优先（可能指向别的机器/域名）；否则用本机网关端口
  return explicit ? explicit.replace(/\/+$/, '') : `http://127.0.0.1:${readGatewayPort()}`
}
// 在 resolveFile/serveStatic 处理 /remote/admin、/remote/admin/、/remote/admin.html、/remote/admin/index.html 时：
const token = gatewayToken()
if (token) params.set('token', token)
res.writeHead(302, { location: `${adminRedirectBase(req)}/admin${qs ? '?' + qs : ''}` })
```
保留其他 query（如 ?embedded=1）透传。抽屉用的 plugin.html 不受影响。

### 【自测方式】
1. `curl -sI http://127.0.0.1:3080/remote/admin/` → 302，Location=`http://127.0.0.1:8787/admin?token=<新token>`。
2. 插件抽屉点"打开控制台"→ 落在 8787 admin 且已带 token，免登录。
3. admin 里 旋转令牌/踢设备/备注/统计全部正常（走网关源）。
4. 手机端 DSH 控制面板（app.js 的 `/remote/admin/api/dsh`，adminApiUrl()）仍可用——**该代理必须保留**。

---

## Bug 2：手机端旧会话加载失败（超大会话）

### 【根因】
链路：app.js `rpc()` POST `apiUrl('/api/session.history')` → 网关 `proxyApi` stream 透传（gateway.js:2084-2155，`req.pipe` 不缓冲）→ DSH `session.history`。

已从安装的 DSH 依赖源码（`@deepseek-ai/dsh-host-apiproxy/lib/index.js`）确认：
- `maxMessages`/`beforeSeq` 参数**受支持**（:486-487，默认页 50，:878），`paginate()` 按消息边界从尾部往前切页（:969-991）；
- 但**冷会话**（旧会话不在内存，`source.kind==='detached'`）时 `historySourceFor` → `inspectServable(sessionId)` **要全量读取+解压 session.jsonl.zstd**（:1991-2003），`historyCutOf` 把**全部 events 复制**后再分页（:2032-2046），history 处理器 :2557-2568。超大旧会话的冷读取耗时与服务端事件总数成正比，与请求页大小无关。

失败机制：
1. app.js:341-344 `rpc()` 用 `AbortSignal.timeout(45000)` 硬超时；
2. 超大旧会话冷重放 > 45s → AbortError → `loadHistory` catch → 显示"加载失败"（历史缓存 historyCacheV1 为空时无可回退）。
3. 次级因素：单页含大 tool 输出时响应体可达数 MB，WebView JSON.parse/首屏渲染在低端机卡顿，表现为"转圈后超时"——但这被 45s 超时兜底，不是主因。
4. 0.6.4 更新日志自证：`public/update.json` 0.6.4 条目"会话历史加载超时放宽至 45 秒，失败可重试"。

网关 proxy 不缓冲全量响应 → **网关不是瓶颈**；限制分页大小对冷重放耗时无帮助（重放 O(全量)），所以"服务端限页"方向无效，正确方向是**放宽超时 + 失败重试 + 明确超时提示**。

### 【历史对照】
v0.6.9-mod app.js 未改 loadHistory（diff 仅 `await loadHistory(true)` 一行）——没有可移植的历史修复，需新写。

### 【最小改动点】
- public/app.js:341 `rpc()` 增加可选 `timeoutMs` 参数（回退 45000）——1 行；
- public/app.js loadHistory（~1570-1587）调用处传专用超时（如 180000）并按 AbortError 分支处理——约 6 行。

### 【建议实现】
```js
async function loadHistory(reset = false) {
  ...
  try {
    const payload = { sessionId, maxMessages: 60 }  // 保持 60；分页已限渲染量
    if (!reset && state.history.minSeq != null) payload.beforeSeq = state.history.minSeq
    const out = await rpc('session.history', payload, 180000)  // 历史冷重放专用 180s
    ...
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      toast(t('hist.loadingLarge'), 'warn')          // 新 i18n key: "会话较大，继续加载中…"
      return retryHistory(reset)                       // 自动重试一次，仍失败走原错误提示
    }
    ...原错误分支
  }
}
```
不改 45s 全局默认（其余 RPC 保持快速失败），只给历史请求放宽。HISTORY_MAX_VISIBLE / renderStart-renderEnd 虚拟化（app.js ~4290-4370）已存在，无需动。

### 【自测方式】
1. 造一个数千轮的旧会话（或把某 session.jsonl.zstd 拷大），真机打开 → 修复前 45s 报"加载失败"，修复后 N 秒（可>45s）加载出尾部 60 条，滚动"加载更早"继续分页。
2. 网络断掉时 loadHistory 快速失败行为不变（超时非 Abort 的其他错误仍走原分支）。
3. `node --test` 全绿（无新增依赖）。

---

## Bug 3：管理页设备列表 6 行 = 2 台设备

### 【根因】
网关 `devices` Map 的 key 是 `clientId ? ip|clientId : ip`（gateway.js:282-313 touchDevice），而：
- 前端每个 tab/每次启动生成**每会话随机 clientId**（app.js:14-23、desktop.js:14-23，sessionStorage 随机 UUID）；
- HTTP 请求带 `x-dsh-remote-client`（app/admin/web/plugin，gateway.js:308-309）但**不带 clientId** → key=ip；
- WS 升级带 `?clientId=`（app.js:883-884、desktop.js:949-950；gateway.js:2395-2405 WS 握手 touchDevice）→ key=`ip|clientId`。

同一物理设备产生多行：
| 行 | key | 来源 |
|---|---|---|
| 127.0.0.1（kind=admin） | `127.0.0.1` | 管理页自身轮询（HTTP） |
| 127.0.0.1 桌面浏览器 | `127.0.0.1` / `127.0.0.1\|<id>` | desktop HTTP / WS |
| 手机（kind=app） | `100.73.243.102` | App HTTP（events.poll/rpc/fs） |
| 手机 WS（"未知"） | `100.73.243.102\|<clientId>` | App 双 WS（mux·host），**同一 clientId 但 key 带 ip** |
| 手机旧 clientId | `100.73.243.102\|<旧id>` | App 重启后旧行 24h TTL 内残留 |

"未知"来源：Android WebView UA **全仓无 `DSHRemoteApp` 标记**（android/ 与 public/ 均 grep 0 命中），WS 握手没有 `x-dsh-remote-client` header，`kindOf()`（gateway.js:272-280）按 UA 判为 `'browser'`，admin.js 对非 app/admin/web 的 kind 渲染为"未知"。

`deviceViews()`（gateway.js:315-333）直接 `[...devices.values()]` 每 key 一行，无合并、无 admin 排除。
表头/语义核对（admin.html:356-358）：列 = 状态/名称/类型/IP/通道/请求/最后活跃/UA + 空列（断开按钮，"断开"=kickDevice 按 ip）；通道列由 admin.js 拼接 `mux · host` 布尔文本。**kickDevice（gateway.js:335-349）按 `d.id===ip || d.ip===ip` 匹配、deviceNotes 按 d.ip 存——合并输出层不破坏二者**。

### 【历史对照】
v0.6.9-mod gateway.js deviceViews() **已按 IP 聚合**（代码注释明确：内部 Map 仍按 ip|clientId 区分以管理通道/计数，输出层合并为一行；kind=admin 不计入已连接设备）——被 0.6.10-rc.1 重开分支丢掉，是纯回归。

### 【最小改动点】
gateway.js:315-333 `deviceViews()` 改为按 `d.ip` 聚合（内部 Map 与通道/socket 记账不动），并排除 kind==='admin'（管理页自身行）。

### 【建议实现】（~20 行替换）
```js
function deviceViews() {
  const byIp = new Map()
  for (const d of devices.values()) {
    if (d.kind === 'admin') continue            // 管理页自身不计入已连接设备
    let agg = byIp.get(d.ip)
    if (!agg) {
      agg = { ip: d.ip, id: d.ip, clientId: '', note: deviceNotes[d.ip] || '', ua: '',
              firstSeen: d.firstSeen, lastSeen: d.lastSeen, requests: 0, authFailures: 0,
              channels: {}, channelCounts: {}, online: false }
      byIp.set(d.ip, agg)
    }
    agg.lastSeen = Math.max(agg.lastSeen, d.lastSeen)
    agg.firstSeen = Math.min(agg.firstSeen, d.firstSeen)
    agg.requests += d.requests
    agg.authFailures += d.authFailures
    if (!agg.clientId && d.clientId) agg.clientId = d.clientId
    if (d.ua.length > agg.ua.length) agg.ua = d.ua
    for (const [ch, v] of Object.entries(d.channels)) agg.channels[ch] = agg.channels[ch] || v
    for (const [ch, n] of Object.entries(d.channelCounts)) agg.channelCounts[ch] = (agg.channelCounts[ch] || 0) + n
    if (d.sockets.size > 0 || Date.now() - d.lastSeen < 60_000) agg.online = true
  }
  return [...byIp.values()].sort((a, b) => b.lastSeen - a.lastSeen)
}
```
可选（顺手）：admin.js 把 kind 未知的显示文案从"未知"改为按 UA 推断（"浏览器/Mobile"）——非必需。

### 【自测方式】
1. 起网关 + 手机 App 连上 → admin 设备列表应只有 **1 行**（手机，通道列 mux · host，类型 app，UA 为 WebView 串）；管理页自身不再出现。
2. App 重启后再看 —— 仍 1 行（新 clientId 并进原 IP 行）。
3. 备注按 ip 保存/显示、点"断开"按 ip 踢掉手机 WS 全通道——均正常。
4. `tests/gateway.test.js` 全绿；补一个 deviceViews 聚合的单测（node:test，纯函数级，创建两个同 ip 不同 clientId 的 Map 项断言 1 行 + channels 合并）。

---

## Bug 4：手机端输入框不贴底

### 【根因】
两处叠加：
1. **58px 幽灵预留**：`.composer-wrap { position:fixed; bottom: calc(58px + var(--dsr-safe-b)) }`（styles.css:410-412）为底部导航预留 58px；但会话页 `body.in-session .bottom-nav { display:none }`（styles.css:248），导航已隐藏而 58px 预留从不回收 → 输入框下永远有 ~58px 空白带。
2. **安全区双计风险**：`--dsr-safe-b = max(env(safe-area-inset-bottom,0px), var(--native-bottom,0px))`（theme-vars.css:8-9）。`--native-bottom` 由 app.js:4369-4377 applyNativeInsets() 从 `NativeUpdate.getInsets()` 取（MainActivity getInsets :57-74 读 `getRootWindowInsets()...navigationBars()`）。AndroidManifest/styles.xml **无 edge-to-edge 标志**、activity 未设 `windowSoftInputMode`（默认 unspecified）：窗口内容本身已停在系统导航栏之上，getInsets 仍报导航栏高度 → safe-b 把导航栏高度再叠一层，K80 手势条场景额外加大空白；键盘弹出行为也因未设 adjustResize 而不可控。

### 【历史对照】
v0.6.9-mod styles.css 已加：
```css
/* 会话页贴底: 底部导航已隐藏(styles.css:248), 输入框直接贴屏幕底部(安全区由 .composer 内边距处理) */
body.in-session .composer-wrap { bottom: 0; }
```
被重开分支丢掉。

### 【最小改动点】
public/styles.css：恢复一条规则（v0.6.9-mod 同款）。.composer 自身内边距已是 `calc(8px + var(--dsr-safe-b))`（styles.css:432），bottom:0 即完成贴底+安全区。

### 【建议实现】
```css
/* 会话页贴底: 底部导航已隐藏(styles.css:248), 输入框直接贴屏幕底部(安全区由 .composer 内边距处理) */
body.in-session .composer-wrap { bottom: 0; }
```
可选项（增强，非必须）：AndroidManifest activity 加 `android:windowSoftInputMode="adjustResize"` 令键盘弹出时窗口收缩、输入框可见——需真机验证后决定加不加。

### 【自测方式】
1. K80 真机 APK：进入会话 → 输入框下沿贴屏幕底部（仅留手势条/安全区间隙），空白带消失。
2. 点输入框弹键盘 → 输入框随窗口上推可见，不被键盘遮挡。
3. 首页/非会话视图布局不变（规则限定 `body.in-session`）。

---

## Bug 5：桌面端"网关异常"误报（实测链路健康）

### 【根因】
desktop.js:2010-2038 `renderOverviewDesktop` 四项判定：
```js
const checks = {
  gateway: !!state.token && !!state.server,   // 纯配置存在性，无任何探测
  dsh:     !!state.hostInfo,                  // 依赖 host.describe RPC 结果
  mux:     !!state.streamsOk.mux,
  host:    !!state.streamsOk.host,
}
```
用户直接打开 `http://127.0.0.1:8787/desktop/desktop.html`（同源、未配置服务器）时 `selectFastestServer` 给 `state.server=''`（同源模式，desktop.js ~651-690）→ `!!state.server===false` → **gateway 项恒 false → "网关异常"**。实测 `/health`（gateway.js:2158+）返回 ok/upstreamOk:true/events 连通，系统真实健康；`3080/remote/health` 404 是插件不挂该路由，与本项无关（桌面从不该探测插件）。host.describe 401（见 Bug 6）还会连带 dsh 项熄灭。

### 【历史对照】
v0.6.9-mod desktop.js 已实现 `probeGatewayHealth()`：真实 fetch `/health?t=<ts>`（4s AbortController）、`gatewayHealth.base` 归属与 20s 过期、`state.server || location.origin` 兜底、upstreamOk=false 时用 host.describe 复核、渲染在探测回调后刷新——被重开分支丢掉。

### 【最小改动点】
public/desktop/desktop.js：新增 `probeGatewayHealth()`（~15 行）+ `renderOverviewDesktop` 内 gateway/dsh 两项改为基于探测结果（约 10 行改动）。

### 【建议实现】
```js
// desktop.js 新增
let healthProbeSeq = 0
async function probeGatewayHealth() {
  const base = state.server || location.origin || ''
  const seq = ++healthProbeSeq
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 4000)
  try {
    const res = await fetch(base.replace(/\/+$/, '') + '/health?t=' + Date.now(), { signal: ctrl.signal })
    const j = res.ok ? await res.json() : null
    state.gatewayHealth = { ok: !!j?.ok, upstreamOk: !!j?.upstreamOk, upstreamStatus: j?.upstreamStatus, version: j?.version, base, at: Date.now() }
  } catch {
    state.gatewayHealth = { ok: false, upstreamOk: false, base, at: Date.now() }
  } finally { clearTimeout(timer) }
  renderOverviewDesktop()          // 探测完成回调刷新
}
```
渲染内：
```js
const base = state.server || location.origin || ''
const gh = state.gatewayHealth && state.gatewayHealth.base === base ? state.gatewayHealth : null
const checks = {
  gateway: !!(gh && gh.ok),        // 真实 /health
  dsh:     !!(gh && gh.upstreamOk),// 由 /health 派生，不再依赖独立 RPC
  mux:     !!state.streamsOk.mux,
  host:    !!state.streamsOk.host,
}
```
探测触发：start()/服务器切换后立即一次；渲染时发现 gh 缺失或年龄 >20s 再补一次。status 计算（Nominal 4/4、Degraded、Offline）保持原逻辑。

### 【自测方式】
1. 无任何配置直接开 `http://127.0.0.1:8787/desktop/desktop.html` → 概述四格 Nominal（此前误报网关异常）。
2. 停掉网关 → Degraded，gateway/dsh 两格熄灭，mux/host 仍绿（WS 断开后变灰）；重启网关 → 探测恢复 Nominal。
3. 停掉 DSH 上游（3080）→ dsh 熄灭、gateway 亮（ok=true, upstreamOk=false），文案提示"DSH 上游不可达"。

---

## Bug 6：轮换令牌后桌面 401 toast 刷屏、不自动续期

### 【根因】
- 轮换：`rotateToken()`（gateway.js:190-203）写新 token 到 TOKEN_FILE + 内存、清空 wsTickets；`/admin/api/token/rotate`（:1212-1233）随后 `kickDevice(d.ip)` 踢掉除 kind==='admin' 外的所有设备 → **桌面端旧 token 立即失效**。
- 桌面 token 来源（desktop.js:2359-2370）：URL ?token= > localStorage 'token' > prompt，**无轮换后的更新路径**。
- 401 处理全是散点 toast：pollKind :1071、rpc 包装 :548/:565/:572、消息/会话/工作台 :1563/:1599/:1647/:1683/:1754/:1936/:246 等，**每个 4s 轮询周期 + WS 重连循环（1.5s→60s 退避，3 次失败转轮询）各触发一次** → toast 风暴永不停止。
- 网关对 401 原样透传（proxyApi :2093-2104、WS 升级 401 close :2408-2415），无重发新 token 机制。

### 【最小改动点】
public/desktop/desktop.js：
1. 新增 `state.authFailed` + 单一 `onAuthFail()`：首次 401 → 一次 toast + 停轮询/停重连定时器 + 显示"令牌已失效"横幅；全部 401 收口到它（把 ~10 个 `toast('ds.toastAuth','err')` 散点替换为 `return authFail()`）。
2. 自动续牌（安全边界内）：当桌面页以插件源宿主（`location.pathname` 以 `/remote/` 开头）时，**同源** fetch `/remote/admin/api/state` 取到 `json.token`，若与 state.token 不同则 `state.token = json.token; localStorage.setItem('token', ...)` 并重开流——**同源请求，无跨域，不扩大 CORS，不加 `*` 通配**（网关 CORS 保持现状）。
3. 网关源宿主（`127.0.0.1:8787`）跨域到 3080 会被拦 → 不做自动续牌，退化为：横幅 + 一次 prompt 输入新 token → 写 LS + 重开流。

### 【建议实现】（骨架）
```js
// desktop.js 新增
function authFail() {
  if (state.authFailed) return
  state.authFailed = true
  stopPolling?.(); stopReconnect?.()
  toast(t('ds.toastAuth'), 'err')              // 只弹一次
  showAuthBanner()                              // 横幅: 令牌已失效, 请重新输入
}
async function renewTokenIfPluginHosted() {      // 仅插件源同源路径
  if (!location.pathname.startsWith('/remote/')) return null
  try {
    const res = await fetch('/remote/admin/api/state')
    if (res.ok) { const j = await res.json(); if (j.token && j.token !== state.token) return j.token }
  } catch {}
  return null
}
// 各 401 点: if (res.status === 401 || e.message === 'AUTH') { const nt = await renewTokenIfPluginHosted(); if (nt) { adoptToken(nt); return } return authFail() }
```

### 【自测方式】
1. 桌面（8787 源）开着 → 管理页旋转令牌 → 桌面**只弹一次**"令牌无效"，4s 轮询/重连停止，横幅出现；输入新 token 后流恢复、概述回 Nominal。
2. 插件抽屉源打开的桌面（3080/remote/desktop/…）→ 旋转令牌 → 自动续牌，无 toast、无中断（观察 network：/remote/admin/api/state 200 + 新 token 生效）。
3. 网关 CORS 头不变（无 `*`）：`curl -sI -H "Origin: http://evil.example" http://127.0.0.1:8787/admin/api/state` 无 ACAO 通配。

---

## 附：修复与审计的边界提醒
- 全部改动零新增依赖；只动根 `public/`、`gateway.js`（改后 `cp gateway.js packages/plugin/gateway.cjs` 或 `npm run sync-plugin`），不碰 `packages/plugin/public/` 同步副本，不 commit。
- Bug 1 落地后，public/admin.js 的 pluginMode 分支（:8-13/:69-87/:622-633）与 index.mjs 中仅 admin 使用的代理（note/kick/token/rotate/gateway 等）成为死代码——见 docs/audit-report.md 的 `delete:` 项（必须等 302 上线后再删）。