# DSH Remote (mod) · v0.1.1-mod

> 本项目是 [Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote) 的二次开发分支（mod）。
> 原项目地址：https://github.com/Blank-not-black/dsh-Remote（原作者仓库，DSH 手机远程控制台：Android App + 单文件网关 + DSH 插件）

**中文** · [English](README.en.md)

## 此项目添加 / 修改的功能

- **工作台模式**：绑定本地文件夹，子文件夹即项目，项目级会话；左滑归档会话，归档折叠显示
- **修复**：
  - 工作台项目会话左滑无法归档
  - 归档后项目会话列表仍显示该会话，且归档折叠区不出现
  - 工作台本地目录删除后仍显示项目，并可重建空文件夹
  - 桌面端归档折叠按钮点击无效
- **手机端语音输入**：输入框语音图标 → 按住说话 → 系统语音识别，松手输入 / 上移取消，实时波形
- **设置 → 通用 → 语音输入**：仅识别原始文本 / 转换为 prompt（OpenAI 兼容 API，密钥打码，功能测试与连接测试，可复制 System Prompt）
- **输入框优化**：有文字时隐藏语音图标；超过 5 行可全屏编辑，点击全屏 / 下滑退出

## 下载 / 使用

- **Android APK**：仓库 Release v0.1.1-mod 的 `dsh-remote.apk`
- **网关**：`node gateway.js`（或插件内置网关），默认 `0.0.0.0:8787`
- 手机 App 填网关地址 + 令牌即可

## 版本

- **v0.1.1-mod**：上述修复与功能

## License

MIT
