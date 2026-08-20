# Preview provenance

This is a local review candidate. It has not been posted, pushed, published, or accepted.

- `acceptanceClaim`: `false`
- Capture: actual Hermes Desktop on Hyprland/Wayland, native 1920x1080 at 30 fps.
- Hermes source revision: `c94454a20980da6fb7e73c92771279447a3253db`.
- Liquid Glass base revision: `80a5771669a321d8ee5fe8365a0ffd8aadfadbf9`.
- Runtime plugin bytes: SHA-256 `83e6d03d5cabbe2769f181110a98a143c399a4aeb478070ddd8c80963f67064a`, loaded through an isolated profile symlink to the canonical repository.
- Theme bytes: SHA-256 `c81858a1957ae51024a0a5d369310f825ac137c67fdd802af7514e2514b70e8d`.
- Root-cause repair: the disk plugin initially painted before ThemeProvider hydration, then ThemeProvider restored the built-in light theme. The repaired boot path repaints the selected stored theme and glass knobs after hydration.
- Isolated setup: synthetic session store and fresh Electron user-data directory; no private sessions or account credentials were transferred.
- Demo transport: local deterministic OpenAI-compatible stream with no external inference or credentials.
- Demo content: synthetic fixture, visibly labeled `DEMO DATA`; no Boplog-native Hermes integration is claimed.
- Wallpaper: original procedural HTML animation authored for the capture. No third-party media or music.
- Audio: none.
- 16:9 SHA-256: `4a2d5a1fe09fa2274df6241ba1c6f03fc7a57303b54a70cf8a75f8551ab0abae`.
- 4:5 SHA-256: `f31a9fc1c767a9ebf441c3c32857dbc73c8266be3fb187db46252a8990440816`.
- Poster SHA-256: `4954bd68dd4c0ab941db5cffeafec3da00d54c4000acdf61797c216a46863bc5`.
- Contact sheet SHA-256: `57b6f8ace65fa77b1b06f3dcd1618090b502bc7fed0b6289a20e3e387e7f5994`.

Publication remains an explicit Captain decision on the exact video hash.
