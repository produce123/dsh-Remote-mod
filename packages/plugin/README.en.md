# dsh-remote-mod-plugin

DSH Remote **mod-branch** bundle plugin (independent package name — never conflicts with the upstream `dsh-remote-plugin`; registered as `dsh-remote-mod`). It adds a DSH sidebar entry, a compact status panel, a full admin console, and a gateway managed alongside DSH.

[English](README.en.md) · [中文](README.md)

## Differences from the upstream dsh-remote-plugin

- **Transcribe connection failures fixed**: the gateway `/transcribe` route now answers CORS preflight requests, so "connection test / transcribe" no longer misreports "network error — check your network or API address" in the app / cross-origin environments;
- **Transcribe proxied through the gateway with streaming output**: OpenAI-compatible API calls are forwarded by the gateway (avoids the mobile WebView CORS limit), rendered word by word, with connection/function tests and idle/total timeout protection;
- **Feedback localized**: the in-app "write feedback / submit from the app" entry is removed; feedback goes through GitHub Issues / Bilibili / email; sponsor features removed;
- **Upstream 0.6.10 stability fixes integrated** (event channel auto-reconnect, replies after an image-inflated history stay in view, no duplicate subagents on concurrent session-card requests) plus UX fixes (desktop archive toggle, unified admin entry, collapapped 401 toasts with token renewal).

Per-version details: [GitHub Releases](https://github.com/produce123/dsh-Remote-mod/releases).

## Install

```sh
# From npm (recommended)
dsh plugin --profile web add dsh-remote-mod-plugin

# Pin a version, or install the tgz shipped in Releases by local path
dsh plugin --profile web add dsh-remote-mod-plugin@0.7.2-mod
# dsh plugin --profile web add /abs/path/dsh-remote-mod-plugin-0.7.2-mod.tgz
```

Restart DSH Web and refresh the browser. The DSH Remote entry will appear in the sidebar.

## What the plugin provides

- Compact panel: gateway state, connected devices, token usage, and quick actions.
- Admin console: port, upstream, devices, requests, token statistics, QR pairing, and token rotation.
- Bundled `gateway.cjs`: Bearer-token gateway listening on `0.0.0.0:8787` by default.
- Self-healing lifecycle: relaunches the gateway after a DSH restart or unexpected exit; start and stop it from the panel.
- `/fs/*` file endpoints: list, download, chunked upload, resume, pause/continue/cancel, and SHA-256 verification.
- Mobile, desktop, and admin WebUI assets, plus the Android APK distributed with the plugin.

## Mobile capabilities

The Android app / mobile WebUI has five main destinations: Sessions, Files, Home, Stats, and Settings. Session detail supports goals, subagent interruption, model selection, fullscreen input, slash commands, and image attachments. Images can come from the camera or gallery and are sent as image content in `session.prompt`.

Notification settings include approval / question notifications, background polling, peak reminders, task completion notices, and announcement history. Four themes are retained: Default Deep Space, Sunset, Elbphilharmonie, and Prairie Tower.

## Gateway configuration

- Port priority: `DSH_REMOTE_GATEWAY_PORT` → `~/.dsh-remote/gateway-port` → `8787`.
- Token: `~/.dsh-remote/token`, generated on first run.
- Self-healing: `~/.dsh-remote/gateway.enabled`; use `DSH_REMOTE_AUTOSTART=0` to disable automatic management.
- File roots: `DSH_REMOTE_FS_ROOT`, separated by `:` on Linux/macOS and `;` on Windows.
- Upload limit: `DSH_REMOTE_FS_MAX_UPLOAD`, 2 GB by default.
- DSH upstream: `http://127.0.0.1:3080` by default.

The token grants remote control of DSH. Keep it private. For cross-network access, prefer Tailscale or another authenticated secure tunnel.

## Links

- Admin page: `http://<gateway-ip>:8787/admin`
- Desktop WebUI: `http://<gateway-ip>:8787`
- Main project (upstream): [dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
- This fork (mod): [dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)
- Stable releases: [GitHub Releases](https://github.com/produce123/dsh-Remote-mod/releases/latest)

## License

MIT