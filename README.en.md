# DSH Remote (mod)

> **Upstream project (original author)**: [Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
> **This repository (mod fork)**: [produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)

DSH (DeepSeek Harness) remote console: view sessions, handle approvals and questions, and transfer files from your phone or another computer. It consists of three parts: a **DSH plugin** (with a self-managed gateway), a **standalone single-file gateway**, and an **Android app / WebUI**.

## What this mod branch adds / fixes (v0.7.0-mod)

| # | Change |
| --- | --- |
| 1 | **Desktop archived-session toggle fixed**: removed the broken interceptor — collapse/expand of archived sessions now toggles reliably |
| 2 | **Original author's sponsor feature removed; channels switched to this fork**: donation entries removed site-wide; repo / feedback links now point to this repo's GitHub Issues and email (p2128887242@outlook.com); Bilibili updated to the new address; the Gitee channel is removed |
| 3 | **New "prompt transcribe" feature**: Settings → General toggle; configure an OpenAI-compatible API (base URL / model / key) with connection test and function test; a one-tap "Transcribe" button in the fullscreen composer rewrites input into a clean prompt; ships a fixed system prompt plus a Doubao alternative with one-click copy |

Also:

- README rewritten (Chinese/English kept in sync). Release pipeline reuses the flow validated in v0.6.9-mod;
- Zero new dependencies; `npm run check` all green.

## v0.6.9-mod base fixes recap

Based on upstream `0.6.10-rc.1`, 6 fixes: unified admin entry (`/remote/admin` 302 to the gateway source), 180s history timeout with automatic retry for huge old sessions, device list grouped by IP, mobile session input flush to the bottom, real `/health` probe replacing the desktop "gateway unhealthy" false alarm, and collapsed 401 toasts with auto token renewal after rotation. Plus: whole-repo ponytail audit cleanup (~110 lines removed) and the plugin renamed `dsh-remote-mod-plugin` (registration `dsh-remote-mod`) so it can coexist with the original plugin.

## Standalone plugin: dsh-remote-mod-plugin

Delivered under an independent package name so it never conflicts with the upstream `dsh-remote-plugin` (registration name `dsh-remote-mod`):

```sh
# From npm (published; see the release notes for the exact tag)
dsh plugin --profile web add dsh-remote-mod-plugin

# From the local tarball shipped in Releases (recommended)
dsh plugin --profile web add /abs/path/dsh-remote-mod-plugin-0.7.0-mod.tgz
```

Restart DSH Web and hard-refresh the browser (Ctrl+F5) to see the DSH Remote sidebar entry.

## Usage

1. Install the plugin (above); the gateway listens on `0.0.0.0:8787` by default and is managed with DSH.
2. Install the Android APK (`dsh-remote.apk` in Releases), then scan the QR code or enter `http://<pc-ip>:8787` plus the token under Settings → Server.
3. Open `http://<pc-ip>:8787` in a desktop browser for the desktop WebUI; admin page at `http://<pc-ip>:8787/admin`.

The token lives in `~/.dsh-remote/token` and grants remote control — keep it private.

## Build

```bash
npm install
npm run check          # syntax checks + Node tests
npm run sync-plugin    # sync public/ and gateway.cjs into the plugin package
npm run build-app      # build the Android APK
npm run publish        # copy APK, generate update.json, sync plugin
cd packages/plugin && npm pack   # package the plugin tarball
```

## Links

- Upstream: [Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
- This fork: [produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)
- Releases: [GitHub Releases](https://github.com/produce123/dsh-Remote-mod/releases)
- Issues: [Issues](https://github.com/produce123/dsh-Remote-mod/issues) (or email p2128887242@outlook.com)

## License

MIT