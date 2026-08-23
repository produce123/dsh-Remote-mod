# v0.7.4-mod npm 发布手册（dsh-remote-mod-plugin）

> 本 fork 的 CI（release-build.yml）在 fork 上**没有 NPM_TOKEN**，npm publish 步骤被 secret 门控跳过，
> 插件以 `packages/plugin/dsh-remote-mod-plugin-0.7.4-mod.tgz`（GitHub Release 资产）交付。
> npm 发布由用户手动执行（v0.6.9-mod ~ v0.7.3-mod 均在 npm registry 手动发布，本轮沿用同一流程）。

## 一、发布前检查

```bash
# 1. 确认版本号正确（应已由本轮版本化为 0.7.4-mod）
node -p "require('./packages/plugin/package.json').version"   # → 0.7.4-mod

# 2. 确认 tgz 已构建（本轮已生成，见仓库根目录）
ls packages/plugin/dsh-remote-mod-plugin-0.7.4-mod.tgz

# 3. 确认上传 npm 的产物内容正确（可选检查）
cd packages/plugin && npm pack --dry-run
```

## 二、登录 npm（首次 / 过期时）

```bash
npm login
# 触发浏览器 / OTP 2FA 验证
```

## 三、发布

```bash
cd packages/plugin

# 0.7.4-mod 是预发布版本号（含 - 后缀），必须显式 --tag，否则 npm 会拒绝发布
npm publish --access public --tag latest
```

说明：

- `--access public`：包是 scoped 之外的公开包，显式声明公开访问权限；
- `--tag latest`：0.7.4-mod 带预发布后缀，npm 默认不让你直接打 latest；如希望用户
  `npm i dsh-remote-mod-plugin` 拿到 0.7.4-mod 就显式 `--tag latest`（与之前各 -mod 版本一致）；
  若想走常规预发布 tag 规则，可改用 `--tag next`，但安装命令需 `dsh-remote-mod-plugin@next`；
- 会触发浏览器 / OTP 2FA 验证：保持登录态，按提示完成验证码输入；
- 若报 `403 E409` 表示该版本已存在（重复发布），检查 `npm view dsh-remote-mod-plugin versions`。

### 已发布过该版本号怎么办（403：cannot publish over previously published versions）

同一版本号不能覆盖发布。修复版仍想用 0.7.4-mod 的，先撤旧再重发（仅限发布后 72 小时内、且无人依赖）：

```bash
cd packages/plugin
npm unpublish dsh-remote-mod-plugin@0.7.4-mod --force   # 撤下旧(未修复)版本
npm publish --access public --tag latest                # 重发当前目录里的修复版
```

> 注意：`npm unpublish` 与 `npm publish` 都必须在你已登录 npm 的终端里交互完成（会弹浏览器验证）。
> 若撤不下来（超过 72h 或已有依赖），改用递增版本号方案：
>
> ```bash
> # 把 packages/plugin/package.json 的 version 改为 0.7.4-mod.1 后：
> cd packages/plugin && npm pack && npm publish --access public --tag latest
> # 安装命令相应改为 dsh-remote-mod-plugin@0.7.4-mod.1（不带后缀仍拿 latest）
> ```

## 四、安装验证（发布后必须验证一次）

```bash
# 1. 从 npm 安装（走真实 registry，验证发布成功）
dsh plugin --profile web add dsh-remote-mod-plugin

# 或指定版本
dsh plugin --profile web add dsh-remote-mod-plugin@0.7.4-mod

# 2. 重启 DSH Web（插件自愈拉起内置网关）
#    Windows/Linux: 重启 dsh web 服务进程即可

# 3. 浏览器强制刷新（Ctrl+Shift+R，避免旧缓存）
#    左侧边栏应出现 DSH Remote 入口；打开抽屉管理页确认网关运行、设备列表正常
```

## 五、核对发布结果

```bash
npm view dsh-remote-mod-plugin versions --json   # 应包含 0.7.4-mod
npm view dsh-remote-mod-plugin dist-tags          # latest 应指向 0.7.4-mod
```

## 回滚（如需）

```bash
npm unpublish dsh-remote-mod-plugin@0.7.4-mod --force   # 仅限 72 小时内未依赖该版本
```
