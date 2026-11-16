# hermes-liquid-glass

**Linux-native liquid glass** for [Hermes Desktop](https://github.com/NousResearch/hermes-agent):

`Wallpaper Engine / swww` → **pywal** → **Hyprland frost** → **Hermes Desktop plugin**

When the wallpaper changes, Desktop accent/chrome follow automatically.

> Trailer uses a **synthetic preview chat only** — no real sessions, paths, or personal content.

## Quick install

```bash
hermes plugins install kvnloo/hermes-liquid-glass
```

Then in Hermes Desktop:

1. **Settings → Plugins** → enable `liquid-glass-wal` (it ships disabled)
2. **Cmd/Ctrl+K → Liquid Glass: choose pywal folder** → pick `~/.cache/wal` (asked once; revoke under Capabilities → Plugins → Folder access)
3. Run `scripts/apply.sh` after `wal` (or wire it into your wallpaper hook)

The theme appears in the picker as **Liquid Glass (pywal)** (`liquid-glass`). Wallpaper changes repaint it live.

## What you get

| Piece | Path |
|-------|------|
| Theme builder | `scripts/build_theme.py` |
| Apply hook | `scripts/apply.sh` |
| End-user installer | `scripts/install.sh` |
| Desktop runtime plugin | `plugin/plugin.js` |
| Unified-package entrypoint | `desktop/plugin.js` (symlink to the runtime plugin) |
| Hermes CLI manifest | `plugin.yaml` + inert `__init__.py` |
| Hyprland opacity fragment | `hypr/liquid-glass.conf` |
| Trailer (Remotion) | `trailer/` |

## Requirements

- Linux + [Hyprland](https://hyprland.org/) (for real frost; plugin still themes without it)
- [pywal](https://github.com/dylanaraps/pywal) (`wal`)
- [Hermes Desktop](https://github.com/NousResearch/hermes-agent)
- Optional: Wallpaper Engine (`linux-wallpaperengine`) or any wallpaper tool that feeds pywal

## Manual install

```bash
git clone https://github.com/kvnloo/hermes-liquid-glass.git
cd hermes-liquid-glass
./scripts/install.sh
# equivalent: mkdir -p ~/.hermes/desktop-plugins && ln -sfn "$PWD/plugin" ~/.hermes/desktop-plugins/liquid-glass-wal
```

### Hyprland frost

```conf
# ~/.config/hypr/hyprland.conf
source = /absolute/path/to/hermes-liquid-glass/hypr/liquid-glass.conf

decoration {
    blur {
        enabled = true
        ignore_opacity = true   # critical — otherwise muddy fade
        # size / passes to taste
    }
}
```

### Wire pywal

After every `wal` run:

```bash
/path/to/hermes-liquid-glass/scripts/apply.sh
```

If you use [kvnloo/.files](https://github.com/kvnloo/.files), this is already hooked from `scripts/apply-pywal-theme.sh` when the package is linked.

## How it works

1. `build_theme.py` reads `~/.cache/wal/colors.json`
2. Emits a Hermes `DesktopTheme` (+ glass mix knobs) to:
   - `~/.cache/wal/hermes-liquid-glass-theme.json`
   - `~/.hermes/liquid-glass-wal/theme.json`
3. The Desktop plugin reads `hermes-liquid-glass-theme.json` from the folder you granted (through `ctx.files`) every 4 s and contributes it to the theme registry. A changed file re-registers the theme, and the app repaints it live without a reload. With auto-apply on, a wallpaper change also selects it (`requestTheme`). Glass mix knobs ride along as the theme's `customCSS`, and only plain percentages pass.
4. Hyprland `opacity` + `blur:ignore_opacity` provide frost see-through

## Palette commands

| Command | Action |
|---------|--------|
| Liquid Glass: choose pywal folder | Grant the plugin read access to `~/.cache/wal` (once) |
| Liquid Glass: sync from pywal now | Re-read the theme file and select it |
| Liquid Glass: toggle auto-apply… | Enable/disable wallpaper auto-theme |

## What it touches

- **Desktop plugin**: reads one file, `hermes-liquid-glass-theme.json`, from the folder you grant, through `ctx.files`. It saves one setting (auto-apply) in `ctx.storage`. It doesn't write app state, call the native bridge, use the network or touch credentials.
- **Python half**: inert (`register()` adds nothing).
- **Scripts** (only if you run them): `build_theme.py` writes `~/.cache/wal/hermes-liquid-glass-*.json` and `~/.hermes/liquid-glass-wal/theme.json`. `install.sh` symlinks `plugin/` into `$HERMES_HOME/desktop-plugins/`.

Upgrading from 1.x: the theme is now named `liquid-glass`. Pick it once in the theme picker, and delete the stale `liquid-glass-wal` user theme if it's still listed.

## Distribution / “store”

There is **no** Hermes Desktop marketplace selector yet. Canonical standalone
delivery remains **git + disk door** (`$HERMES_HOME/desktop-plugins/`). The repo
also follows Hermes' unified package layout (`plugin.yaml`, `__init__.py`, and
`desktop/plugin.js`) so a SHA-pinned community-index install can inventory the
same Desktop plugin without adding an active Python capability.

See [docs/DISTRIBUTION.md](./docs/DISTRIBUTION.md) and [docs/COMMUNITY.md](./docs/COMMUNITY.md) (Discord pitch).

The community index is a CLI discovery/install surface, not a Desktop-native
marketplace. VS Code Marketplace themes are a different system.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

```bash
node --check plugin/plugin.js
node --test tests/
./scripts/apply.sh
# Reload desktop plugins in Hermes
```

## Local single-source layout

On this machine (Hermes + optional `.files`):

| Consumer | Points at |
|----------|-----------|
| Hermes live plugin | `~/.hermes/desktop-plugins/liquid-glass-wal` → `./plugin` |
| `.files` package | `config/hermes-liquid-glass` → this repo |
| Theme data (generated) | `~/.hermes/liquid-glass-wal/theme.json` + `~/.cache/wal/…` |

```bash
./scripts/sync-layout.sh
```

## Trailer

Privacy-safe Remotion trailer (demo UI only):

```bash
cd trailer
npm install
npx remotion render src/index.tsx LiquidGlassTrailer out/liquid-glass-trailer.mp4 \
  --browser-executable="$(command -v chromium || command -v google-chrome-stable)"
```

## License

MIT — see [LICENSE](./LICENSE)
