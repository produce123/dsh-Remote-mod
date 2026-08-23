# DSH Remote (mod)

DSH (DeepSeek Harness) remote console: view sessions, handle approvals and questions, and transfer files from your phone or another computer. It consists of three parts: a **DSH plugin** (with a self-managed built-in gateway), a **standalone single-file gateway**, and an **Android app / WebUI**.

> **Upstream project** (maintained by the original author): [Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
> **This fork (mod branch)**: [produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)

## Differences from upstream

This fork keeps all upstream features and applies the following modifications (per-version details live in [Releases](https://github.com/produce123/dsh-Remote-mod/releases); the README no longer keeps a version-by-version recap):

1. **Independent plugin package**: shipped as `dsh-remote-mod-plugin` (registered as `dsh-remote-mod`) so it never conflicts with the upstream `dsh-remote-plugin` — both can be installed side by side.
2. **New "prompt transcribe" feature**: Settings → General → enable; a "Transcribe" button appears in the fullscreen composer and rewrites informal input into a clean, well-structured prompt using any OpenAI-compatible API; ships a fixed system prompt plus a Doubao alternative with one-click copy.
3. **Fixed transcribe connection failures** (v0.7.2-mod): the gateway `/transcribe` route did not answer browser CORS preflight requests, so "connection test" and transcribe calls were blocked in the app / cross-origin environments and misreported as "network error — check your network or API address". Preflight OPTIONS is now answered consistently with all other gateway routes.
4. **Transcribe requests are proxied through the gateway**: avoids the CORS limit when the phone WebView calls third-party APIs directly; streaming output appears word by word, transient network failures retry once, idle / total timeouts protect the request, and a failure restores the original input (nothing is lost). The connection test shows real latency and clear failure reasons (auth failed, base URL should end with /v1, quota exceeded, etc.).
5. **Upstream 0.6.10 stability fixes integrated**: the event channel auto-reconnects after a DSH/gateway restart or a short upstream outage; replies that follow an image-inflated history view still scroll into view; concurrent session-card requests no longer append duplicate subagents; channels opened after mux/host refresh the connection overview; LAN interface enumeration is fault-tolerant.
6. **Feedback localized**: sponsor features removed site-wide; feedback goes through GitHub Issues / Bilibili / email; the **"Write feedback / submit from the app" entry is removed from the mobile UI** (v0.7.2-mod); no third-party collector forwards feedback anymore.
7. **UX fixes**: unified admin entry (`/remote/admin` 302s to the gateway origin); the desktop archived-session toggle works again; admin device list grouped by IP; mobile composer flush to the bottom; the desktop "gateway unhealthy" false alarm replaced by a real `/health` probe; 401 toasts after token rotation collapsed into a single prompt with auto renewal.
8. **Engineering**: whole-repo ponytail audit cleanup (~110 lines removed); upstream tests fully ported and passing (`npm run check`); **zero new dependencies**.

## Install & use

### 1. Install the plugin (host running DSH Web)

```sh
# From npm (recommended)
dsh plugin --profile web add dsh-remote-mod-plugin

# Or install the tarball shipped in Releases
dsh plugin --profile web add /abs/path/dsh-remote-mod-plugin-0.7.2-mod.tgz
```

Restart DSH Web and hard-refresh the browser (Ctrl+F5) — the DSH Remote sidebar entry appears. The gateway listens on `0.0.0.0:8787` by default and is auto-started/healed with DSH (port can be changed in the plugin panel or via the `DSH_REMOTE_GATEWAY_PORT` env var).

> No plugin? Run the standalone gateway directly: `node gateway.js` (or the Node-free single-file binary in Releases).

### 2. Access token

The token lives in `~/.dsh-remote/token` on the host and is auto-generated on first gateway start. The admin page (`http://<pc-ip>:8787/admin` or the plugin drawer) shows/copies it. It grants remote control — keep it private.

### 3. Phone (either)

- **Android app**: install `dsh-remote.apk` from Releases; Settings → Server → scan the QR code (admin page) or enter `http://<pc-ip>:8787` plus the token;
- **Mobile WebUI**: open `http://<pc-ip>:8787` in the phone browser and enter the server + token the same way.

LAN and Tailscale are both supported; multi-server auto speed selection, auto-reconnect, and degraded polling fallback included.

### 4. Desktop

Open `http://<pc-ip>:8787` in a desktop browser for the desktop WebUI, or `http://<pc-ip>:8787/admin` for the admin page.

## Build & test

```bash
npm install
npm run check          # syntax checks + Node unit/integration tests
npm run sync-plugin    # sync public/ and gateway.js into the plugin package (always after code changes)
npm run build-app      # build the Android APK
npm run publish        # generate update.json and sync the plugin package
cd packages/plugin && npm pack   # package the plugin tarball
```

Release flow: edit code & tests → `npm run check` → build APK and sync the plugin package → commit and push the mod branch → tag `vX.Y.Z-mod` → GitHub Actions builds the release assets (APK + Linux/Windows single-file gateways + tgz + SHA256SUMS).

## Links

- Upstream: [Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
- This fork: [produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)
- Releases: [GitHub Releases](https://github.com/produce123/dsh-Remote-mod/releases)
- Feedback: [Issues](https://github.com/produce123/dsh-Remote-mod/issues) / [Bilibili](https://space.bilibili.com/3546916338010193/dynamic) / p2128887242@outlook.com

## License

MIT