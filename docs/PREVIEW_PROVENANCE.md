# Preview provenance

This is a local review candidate. It has not been posted, pushed, published, or accepted.

- `acceptanceClaim`: `false`
- Capture: actual Hermes Desktop and `linux-wallpaperengine` in one Hyprland/Wayland compositor path at 30 fps.
- Horizontal setup: DP-1, native 1920x1080, transform 0.
- Vertical setup: DP-2, physical mode 1920x1080, transform 1, native compositor extent 1080x1920.
- Hermes source revision: `c94454a20980da6fb7e73c92771279447a3253db`.
- Liquid Glass base revision: `80a5771669a321d8ee5fe8365a0ffd8aadfadbf9`.
- Runtime plugin bytes: SHA-256 `83e6d03d5cabbe2769f181110a98a143c399a4aeb478070ddd8c80963f67064a`, loaded through an isolated profile symlink to the canonical repository.
- Theme bytes: SHA-256 `c81858a1957ae51024a0a5d369310f825ac137c67fdd802af7514e2514b70e8d`.
- Root-cause repair: the disk plugin initially painted before ThemeProvider hydration, then ThemeProvider restored the built-in light theme. The repaired boot path repaints the selected stored theme and glass knobs after hydration.
- Isolated setup: synthetic session store and fresh Electron user-data directory; no private sessions or account credentials were transferred.
- Demo transport: local deterministic OpenAI-compatible stream with no external inference or credentials.
- Demo content: synthetic fixture, visibly labeled `DEMO DATA`; no Boplog-native Hermes integration is claimed.
- Theme: `hermes-liquid-glass`, authored by `kvnloo`.
- Horizontal wallpaper: [Forgotten Ruins](https://steamcommunity.com/sharedfiles/filedetails/?id=2133182232), Workshop item `2133182232`, credited to Tiamat and Historyk.
- Vertical wallpaper: [Abstract Landscape](https://steamcommunity.com/sharedfiles/filedetails/?id=1888636115), Workshop item `1888636115`, uploaded by [Ark](https://steamcommunity.com/profiles/76561198095821837), SteamID64 `76561198095821837`.
- Vertical attribution evidence: the unauthenticated Steam `GetPublishedFileDetails` response names title `Abstract Landscape`, creator ID `76561198095821837`, public visibility, and description `Color shift/particle/glow` plus the creator's Buy Me a Coffee URL. The creator's public Steam XML profile resolves that ID to display name `Ark`. Local `project.json` independently matches title, description, type, and public visibility. Local `appworkshop_431960.acf` independently binds item `1888636115` to size `6367689`, update time `1570983899`, and manifest `4050080889335767698`, matching the public API response.
- Usage note: neither the public Workshop metadata nor the local project metadata states a separate redistribution license. The wallpapers remain incidental third-party background media. This private review candidate does not claim ownership or broad reuse rights. Public publication remains gated on Captain review of this exact media and attribution risk.
- Audio: engine launched with `--silent --no-audio-processing`; both outputs contain no audio stream.
- Runtime plugin SHA-256: `83e6d03d5cabbe2769f181110a98a143c399a4aeb478070ddd8c80963f67064a`.
- Vertical local `project.json` SHA-256: `8db8f2642d28fe638c338991a1ea2c262af72722b3c3069df53da6d065405a3c`.
- Horizontal 16:9 SHA-256: `c6ecd22597f773878fc6a41e0ccb6c6c1e1555338e7b81daefbc254200f29884`.
- Vertical 9:16 SHA-256: `1f314d779aa3e49204a70e88f2de1459048bef69119b26bc702a8812e0749196`.
- Horizontal poster SHA-256: `3163ca8117a0369f1925b280121d09fa28926de5806fce6564eff7dd50676b96`.
- Vertical poster SHA-256: `77348aa70b88c7b249ab82b7b92e25674585def9bc6b7979da95be4e2bd0b56c`.
- Dual-monitor contact sheet SHA-256: `bbe1e2c1780290a184b52c103256701569741d4db3fd41ac9d918981efd629bf`.
- Motion proof: one-second-separated vertical compositor frames differ at 1063.6 normalized AE pixels while Hermes is visible. The engine layer was `linux-wallpaperengine`, PID `433531`, extent 1080x1920 during capture.
- Restoration proof: after capture, DP-2 again had a single `wallpaper` layer from `swaybg`, using `/home/kvn/.cache/wallpaper-mode/DP-2.png`; DP-1 remained on its original cached `swaybg` layer throughout the vertical run.

Publication remains an explicit Captain decision on the exact video hash.
