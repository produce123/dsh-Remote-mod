# dsh-remote-mod-plugin

DSH Remote **mod-branch** bundle plugin (a personal fork of the original [dsh-Remote](https://github.com/Blank-not-black/dsh-Remote) by Blank; independent package name — never conflicts with the upstream `dsh-remote-plugin`; registered as `dsh-remote-mod`). It adds a DSH sidebar entry, a compact status panel, a full admin console, and a gateway managed alongside DSH.

[English](README.en.md) · [中文](README.md)

## Differences from the upstream dsh-remote-plugin

- **File transfer removed** (v0.7.4-mod): the Files page, upload/download/preview and the gateway `/fs/*` endpoints are all gone (camera/gallery image attachments in sessions are unaffected). For file sync, use [Syncthing](https://github.com/syncthing/syncthing).
- **Workbench kept and reworked** (v0.7.4-mod): projects now come straight from DSH-registered workspaces; the desktop bind dialog picks a workspace from the list instead of browsing the server disk.
- **Upstream v0.6.12 integrated** (v0.7.4-mod): remote DSH start/restart is now an async tracked operation (staged progress + granular failure reasons); a persistent announcement board on the home page (30s polling); optional central announcements via `DSH_REMOTE_ANNOUNCEMENTS_URL` (default is local-only).
- **Upstream v0.6.11 features kept** (v0.7.3-mod): poll announcements (votes are validated by the gateway and stored locally at `~/.dsh-remote/poll-votes.jsonl`; summarize with `scripts/summarize-polls.mjs`; no third-party collector involved), weekend off-peak pricing (billing stats and in-app peak reminders treat weekends as all-day off-peak), and a plugin icon that follows the DSH theme.
- **Transcribe proxied through the gateway with streaming output**: OpenAI-compatible API calls are forwarded by the gateway (avoids the mobile WebView CORS limit), rendered word by word, with connection/function tests and idle/total timeout protection.
- **Feedback localized**: the in-app "write feedback / submit from the app" entry is removed; feedback goes through GitHub Issues / Bilibili / email; sponsor features removed.
- **Upstream stability and UX fixes integrated**: event channel auto-reconnect, desktop archive toggle, unified admin entry, collapsed 401 toasts with token renewal, etc.

Per-version details: [GitHub Releases](https://github.com/produce123/dsh-Remote-mod/releases).

## Install

```sh
# From npm (recommended)
dsh plugin --profile web add dsh-remote-mod-plugin

# Pin a version, or install the tgz shipped in Releases by local path
dsh plugin --profile web add dsh-remote-mod-plugin@0.7.5-mod
# dsh plugin --profile web add /abs/path/dsh-remote-mod-plugin-0.7.5-mod.tgz
```

Restart DSH Web and refresh the browser. The DSH Remote entry will appear in the sidebar.

## What the plugin provides

- Compact panel: gateway state, connected devices, token usage, and quick actions.
- Admin console: port, upstream, devices, requests, token statistics, QR pairing, and token rotation.
- Bundled `gateway.cjs`: Bearer-token gateway listening on `0.0.0.0:8787` by default.
- Self-healing lifecycle: relaunches the gateway after a DSH restart or unexpected exit; start and stop it from the panel.
- Mobile, desktop, and admin WebUI assets, plus the Android APK distributed with the plugin.

## Mobile capabilities

The Android app / mobile WebUI has four main destinations: Sessions, Home, Stats, and Settings. Session detail supports goals, subagent interruption, model selection, fullscreen input, slash commands, and image attachments (camera/gallery, sent as image content in `session.prompt`).

Notification settings include approval / question notifications, background polling, peak reminders, task completion notices, and announcement history. The home page shows a persistent announcement board for unread notices and polls. Four themes are retained: Default Deep Space, Sunset, Elbphilharmonie, and Prairie Tower.

## Gateway configuration

- Port priority: `DSH_REMOTE_GATEWAY_PORT` → `~/.dsh-remote/gateway-port` → `8787`.
- Token: `~/.dsh-remote/token`, generated on first run.
- Self-healing: `~/.dsh-remote/gateway.enabled`; use `DSH_REMOTE_AUTOSTART=0` to disable automatic management.
- Central announcements (optional): `DSH_REMOTE_ANNOUNCEMENTS_URL`, must be HTTPS; unset = bundled local announcements.
- DSH upstream: `http://127.0.0.1:3080` by default.

The token grants remote control of DSH. Keep it private. For cross-network access, prefer Tailscale or another authenticated secure tunnel.

## Links

- Admin page: `http://<gateway-ip>:8787/admin`
- Desktop WebUI: `http://<gateway-ip>:8787`
- Main project (original author): [dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
- This fork (mod): [dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)
- Stable releases: [GitHub Releases](https://github.com/produce123/dsh-Remote-mod/releases/latest)

## License

MIT (derived from [dsh-Remote](https://github.com/Blank-not-black/dsh-Remote))