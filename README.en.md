# DSH Remote (mod) · v0.1.3-mod

> This project is a fork (mod) of [Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote).
> Original repository: https://github.com/Blank-not-black/dsh-Remote (a DSH mobile remote console: Android App + single-file gateway + DSH plugin)
> This repository: https://github.com/produce123/dsh-Remote-mod (mod branch)

**English** · [中文](README.md)

## Features added / changed in this fork

- **Unified admin page**: served by the standalone gateway at `http://<gateway>:8787/admin?token=<token>`; the plugin's `/remote/admin*` redirects there
- **Fixed admin device list**: duplicate / stale "connected devices" entries (e.g. 2 devices showing 6 rows)
- **Fixed desktop archive collapse**: the archive collapse button did not respond to clicks
- **Mobile voice input**: hold to speak / slide up to cancel / live waveform animation (pointer-capture gestures; result auto-inserted when recognition finishes)
- **Bottom-pinned input bar**: camera / ＋ / voice buttons + multi-select photo picker (up to 9); full-screen editing when the input exceeds 5 lines
- **Settings → General → Voice input**: raw-text mode / convert-to-prompt mode; OpenAI-compatible API config (masked key); feature test / connection test; SenseVoice offline recognition pack
- **Fixed desktop link check**: false gateway-down reports (probes DSH through the gateway's own `/health`)
- **Workbench mode** (since v0.1.1-mod): bind a local folder — subfolders become projects with project-level sessions; swipe to archive, archived sessions shown in a collapsible section

## Usage

- **Gateway**: `node gateway.js`, listens on `0.0.0.0:8787` by default (Bearer-token auth, serves the WebUI, proxies API/WS, `/fs/*` file transfer)
- **Android App**: `dsh-remote.apk` from Releases; enter the gateway address + token
- **DSH plugin**: ships a self-managed built-in gateway — no manual start needed

## Build

```bash
npm install
npm run check        # syntax check + tests
npm run build-app    # build the Android APK
```

## Versions

- **v0.1.3-mod**: unified admin page, device list fix, voice input enhancements (waveform / album / offline pack), bottom-pinned input bar, desktop link-check fix
- **v0.1.2-mod**: four voice-input fixes (hidden icon / instant cancel / recognition error 9 / gesture stability)
- **v0.1.1-mod**: workbench & archive fixes + voice input + full-screen input editor

## License

MIT
