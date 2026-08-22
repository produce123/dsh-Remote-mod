# DSH Remote (mod) · v0.1.3-mod

> 本项目是 [Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote) 的二次开发分支（mod）。
> 原项目地址：https://github.com/Blank-not-black/dsh-Remote（DSH 手机远程控制台：Android App + 单文件网关 + DSH 插件）
> 本仓库：https://github.com/produce123/dsh-Remote-mod（mod 分支）

**中文** · [English](README.en.md)

## 本分支（mod）添加 / 修改的功能

- **管理界面统一**：管理页统一由独立网关托管，访问 `http://<网关>:8787/admin?token=<令牌>`，插件 `/remote/admin*` 自动跳转
- **修复管理页设备列表**：已连接设备重复 / 残留显示异常（如 2 台设备显示 6 条）
- **修复桌面端归档折叠**：归档折叠按钮点击无效
- **手机端语音输入**：按住说话 / 上移取消 / 实时波形动画（指针捕获手势，松手输入、识别结束自动写入）
- **输入框贴底布局**：相机 / ＋ / 声波按钮 + 相册多选（最多 9 张）；超过 5 行全屏编辑
- **设置 → 通用 → 语音输入**：仅识别原始文本 / 转换为 prompt 两种模式；OpenAI 兼容 API 配置（密钥打码）；功能测试 / 连接测试；SenseVoice 离线识别包
- **修复桌面端系统链路检测**：网关异常误报（以网关自身 `/health` 为准探测 DSH）
- **工作台模式**（v0.1.1-mod 起）：绑定本地文件夹，子文件夹即项目，项目级会话；左滑归档会话，归档折叠显示

## 使用

- **网关**：`node gateway.js`，默认监听 `0.0.0.0:8787`（Bearer Token 鉴权，静态托管 WebUI + API/WS 代理 + `/fs/*` 文件传输）
- **Android App**：Release 中的 `dsh-remote.apk`，填网关地址 + 令牌连接
- **DSH 插件**：插件内置网关自启停，安装后免手动启动

## 构建

```bash
npm install
npm run check        # 语法检查 + 测试
npm run build-app    # 构建 Android APK
```

## 版本

- **v0.1.3-mod**：管理界面统一、设备列表显示修复、语音输入增强（波形 / 相册 / 离线包）、输入框贴底布局、桌面端链路检测修复
- **v0.1.2-mod**：修复语音输入 4 项问题（图标不显示 / 按住瞬间取消 / 识别出错(9) / 手势稳定性）
- **v0.1.1-mod**：工作台与归档修复 + 语音输入 + 输入框全屏

## License

MIT
