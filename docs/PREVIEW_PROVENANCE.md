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
- Horizontal 16:9 SHA-256: `29b93924f8887475e92abbb1bb16b738c2f7667e1a8e426a706357d8edcd17a7`.
- Vertical 9:16 SHA-256: `edffe19323d8a2943ee2625a229dd20bc94c7c624aeb6410df0f9e8314e6ffc6`.
- Horizontal poster SHA-256: `3760deb8aa80e7b85f216539d47eca14d9f607c51e77e7329ca0d51d84a43251`.
- Vertical poster SHA-256: `eefed454b7e986c5faf8efbfeeb878c797e0cf4b44a3cd2d41ad029b6dd9360d`.
- Dual-monitor contact sheet SHA-256: `8418046ead5aee8a76c476f0c88b370e931d9c4b5a41095c3d286450c2cb3779`.
- Five-state theme proof sheet SHA-256: `78531fa0df9c38925dd66de6a16b5007d198a9fbd155a3357466b49ca46af028`.
- Decode and motion proof: both H.264 outputs decode fully with no audio stream; sampled dark/light frame signatures differ. Horizontal is native 1920x1080 at 30 fps; vertical is native 1080x1920 at 30 fps.

Publication remains an explicit Captain decision on the exact video hash.
