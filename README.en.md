# DSH Remote (mod) · v0.1.2-mod

> This project is a fork (mod) of [Blank-not-black/dsh-Remote](https://github.com/Blank-not-black/dsh-Remote).
> Original repository: https://github.com/Blank-not-black/dsh-Remote (a DSH mobile remote console: Android App + single-file gateway + DSH plugin)

**English** · [中文](README.md)

## Features added / changed in this fork

- **Workbench mode**: bind a local folder — subfolders are projects, each with project-level sessions; swipe to archive sessions, archived sessions shown in a collapsible section
- **Fixes**:
  - Workbench project sessions could not be archived by swipe
  - Archived sessions still appeared in the project session list, and the archived collapsible section did not show up
  - Deleted workbench local directories still showed as projects and could be recreated as empty folders
  - The desktop archive collapse button did not respond to clicks
- **Mobile voice input**: tap the voice icon inside the input box → hold to speak → system speech recognition; release to input / slide up to cancel, with a live waveform
  - v0.1.2-mod fixes: voice icon not showing, hold-to-talk instantly cancelling on the feature-test page, and the system recognizer spuriously reporting “Recognition error (9)” — now uses pointer capture gestures, pre-requests the microphone permission, guards against orphaned sessions after the permission grant, auto-retries the first error, and prefers on-device recognition
- **Settings → General → Voice input**: raw text only / convert to prompt (OpenAI-compatible API, masked API key, feature test and connection test, copyable System Prompt)
- **Input box improvements**: hide the voice icon when there is text; full-screen editing when the input exceeds 5 lines — tap to enter full screen / swipe down to exit

## Download / Usage

- **Android APK**: `dsh-remote.apk` in the v0.1.2-mod release
- **Gateway**: `node gateway.js` (or the plugin's built-in gateway), default `0.0.0.0:8787`
- Enter the gateway address + token in the mobile app

## Versions

- **v0.1.2-mod**: voice input fixes (icon visibility / instant cancel / recognition error 9 / gesture stability)
- **v0.1.1-mod**: workbench & archive fixes + voice input + input-box full screen

## License

MIT
