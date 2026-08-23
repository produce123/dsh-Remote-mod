# DSH Remote (mod)

> **上游项目（原作者）**：[Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
> **本仓库（mod 分支 fork）**：[produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)

DSH（DeepSeek Harness）远程控制台：在手机或另一台电脑上查看会话、处理审批与提问、传输文件。由三部分组成：**DSH 插件**（内置网关自启停）＋ **独立单文件网关** ＋ **Android 应用 / WebUI**。

## 本 mod 分支新增 / 修复（v0.7.1-mod）

| # | 内容 |
| --- | --- |
| 1 | **整合上游 0.6.10 的稳定性与竞态修复**：DSH / 网关重启或上游短时不可达后，事件通道自动重连恢复（不再需要手动刷新）；图片异步撑高历史区后紧随的实时回复仍进入可见窗口；并发会话卡片请求不再重复追加子代理；mux/host 后打开的通道同步刷新「连接总览」；局域网地址枚举容错（异常网络接口不拖垮网关/插件） |
| 2 | **「prompt 转写」全面优化**：转写请求改经网关代理转发，规避手机 WebView 直连第三方 API 的 **CORS 限制**（原来时好时坏的「连接失败」根因）；改为**流式输出**，逐字实时呈现，不再干等全量返回（原来等待时间长）；网络瞬断自动**重试一次**；新增**空闲 / 总时长双超时保护**；中途失败自动恢复原文，不丢输入。连接测试同样走代理，展示真实耗时 |
| 3 | **反馈提交彻底本地化**：「写反馈」改为直接唤起邮件客户端发送至维护者邮箱，网关不再向任何第三方收集器转发用户反馈（尊重原作者，杜绝打扰） |

配套：

- 上游测试全量移植并通过（事件通道重连、插件自启/运行时、真实生命周期等，`npm run check` 57 项含 1 项 Windows 符号链接跳过）；
- 零新增依赖，发布链路沿用 v0.7.0-mod 验证过的流程。

### 转写功能说明

设置 → 通用 → 开启「prompt 转写」，配置 OpenAI 兼容 API 的**地址 / 模型 / 密钥**，可先「测试连接」（显示耗时）与「功能测试」（手动试一段文本）；然后全屏输入框左上角点「转写」，输入内容即被改写为条理清晰的提示词并**逐字输出**。内置固定 System Prompt（分条分点、逻辑清晰、修正错别字、删口语、保留原意、直接输出），也提供豆包代替方案说明与一键复制。

## v0.7.0-mod 回顾

| # | 内容 |
| --- | --- |
| 1 | 修复桌面端侧边栏归档会话开关无效（移除失效拦截逻辑，开关恢复真实切换） |
| 2 | 去除原作者赞助功能，渠道改 fork 自有（GitHub Issues / 邮件 / B 站新地址，删除 gitee 渠道） |
| 3 | 新增「prompt 转写」功能（开关 + 配置 + 连接/功能测试 + 全屏一键转写 + 豆包提示） |

## v0.6.9-mod 基础修复回顾

基于上游 `0.6.10-rc.1` 基线修复 6 项：管理界面双入口统一（`/remote/admin` 302 到网关源）、超大旧会话历史加载超时放宽至 180s 并自动重试、管理页设备列表按 IP 聚合、手机端会话页输入框贴底、桌面端「网关异常」误报改真实 `/health` 探测、令牌轮换后 401 刷屏收敛为单次提示并自动续牌。另含全仓 ponytail 审计优化（净删约 110 行）与插件更名 `dsh-remote-mod-plugin`（注册名 `dsh-remote-mod`），与原版插件互不冲突。

## 独立插件：dsh-remote-mod-plugin

本 fork 的插件以**独立包名**交付，与上游 `dsh-remote-plugin` 互不冲突（插件注册名 `dsh-remote-mod`）：

```sh
# 方式一：从 npm 安装（发布手册见 RELEASE_0.7.1_NPM_PUBLISH.md，tag latest）
dsh plugin --profile web add dsh-remote-mod-plugin

# 方式二：本仓库 Releases 附带 tgz，用本地绝对路径安装（推荐，无需 npm 发布权限）
dsh plugin --profile web add /绝对路径/dsh-remote-mod-plugin-0.7.1-mod.tgz
```

安装后重启 DSH Web 并强制刷新浏览器（Ctrl+F5），左侧边栏出现 DSH Remote 入口。

## 使用

1. 安装插件（见上）；网关默认监听 `0.0.0.0:8787`，随 DSH 自动启停与自愈；
2. 手机安装 Android APK（Releases 资产 `dsh-remote.apk`），「设置 → 服务器」扫码或填写 `http://电脑IP:8787` ＋ 令牌；
3. 电脑端打开 `http://电脑IP:8787` 进入桌面 WebUI；管理页为 `http://电脑IP:8787/admin`；
4. 反馈问题：桌面/手机端「写反馈」会唤起邮件客户端发送至维护者邮箱（亦可直接在 [Issues](https://github.com/produce123/dsh-Remote-mod/issues) 提交）。

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
- 反馈问题：[Issues](https://github.com/produce123/dsh-Remote-mod/issues)（或邮件 p2128887242@outlook.com）

## License

MIT