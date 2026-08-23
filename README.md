# DSH Remote (mod)

> **上游项目（原作者）**：[Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
> **本仓库（mod 分支 fork）**：[produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)

DSH（DeepSeek Harness）远程控制台：在手机或另一台电脑上查看会话、处理审批与提问、传输文件。由三部分组成：**DSH 插件**（内置网关自启停）＋ **独立单文件网关** ＋ **Android 应用 / WebUI**。

## 本 mod 分支新增 / 修复（v0.7.0-mod）

| # | 内容 |
| --- | --- |
| 1 | **修复桌面端侧边栏归档会话开关无效**：移除失效的拦截逻辑，归档会话折叠/展开恢复真实切换 |
| 2 | **去除原作者赞助功能，渠道改 fork 自有**：全站移除赞赏入口，仓库链接 / 反馈渠道改为本仓库 GitHub Issues 与邮件（p2128887242@outlook.com），B 站更新为新地址，删除 gitee 渠道 |
| 3 | **新增「prompt 转写」功能**：设置 → 通用可开关；配置 OpenAI 兼容 API（地址 / 模型 / 密钥），支持连接测试与功能测试；全屏输入框一键「转写」改写为条理清晰的 prompt；内置固定 System Prompt，附豆包替代提示与一键复制 |

配套：

- README 重写（中英双语同步更新），发布链路沿用 v0.6.9-mod 验证过的流程；
- 零新增依赖，`npm run check` 全绿。

## v0.6.9-mod 基础修复回顾

基于上游 `0.6.10-rc.1` 基线修复 6 项：管理界面双入口统一（`/remote/admin` 302 到网关源）、超大旧会话历史加载超时放宽至 180s 并自动重试、管理页设备列表按 IP 聚合、手机端会话页输入框贴底、桌面端「网关异常」误报改真实 `/health` 探测、令牌轮换后 401 刷屏收敛为单次提示并自动续牌。另含全仓 ponytail 审计优化（净删约 110 行）与插件更名 `dsh-remote-mod-plugin`（注册名 `dsh-remote-mod`），与原版插件互不冲突。

## 独立插件：dsh-remote-mod-plugin

本 fork 的插件以**独立包名**交付，与上游 `dsh-remote-plugin` 互不冲突（插件注册名 `dsh-remote-mod`）：

```sh
# 方式一：从 npm 安装（已发布 npm，tag 见发布手册）
dsh plugin --profile web add dsh-remote-mod-plugin

# 方式二：本仓库 Releases 附带 tgz，用本地绝对路径安装（推荐，无需 npm 发布权限）
dsh plugin --profile web add /绝对路径/dsh-remote-mod-plugin-0.7.0-mod.tgz
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
- 反馈问题：[Issues](https://github.com/produce123/dsh-Remote-mod/issues)（或邮件 p2128887242@outlook.com）

## License

MIT