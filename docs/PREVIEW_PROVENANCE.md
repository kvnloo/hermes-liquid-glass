# Preview provenance

This is a local review candidate. It has not been posted, pushed, published, or accepted.

- `acceptanceClaim`: `false`
- Capture: actual Hermes Desktop and `linux-wallpaperengine` in one Hyprland/Wayland compositor path at 30 fps.
- Horizontal setup: DP-1, native 1920x1080, transform 0.
- Vertical setup: DP-2, physical mode 1920x1080, transform 1, native compositor extent 1080x1920.
- Hermes source revision: `c94454a20980da6fb7e73c92771279447a3253db`.
- Liquid Glass repair revision: `5aa81f7e78d8027064688abbe29af0b7e3e1bf2c`.
- Runtime plugin bytes: SHA-256 `7abd8cfee94cbd5df4f1ed078a6b8e4d67cf06ece1cb50c4627935464e41edac`, loaded through isolated horizontal and vertical profiles.
- Forgotten Ruins theme bytes: SHA-256 `7f9241c2db3eb0e8029342e6bde2cf0e1d260332d3cf0ea98c67e77852e76888`.
- Clouds theme bytes: SHA-256 `402bc5530a4613c69bbbd974cba8161c1a98e9c618cae45ce1c761a345618bb6`.
- Root-cause repair: the builder mirrored one dark palette into both mode bags, while hydration could restore built-in light colors and glass knobs. The repair keeps the exact dark bag, derives a wallpaper-coherent light bag, persists mode-specific glass values, and repaints twice after hydration.
- Isolated setup: synthetic session store and fresh Electron user-data directory; no private sessions or account credentials were transferred.
- Demo transport: local deterministic OpenAI-compatible stream with no external inference or credentials.
- Demo content: synthetic fixture, visibly labeled `DEMO DATA`; no Boplog-native Hermes integration is claimed.
- Theme ID: `liquid-glass-wal`, authored by `kvnloo`; each recording uses its own isolated profile because one Hermes window has one global theme.
- Horizontal wallpaper: [Forgotten Ruins](https://steamcommunity.com/sharedfiles/filedetails/?id=2133182232), Workshop item `2133182232`, credited to Tiamat and Historyk.
- Vertical wallpaper: [Abstract Landscape](https://steamcommunity.com/sharedfiles/filedetails/?id=1888636115), Workshop item `1888636115`, uploaded by [Ark](https://steamcommunity.com/profiles/76561198095821837), SteamID64 `76561198095821837`.
- Vertical palette: exact cached pywal scheme for `/home/kvn/workspace/UX/background/3440x1440/mountain-peak-clouds.jpg`, used as the configured `Clouds` theme while the actual DP-2 Wallpaper Engine asset remains Abstract Landscape.
- Supersession: commit `dbe8379` did not use the Clouds palette on the vertical take. Its media bytes remain in Git history but are rejected and superseded by this candidate.
- Vertical attribution evidence: the unauthenticated Steam `GetPublishedFileDetails` response names title `Abstract Landscape`, creator ID `76561198095821837`, public visibility, and description `Color shift/particle/glow` plus the creator's Buy Me a Coffee URL. The creator's public Steam XML profile resolves that ID to display name `Ark`. Local `project.json` independently matches title, description, type, and public visibility. Local `appworkshop_431960.acf` independently binds item `1888636115` to size `6367689`, update time `1570983899`, and manifest `4050080889335767698`, matching the public API response.
- Usage note: neither the public Workshop metadata nor the local project metadata states a separate redistribution license. The wallpapers remain incidental third-party background media. This private review candidate does not claim ownership or broad reuse rights. Public publication remains gated on Captain review of this exact media and attribution risk.
- Audio: engine launched with `--silent --no-audio-processing`; both outputs contain no audio stream.
- Runtime plugin SHA-256: `7abd8cfee94cbd5df4f1ed078a6b8e4d67cf06ece1cb50c4627935464e41edac`.
- Vertical local `project.json` SHA-256: `8db8f2642d28fe638c338991a1ea2c262af72722b3c3069df53da6d065405a3c`.
- Horizontal 16:9 SHA-256: `c53bdbb523e2f532975fe4c1ca5e22b5bcf8bce94a38b9fc2c691e0c81edc457`.
- Vertical 9:16 SHA-256: `a98b38b65807a59331bb3f9f0bb1d3bb3f99005be863d9a704cc71bb54bb04de`.
- Horizontal poster SHA-256: `56e8bc7573e6ce7a38a52a621d99766dfd77c4042ce9de8b5c4fa4438908d37b`.
- Vertical poster SHA-256: `da7bfad9156671be4e7887dfbb044b55b5a4fc1e654ec7f2eaaefb80c650b740`.
- Dual-monitor contact sheet SHA-256: `42918adc47cfaa799dd8875e11d37d42ab799b15a4cf2ad263336f11338e59a5`.
- Five-state theme proof sheet SHA-256: `78531fa0df9c38925dd66de6a16b5007d198a9fbd155a3357466b49ca46af028`.
- Decode and motion proof: both H.264 outputs decode fully with no audio stream; sampled dark/light frame signatures differ. Horizontal is native 1920x1080 at 30 fps; vertical is native 1080x1920 at 30 fps. The live engine was started in the active Wayland session with the exact Workshop paths above and `--no-fullscreen-pause`; one-second compositor samples differed on both outputs. The co-resident Hermes3D stream remained active with no dropped-frame, reconnect, disconnect, or streaming-stop entries during either software-encoded take. GPU load returned from 49% to 46% and VRAM from 2394 MiB to 1672 MiB after restoring performance-mode `swaybg`.

Publication remains an explicit Captain decision on the exact video hash.
