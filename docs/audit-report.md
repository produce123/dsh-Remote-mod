# dsh-Remote-mod 全仓 ponytail 审计（t1）

> 范围：gateway.js、gateway-stats.cjs、packages/plugin/*、public/*.{js,html,css}、public/desktop/*、android/、scripts/*、tests/*、.github/workflows/*。只审**过度工程**；correctness/安全/性能问题不入账但注明归到哪条修复。仓库零依赖硬约束（AGENTS.md）意味着 `stdlib:`/`native:` 只指出"平台已内置、无需自造"的点，不作为引入第三方库的理由。
>
> 重要背景：当前 mod HEAD 是从上游 0.6.10-rc.1 重开的分支，v0.6.9-mod 的修复全部丢失（见 docs/bug-rootcause.md 开头）。因此下列"与 v0.6.9-mod 对比"同时解释了历史遗留 vs 回归差别。

## 发现（按收益排序）

1. `delete:` **public/admin.js 的 pluginMode 分支**（约 35-40 行）——admin 从插件源 302 统一到网关后（Bug 1 修复落地），admin 页面只会在 8787 源渲染，`pluginMode`（admin.js:10-13）、插件源 API 基址（:13/:30）、`loadGatewayConfig`（:69-87 端口编辑）、pluginMode 登录分支（:622-633）全部不可达（?embedded=1 无调用方：抽屉嵌的是 plugin.html 非 admin）。替换为：删掉分支，API 恒为 `/admin/api`。**等 Bug 1 上线后再删**；v0.6.9-mod 重写时（-219 行）正是这么做的。
2. `delete:` **packages/plugin/index.mjs 中仅供 admin 使用的代理端点**（约 40 行）——admin 统一到网关后，`/remote/admin/api/note|kick|token/rotate`（index.mjs:550-568）与 `/remote/admin/api/gateway`（:620-641）只剩插件源 admin 调用。**保留** state（plugin.js 面板）、config（plugin.js + gate 启动）、dsh（app.js 手机端 DSH 控制面板 adminApiUrl）、stats（plugin.js usage）代理。也等 Bug 1 落地后删。
3. `shrink:` **public/desktop/desktop.js 401 处理去重**（净 -20 行左右）——10 处 `toast(t('ds.toastAuth'),'err')` 散点（:246/:548/:565/:572/:1071/:1563/:1599/:1647/:1683/:1754/:1936）收口为单一 `authFail()` 守卫 + 可选自动续牌；既是 Bug 6 修复本身，也是本仓最大的重复代码块收敛。
4. `shrink:` **gateway.js deviceViews() 输出层合并**（净 -15 行）——现状每 Map key 一行（:315-333），Bug 3 修完聚合后输出更短（每 IP 一行），同时删掉 admin 端对"未知"类型的特判需求；内部 Map/通道记账不动。
5. `delete:` **public/desktop/desktop.html 里的旧版简介/公告区块**（待核）——desktop.html 636 行未全文比对，标记为低优先：与 index.html 的公告实现对比后决定（公告横幅在 admin/desktop 是否真的需要双份）。
6. `yagni:` **gateway.js 云更新检查链路**（~100 行，:379-500）——`checkForUpdates`/`httpGetJson`（GitHub API + 镜像回退 + 代理 env + 6s 超时 + User-Agent）与核心网关职责（代理/WS/设备/stats）无关；本地局域网部署场景价值低，但它是上游正式功能且发布流程依赖 announce 推送。**建议保留**（YAGNI 优先砍，但砍它属于产品决策，超出本次 6 bug 范围），仅标注：若砍，`/admin/api/state` 的 update 字段与 plugin.html 公告弹窗同步删。
7. `yagni:` **gateway-stats.cjs 硬编码价格表的"v2 可配置"注记**（:19-33）——`PRICES`/`PEAK_HOURS` 是 v1 设计上限，代码自身没有过度抽象；不删，但加 `ponytail:` 注释已表达。审计结论：**保持现状**，不列为改动。
8. `stdlib:`（仅提示，不动）——
   - public/app.js:94 `uuid()` 手写回退 vs :18 已用 `crypto.randomUUID`：:94 的 `'r'+Math.random()` 回退分支在 HTTPS/localhost 环境永远走不到，可简化为 `globalThis.crypto.randomUUID()`（一行；若坚持兼容旧 WebView 可保留——**低优先**）。
   - gateway.js 手工 RFC6455 ping/pong 编码（30s/90s 心跳）：Node 无内置 WS 客户端，零依赖约束下自造是**正确**选择，不判过度工程。
   - public/md.js 手工 Markdown 渲染器（先 esc 再转标记、无依赖、有 md.test.js）：符合零依赖约束，正确。
   - MIME 表（gateway.js ~95 行）：Node 无内置 content-type map，正确。
9. `shrink:` **public/admin.js 双轮询**（低优先，待核）——grep 到两处 `setInterval(loadState, 5000)`（admin.js:379 与 :617），疑似历史遗留的双启动路径；核对后合一（-5 行）。若 :379 属于被 pluginMode 分支包裹的死代码则随第 1 项一起删。
10. `delete:` **public/announcements.json 拉取路径的兼容分支**（待核）——announce 解析里对旧格式的容错（若存在）随版本收敛可删；确认调用方后定夺（低优先，不深挖）。

## 判定为"不动"的项（防误删）
- scripts/*.mjs + .github/workflows/*.yml + scripts/sync-gitee-*.sh：发布/同步管线（release 流程依赖），属用户明确要求的功能，非过度工程。
- tests/*.test.js（825+46+153+28 行，node:test 零依赖）：`npm run check` 20/20 的既有正确性护栏，保留；新逻辑补最小单测（Bug 3 deviceViews 聚合、Bug 6 authFail）。
- android/：MainActivity 桥、RemotePollService、PeakReminderService 为原生能力，Java 侧无重复抽象；styles.xml 缺 edge-to-edge 标志归 Bug 4。
- packages/plugin/client.js（抽屉 iframe + postMessage 契约）：与 admin 302 无耦合，不动。
- public/desktop/desktop.css、public/theme-vars.css、public/i18n.js：无过度工程发现。

## 与 v0.6.9-mod 的历史对照结论
- v0.6.9-mod 的 app.js +802 行（相册多选/模型快切/语音输入/全屏输入）与 styles.css +206 行（会话页贴底、菜单面板、相册网格）在当前树全部缺失——不是可删冗余，而是**需要回迁的功能**（Bug 4 贴底即其一）。
- v0.6.9-mod 把 admin.js 重写 -219 行（去 pluginMode/简化状态机）与 index.mjs 的 admin 302：当前树是**旧版计划**，本审计第 1/2 项即回迁该减法。

## net 估算
- 第 1 项 ~ -38 行；第 2 项 ~ -40 行；第 3 项 ~ -20 行（净）；第 4 项 ~ -15 行；第 8 项 uuid 一行可选 -1；第 9 项 ~ -5 行。
- 合计：**net: -110 ~ -120 行，-0 依赖**（零新增依赖；现有 vendor 资产 qrcode.min.js/jsqr.min.js 为扫码功能所需，保留）。
- 注：Bug 1 落地前第 1/2 项不得执行；Bug 3/6 修复与第 3/4 项天然合并，随修复一并完成，不算额外工作量。