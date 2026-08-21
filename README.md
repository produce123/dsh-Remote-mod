# 📱 DSH Remote（v0.1.0-mod 二次开发版）

> 口袋里的 DSH 控制台——手机远程会话 · 审批 · 提问 · 文件互传，局域网 / Tailscale 都能用。

本项目是基于 **[dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)**（[Gitee 镜像](https://gitee.com/Blankneverfails/dsh-Remote)）的**二次开发 Mod**：在保留原项目全部能力（安卓 App + 插件内置网关 + 独立网关一体）的基础上，新增工作台绑定模式等四项功能。

## ✨ 本 Mod 新增功能

1. **工作台绑定模式（Workbench）**
   - 电脑端（桌面 WebUI）可绑定 workspace 文件夹，提供「DSH Remote（绑定）」面板；
   - 项目级会话：手机端新增工作台会话条，可在项目内直接新建会话；
   - 自动载入子项目工作区。
2. **手机端归档会话折叠**：已归档会话收进「------隐藏/显示已归档会话------」折叠区，会话列表更清爽。
3. **/permission 二级参数选择**：`/permission` 命令支持二级参数（`read-only` / `workspace-write` / `danger-full-access`）直接选择，无需手输。
4. **手机端输入法换行修复**：修复手机输入法回车键误触发发送的问题。

## 🔧 构建

```bash
npm install
npm run build-app
```

产物：

- 调试 APK：`android/app/build/outputs/apk/debug/app-debug.apk`
- 发布用 APK：`apk/dsh-remote.apk`（版本名副本：`apk/dsh-remote-v0.1.0-mod.apk`）
- SHA-256 校验值与更新说明：`public/update.json`

## 📦 版本

- **v0.1.0-mod**（当前）

## 🔗 原项目

- GitHub: <https://github.com/Blank-not-black/dsh-Remote>
- Gitee: <https://gitee.com/Blankneverfails/dsh-Remote>
