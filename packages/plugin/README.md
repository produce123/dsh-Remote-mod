# dsh-remote-mod-plugin

DSH Remote **mod 分支** bundle 插件（独立包名，与上游 `dsh-remote-plugin` 互不冲突，注册名 `dsh-remote-mod`）。在 DSH 侧边栏提供入口，打开快速状态面板和完整管理控制台，并内置随 DSH 自动启停的远程网关。

**中文** · [English](README.en.md)

## 与原版 dsh-remote-plugin 的区别

- **修复 prompt 转写连接失败**：网关 `/transcribe` 补上 CORS 预检应答，App / 跨源环境下「连接测试 / 转写」不再误报「网络错误，请检查网络或 API 地址」；
- **转写经网关代理 + 流式输出**：OpenAI 兼容 API 请求由网关转发（规避手机 WebView 的 CORS 限制），逐字流式呈现，带连接/功能测试与空闲/总时长双超时保护；
- **反馈渠道本地化**：移除 App 内「写反馈 / 直接提交」入口，反馈改走 GitHub Issues / B站 / 邮箱；去除原作者赞助功能；
- **上游 0.6.10 稳定性修复集成**（事件通道自动重连、图片后回复进窗、并发卡片不重复追加子代理等）与多项体验修复（桌面归档开关、管理双入口统一、令牌轮换 401 收敛等）。

各版本详细变更见 [GitHub Releases](https://github.com/produce123/dsh-Remote-mod/releases)。

## 安装

```sh
# 从 npm 安装（推荐）
dsh plugin --profile web add dsh-remote-mod-plugin

# 指定版本，或本仓库 Releases 附带的 tgz 用本地路径安装
dsh plugin --profile web add dsh-remote-mod-plugin@0.7.2-mod
# dsh plugin --profile web add /绝对路径/dsh-remote-mod-plugin-0.7.2-mod.tgz
```

重启 DSH Web 后刷新浏览器，左侧边栏会出现 DSH Remote 入口。

## 插件提供什么

- 快速面板：网关状态、在线设备、Token 用量和快捷操作；
- 管理控制台：端口、上游、设备、请求、Token 统计、二维码和令牌轮换；
- 内置 `gateway.cjs`：默认监听 `0.0.0.0:8787`，带 Bearer token 鉴权；
- 网关自愈：DSH 重启或网关意外退出后自动拉起，可在面板中停止或启动；
- `/fs/*` 文件端点：列表、下载、分块上传、断点续传、暂停/继续/取消和 SHA-256 校验；
- 手机端、桌面端和管理页 WebUI，以及随插件分发的 Android APK。

## 手机端能力

Android 应用 / 手机 WebUI 采用五个主要页面：会话、文件、主页、统计、设置。会话详情支持目标控制、子代理中断、模型切换、全屏输入、斜杠命令和图片附件。图片附件可从相机或相册选择，并以 `session.prompt` 图片内容发送到当前会话。

通知设置支持审批 / 提问通知、后台轮询、峰谷提醒、任务完成提醒和历史公告。当前保留四套主题：默认深空、落日、易北爱乐厅、草原孤塔。

## 网关配置

- 网关端口优先级：`DSH_REMOTE_GATEWAY_PORT` 环境变量 → `~/.dsh-remote/gateway-port` → `8787`；
- 令牌：`~/.dsh-remote/token`，首次运行自动生成；
- 自愈开关：`~/.dsh-remote/gateway.enabled`，或使用 `DSH_REMOTE_AUTOSTART=0` 禁用自动管理；
- 文件根目录：`DSH_REMOTE_FS_ROOT`，Linux/macOS 使用 `:`，Windows 使用 `;`；
- 文件上限：`DSH_REMOTE_FS_MAX_UPLOAD`，默认 2GB；
- DSH 上游：默认 `http://127.0.0.1:3080`。

令牌等同于 DSH 远程操作凭证，请不要公开或提交到仓库。局域网访问建议配合防火墙；跨网络访问建议使用 Tailscale 或其他带认证的安全隧道。

## 相关地址

- 管理页：`http://<网关IP>:8787/admin`
- 桌面 WebUI：`http://<网关IP>:8787`
- 主项目（上游）：[dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
- 本 fork（mod）：[dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)
- 正式版本：[GitHub Releases](https://github.com/produce123/dsh-Remote-mod/releases/latest)

## License

MIT