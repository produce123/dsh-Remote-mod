# DSH Remote（mod 个人版）

基于原作者 **Blank** 的 [dsh-Remote](https://github.com/Blank-not-black/dsh-Remote) 深度魔改的个人版（公开供参考）：在手机或另一台电脑上查看 DSH 会话、处理审批与提问。由 **DSH 插件**（内置网关自启停）＋ **独立单文件网关** ＋ **Android App / WebUI** 三部分组成。

> **请认准原作者与原版项目**：[Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)（全部核心能力来自原作者的开源工作，请优先支持原作者）
> **本 fork（mod 分支）**：[produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod) · 各版本改动见 [Releases](https://github.com/produce123/dsh-Remote-mod/releases)

## 与原版的区别

| 维度 | 原作者 dsh-Remote | mod 版（本 fork） |
|---|---|---|
| 定位 | 官方原版 | 个人魔改版（按个人使用习惯取舍） |
| 文件传输 | 有（/fs） | **移除**，推荐 [Syncthing](https://github.com/syncthing/syncthing) |
| 工作台 | 扫描服务器磁盘 | **直接读取 DSH 已登记工作区** |
| 公告系统 | 上游公告源 | **默认纯本地**（可配置 `DSH_REMOTE_ANNOUNCEMENTS_URL`），v0.7.8-mod 起移除投票、只保留单条主公告 |
| prompt 转写 | 无 | 有（OpenAI 兼容 API，经网关代理 + 流式输出） |
| 实时推理显示 | 无 | 有（reasoning-core 共享模块，手机/桌面同步） |
| 远程启动/重启 DSH | v0.6.12 起 | 沿用上游（异步分阶段追踪 + 证据链） |
| 插件包 | `dsh-remote-plugin` | `dsh-remote-mod-plugin`（注册名 `dsh-remote-mod`，**可与上游共存**） |
| 反馈渠道 | 应用内提交 | GitHub Issues / B 站 / 邮箱 |
| 上游新功能 | — | 持续跟进 v0.6.x，按个人版取舍（未整合：长按拖拽排序、模型配置编辑器、设备 ID 体系、Windows 服务等） |
| 依赖 | — | **零新增依赖**（测试仅用 Node 内置） |

## 主要特性

- **多端**：Android App、手机 WebUI、桌面 WebUI、管理页（`/admin`），多服务器自动测速切换
- **实时通道**：WS 实时推送，断线自动重连，无望时降级长轮询（v0.7.8-mod 起支持事件驱动挂起等待）
- **会话体验**：轮次排序、运行中提示、排队插话、子代理折叠、重命名、页内归档、停止本轮、恢复状态提示、空会话清理、消息来源过滤
- **可靠性**：历史缓存、投影缓冲、断连自动重建视图、后台并行轮询（v0.7.8-mod）
- **远程运维**：异步启动/重启 DSH、健康检查分支（probe=live/readiness/status）
- **App**：后台轮询、任务完成通知、峰谷提醒（周末谷时）、实时摄像头扫码配对
- **平台适配**：插件图标随 DSH 主题换色；零构建纯 JS 前端 + 单文件网关

## 安装与使用

### 1. 安装插件（推荐，跑 DSH Web 的主机）

```sh
dsh plugin --profile web add dsh-remote-mod-plugin      # 从 npm 安装
# 或本地 tgz：
dsh plugin --profile web add /绝对路径/dsh-remote-mod-plugin-0.7.8-mod.tgz
```

安装后重启 DSH Web 并强刷浏览器（Ctrl+F5），左侧出现 DSH Remote 入口；网关默认监听 `0.0.0.0:8787`，随 DSH 自动启停与自愈（端口可经 `DSH_REMOTE_GATEWAY_PORT` 或插件管理页修改）。

> 不装插件也可直接运行独立网关：`node gateway.js`（Releases 附免 Node 单文件二进制）。

### 2. 配置令牌

令牌存于主机 `~/.dsh-remote/token`（首次运行自动生成），管理页可直接查看/复制。令牌是远程操作凭证，请勿公开。

### 3. 手机端连接（二选一）

- **Android App**：安装 Releases 资产 `dsh-remote.apk`，设置 → 服务器 → 扫码（管理页二维码）或手动填写 `http://电脑IP:8787` ＋ 令牌；
- **手机 WebUI**：手机浏览器访问 `http://电脑IP:8787`，同样填入服务器与令牌。

支持局域网与 Tailscale；多服务器自动切换、断线自动重连。

### 4. 桌面端 / 管理页

电脑浏览器访问 `http://电脑IP:8787`（桌面 WebUI）或 `http://电脑IP:8787/admin`（管理页）。

### 5. 文件同步

本 mod 不提供文件传输；请使用 [Syncthing](https://github.com/syncthing/syncthing) 等工具在手机与电脑间同步文件。

## 构建与测试

```bash
npm run check          # 语法检查 + Node 单元/集成测试（80 项）
npm run sync-plugin    # public/、gateway.js → 插件包（改代码后必跑）
npm run build-app      # 构建 Android APK
npm run publish        # 生成 update.json 并同步插件包
cd packages/plugin && npm pack
```

## 相关地址

- 上游（原作者）：[Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
- 本 fork（mod）：[produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)
- Releases：[GitHub Releases](https://github.com/produce123/dsh-Remote-mod/releases)
- 反馈：[Issues](https://github.com/produce123/dsh-Remote-mod/issues) / [B站](https://space.bilibili.com/3546916338010193/dynamic) / 邮箱 p2128887242@outlook.com

## License

MIT（修改自 [dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)）