# DSH Remote (mod)

DSH（DeepSeek Harness）远程控制台：在手机或另一台电脑上查看会话、处理审批与提问、传输文件。由三部分组成：**DSH 插件**（内置网关自启停）＋ **独立单文件网关** ＋ **Android App / WebUI**。

> **上游原版项目**（原作者维护）：[Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
> **本 fork（mod 分支）**：[produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)

## 与原版的区别

本 fork 在保留上游全部功能的基础上，做了以下修改（各版本细节见 [Releases](https://github.com/produce123/dsh-Remote-mod/releases)，README 不再逐版本回顾）：

1. **插件独立交付**：插件以独立包名 `dsh-remote-mod-plugin`（注册名 `dsh-remote-mod`）发布，与上游 `dsh-remote-plugin` 互不冲突，可同时安装。
2. **新增「prompt 转写」功能**：设置 → 通用 → 开启后，全屏输入框提供「转写」按钮，用 OpenAI 兼容 API 把口语化输入改写为条理清晰的 prompt；内置固定 System Prompt 与豆包代替方案提示、一键复制。
3. **修复转写连接失败问题**（v0.7.2-mod）：网关 `/transcribe` 未应答浏览器跨域预检请求，导致 App / 跨源环境下「连接测试」与转写请求被拦截并误报「网络错误，请检查网络或 API 地址」——现已按其它路由一致的方式正确应答 OPTIONS 预检。
4. **转写经网关代理转发**：规避手机 WebView 直连第三方 API 的 CORS 限制；流式输出逐字呈现、网络瞬断自动重试一次、空闲/总时长双超时保护、失败自动恢复原文，不丢输入。连接测试展示真实耗时与明确的失败原因（认证失败、接口地址 /v1 结尾、额度不足等）。
5. **整合上游 0.6.10 稳定性修复**：DSH / 网关重启或上游短时不可达后事件通道自动重连；图片撑高历史区后紧随的回复仍进入可见窗口；并发会话卡片请求不再重复追加子代理；mux/host 后打开的通道同步刷新连接总览；网络接口枚举容错。
6. **反馈渠道本地化**：全站去除原作者赞助功能；「写反馈」改由 GitHub Issues / B 站 / 邮箱渠道承载，**手机端移除「App 内直接提交」入口**（v0.7.2-mod）；反馈不再经任何第三方收集器转发。
7. **体验修复**：管理界面双入口统一（`/remote/admin` 302 到网关源）；桌面端侧边栏归档会话开关恢复真实切换；管理页设备列表按 IP 聚合；手机端会话页输入框贴底；桌面端「网关异常」误报改真实 `/health` 探测；令牌轮换后 401 刷屏收敛为单次提示并自动续牌。
8. **工程维护**：全仓 ponytail 审计优化（净删约 110 行冗余代码）；上游测试全量移植并通过（`npm run check`）；**零新增依赖**。

## 安装与使用

### 1. 安装插件（主机端，运行 DSH Web 的设备）

```sh
# 从 npm 安装（推荐）
dsh plugin --profile web add dsh-remote-mod-plugin

# 或使用 Releases 附带的 tgz 本地安装
dsh plugin --profile web add /绝对路径/dsh-remote-mod-plugin-0.7.2-mod.tgz
```

安装后重启 DSH Web 并强制刷新浏览器（Ctrl+F5），左侧边栏出现 DSH Remote 入口；网关默认监听 `0.0.0.0:8787`，随 DSH 自动启停与自愈（端口可改：插件管理页或 `DSH_REMOTE_GATEWAY_PORT` 环境变量）。

> 不装插件也可以直接运行独立网关：`node gateway.js`（或使用 Releases 里的免 Node 单文件二进制）。

### 2. 配置访问令牌

令牌保存在主机 `~/.dsh-remote/token`，首次运行网关自动生成。管理页（`http://电脑IP:8787/admin` 或插件抽屉）可直接查看/复制，它是远程操作凭证，请勿公开。

### 3. 手机端连接（二选一）

- **Android App**：安装 Releases 资产 `dsh-remote.apk`，设置 → 服务器 → 扫码（管理页二维码）或手动填写 `http://电脑IP:8787` ＋ 令牌；
- **手机 WebUI**：手机浏览器打开 `http://电脑IP:8787`，同样的方式填入服务器与令牌。

支持局域网与 Tailscale 访问；多服务器自动测速切换，断线自动重连、重连无望时降级轮询。

### 4. 桌面端

电脑浏览器打开 `http://电脑IP:8787` 进入桌面 WebUI，或直接访问 `http://电脑IP:8787/admin` 打开管理页。

## 构建与测试

```bash
npm install
npm run check          # 语法检查 + Node 单元/集成测试
npm run sync-plugin    # public/、gateway.js 同步进插件包（改代码后必跑）
npm run build-app      # 构建 Android APK
npm run publish        # 生成 update.json 并同步插件包
cd packages/plugin && npm pack   # 打包插件 tgz
```

发版流程：改代码与测试 → 本地 `npm run check` → 构建 APK 并同步插件包 → 提交推送 mod 分支 → 打 `vX.Y.Z-mod` 标签 → GitHub Actions 自动构建 Release 资产（APK + 双平台单文件网关 + tgz + SHA256SUMS）。

## 相关地址

- 上游项目：[Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
- 本 fork：[produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)
- Releases：[GitHub Releases](https://github.com/produce123/dsh-Remote-mod/releases)
- 反馈：[Issues](https://github.com/produce123/dsh-Remote-mod/issues) / [B站动态](https://space.bilibili.com/3546916338010193/dynamic) / 邮箱 p2128887242@outlook.com

## License

MIT