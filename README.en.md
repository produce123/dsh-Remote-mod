# DSH Remote (mod)

> **Upstream project (original author)**: [Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote)
> **This repository (mod fork)**: [produce123/dsh-Remote-mod](https://github.com/produce123/dsh-Remote-mod)

DSH (DeepSeek Harness) remote console: view sessions, handle approvals and questions, and transfer files from your phone or another computer. It consists of three parts: a **DSH plugin** (with a self-managed gateway), a **standalone single-file gateway**, and an **Android app / WebUI**.

## What this mod branch adds / fixes (v0.6.9-mod)

Based on upstream `0.6.10-rc.1`:

| # | Fix |
| --- | --- |
| 1 | Unified admin entry: `/remote/admin` redirects to the gateway-hosted admin page (token pre-filled); dead pluginMode code removed |
| 2 | Large old sessions no longer fail to load: history timeout raised to 180s with automatic retry |
| 3 | Device list groups by IP: one row per device (mux·host channels merged), admin page itself excluded |
| 4 | Mobile session input box sits flush to the bottom (removed the stale 58px gap) |
| 5 | Desktop "gateway unhealthy" false alarm fixed: real `/health` probe instead of config existence checks |
| 6 | 401 toast spam after token rotation collapsed into one notice + banner; auto token renewal when hosted by the plugin |

Plus: whole-repo audit cleanup (~110 lines removed, **zero new dependencies**), history rendering extracted into `public/history-core.js` with `tests/history.test.js`.

## Standalone plugin: dsh-remote-mod-plugin

Delivered under an independent package name so it never conflicts with the upstream `dsh-remote-plugin` (registration name `dsh-remote-mod`):

```sh
# From npm (requires publish rights; this fork does not publish to npm — for reference only)
dsh plugin --profile web add dsh-remote-mod-plugin

# From the local tarball shipped in Releases (recommended)
dsh plugin --profile web add /abs/path/dsh-remote-mod-plugin-0.6.9-mod.tgz
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
- Issues: [Issues](https://github.com/produce123/dsh-Remote-mod/issues)

## License

MIT