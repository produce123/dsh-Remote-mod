# DSH Remote (mod)

基于原作者 **Blank** 的 [dsh-Remote](https://github.com/Blank-not-black/dsh-Remote) 深度魔改的**个人版**（公开供参考使用）：在手机或另一台电脑上查看会话、处理审批与提问。由三部分组成：**DSH 插件**（内置网关自启停）＋ **独立单文件网关** ＋ **Android App / WebUI**。

> **请认准原作者与原版项目**：[Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)（DSH Remote 的全部核心能力均来自原作者的开源工作，请优先支持原作者）
> **本 fork（mod 分支，个人魔改版）**：[produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)

## 与原版的区别

本 fork 在保留上游核心功能的基础上，做了以下个人定制（各版本细节见 [Releases](https://github.com/produce123/dsh-Remote-mod/releases)，README 不再逐版本回顾）：

1. **移除文件传输功能**（v0.7.4-mod）：手机端「文件」页、上传/下载/预览、服务器端 `/fs/*` 接口全部移除（**会话页的拍照/图片附件不受影响**）。如需要在手机与电脑间同步文件，推荐开源项目 [Syncthing](https://github.com/syncthing/syncthing)。
2. **工作台保留并改造**（v0.7.4-mod）：工作台项目改为直接读取 DSH 已登记的工作区（不再扫描服务器磁盘）；桌面端绑定工作台改为从工作区列表选择，也可手动输入绝对路径。
3. **整合上游 v0.6.12**（v0.7.4-mod）：
   - **远程启动 / 重启 DSH 异步追踪**：不再统一报 502——提交后按「检查服务 → 提交命令 → 等待进程 → 等待 HTTP 恢复 → 等待实时通道」分阶段显示进度，成功展示 PID / HTTP 状态 / 用时，失败细分原因（systemctl 不存在、systemd 不可用、权限不足、服务 failed、各阶段超时等）。
   - **主页公告栏常驻**：未读公告/投票常驻主页，30 秒轮询 + 回到前台 / 网络恢复立即补查。
   - **可选中央公告源**：网关支持 `DSH_REMOTE_ANNOUNCEMENTS_URL` 指向自己的 HTTPS 公告源；**默认纯本地**，不指向任何第三方服务器。
4. **整合上游 0.6.11 功能**（v0.7.3-mod，保留）：
   - **投票公告**：公告可附带投票（单选），投票经网关校验后落在本机 `~/.dsh-remote/poll-votes.jsonl`，**不依赖任何第三方收集器**，可用 `scripts/summarize-polls.mjs` 汇总结果；历史公告里可再次参与未投的投票。
   - **周末全天谷时**：统计计费与 App 峰谷提醒同步改为周末不计高峰价（周末只在 9:00 提醒一次），并自动清理旧版 LocalNotifications 遗留的重复提醒。
   - **插件图标主题自适应**：DSH 侧边栏入口图标随 DSH 主题（默认 / 落日 / 易北爱乐厅 / 草原孤塔）自动换色。
5. **插件独立交付**：插件以独立包名 `dsh-remote-mod-plugin`（注册名 `dsh-remote-mod`）发布，与上游 `dsh-remote-plugin` 互不冲突，可同时安装。
6. **新增「prompt 转写」功能**：设置 → 通用 → 开启后，全屏输入框提供「转写」按钮，用 OpenAI 兼容 API 把口语化输入改写为条理清晰的 prompt；经网关代理转发（规避 WebView CORS 限制）、流式逐字输出、网络瞬断自动重试、失败自动恢复原文。
7. **反馈渠道本地化**：全站去除原作者赞助功能；「写反馈」改由 GitHub Issues / B 站 / 邮箱渠道承载，**手机端移除「App 内直接提交」入口**；反馈不再经任何第三方收集器转发。
8. **体验修复**：管理界面双入口统一（`/remote/admin` 302 到网关源）；桌面端侧边栏归档会话开关恢复真实切换；管理页设备列表按 IP 聚合；手机端会话页输入框贴底；桌面端「网关异常」误报改真实 `/health` 探测；令牌轮换后 401 刷屏收敛为单次提示并自动续牌。
9. **工程维护**：全仓 ponytail 审计优化；上游测试全量移植并通过（`npm run check`）；**零新增依赖**。

## 安装与使用

### 1. 安装插件（主机端，运行 DSH Web 的设备）

```sh
# 从 npm 安装（推荐）
dsh plugin --profile web add dsh-remote-mod-plugin

# 或使用 Releases 附带的 tgz 本地安装
dsh plugin --profile web add /绝对路径/dsh-remote-mod-plugin-0.7.5-mod.tgz
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

### 5. 文件同步

本 mod 不提供文件传输；手机与电脑间同步文件请使用 [Syncthing](https://github.com/syncthing/syncthing)（开源、点对点、跨平台）等工具。

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

- 上游项目（原作者）：[Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
- 本 fork（mod）：[produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)
- Releases：[GitHub Releases](https://github.com/produce123/dsh-Remote-mod/releases)
- 反馈：[Issues](https://github.com/produce123/dsh-Remote-mod/issues) / [B站动态](https://space.bilibili.com/3546916338010193/dynamic) / 邮箱 p2128887242@outlook.com

## License

MIT（修改自 [dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)）