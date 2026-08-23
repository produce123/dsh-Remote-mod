# DSH Remote (mod)

> **上游项目（原作者）**：[Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
> **本仓库（mod 分支 fork）**：[produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)

DSH（DeepSeek Harness）远程控制台：在手机或另一台电脑上查看会话、处理审批与提问、传输文件。由三部分组成：**DSH 插件**（内置网关自启停）＋ **独立单文件网关** ＋ **Android 应用 / WebUI**。

## 本 mod 分支新增 / 修复（v0.6.9-mod）

基于上游 `0.6.10-rc.1` 基线，修复 6 项问题并完成全仓审计优化：

| # | 修复内容 |
| --- | --- |
| 1 | **管理界面双入口统一**：`/remote/admin` 统一 302 到网关源管理页（带 token 免登录），删除 pluginMode 死代码 |
| 2 | **超大旧会话历史加载失败**：手机端历史请求超时放宽至 180s 并自动重试，不再 45s 就报「加载失败」 |
| 3 | **管理页设备列表一行一设备**：按 IP 聚合多通道（mux·host）与旧 clientId 残留行，管理页自身不再计入 |
| 4 | **手机端会话页输入框贴底**：底部导航隐藏后不再残留 58px 空白带 |
| 5 | **桌面端「网关异常」误报**：改为真实 `/health` 探测 + host.describe 复核，链路健康不再误报 |
| 6 | **令牌轮换后 401 刷屏**：收敛为单次提示 + 失效横幅，插件源下自动续牌、无需手动重输 |

配套：

- 全仓 ponytail 审计优化：删除 admin pluginMode 分支、桌面端 401 处理散点收口、deviceViews 输出合并等（净删约 110 行），**零新增依赖**；
- 会话历史渲染抽出独立纯逻辑模块 `public/history-core.js`，新增 `tests/history.test.js`（`npm run check` 全绿）；
- 手机 / 桌面 / 插件面板全部同步到 v0.6.9-mod。

## 独立插件：dsh-remote-mod-plugin

本 fork 的插件以**独立包名**交付，与上游 `dsh-remote-plugin` 互不冲突（插件注册名 `dsh-remote-mod`）：

```sh
# 方式一：从 npm 安装（本 fork 未发布到 npm —— 该命令要求有发布权限，仅作说明）
dsh plugin --profile web add dsh-remote-mod-plugin

# 方式二：本仓库 Releases 附带 tgz，用本地绝对路径安装（推荐，无需 npm 发布权限）
dsh plugin --profile web add /绝对路径/dsh-remote-mod-plugin-0.6.9-mod.tgz
```

安装后重启 DSH Web 并强制刷新浏览器（Ctrl+F5），左侧边栏出现 DSH Remote 入口。

## 使用

1. 安装插件（见上）；网关默认监听 `0.0.0.0:8787`，随 DSH 自动启停与自愈；
2. 手机安装 Android APK（Releases 资产 `dsh-remote.apk`），「设置 → 服务器」扫码或填写 `http://电脑IP:8787` ＋ 令牌；
3. 电脑端打开 `http://电脑IP:8787` 进入桌面 WebUI；管理页为 `http://电脑IP:8787/admin`。

令牌保存在 `~/.dsh-remote/token`，等同远程操作凭证，请勿公开或提交到仓库。

## 构建

```bash
npm install
npm run check          # 语法检查 + Node 测试
npm run sync-plugin    # public/、gateway.cjs 同步进插件包
npm run build-app      # 构建 Android APK
npm run publish        # 复制 APK、生成 update.json、同步插件
cd packages/plugin && npm pack   # 打包插件 tgz
```

## 相关地址

- 上游项目：[Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
- 本 fork：[produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)
- Releases：[GitHub Releases](https://github.com/produce123/dsh-Remote-mod/releases)
- 反馈问题：[Issues](https://github.com/produce123/dsh-Remote-mod/issues)

## License

MIT