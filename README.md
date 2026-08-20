# hermes-liquid-glass

**Linux-native liquid glass** for [Hermes Desktop](https://github.com/NousResearch/hermes-agent):

`Wallpaper Engine / swww` → **pywal** → **Hyprland frost** → **Hermes Desktop plugin**

When the wallpaper changes, Desktop accent/chrome follow automatically.

> Trailer uses a **synthetic preview chat only** — no real sessions, paths, or personal content.

## Preview

[![Hermes Liquid Glass preview](./media/preview-poster.png)](./media/preview.mp4)

Actual Hermes Desktop capture with an original procedural wallpaper and a
local deterministic `DEMO DATA` stream. No external model, private session,
or account data is used. See [preview provenance](./docs/PREVIEW_PROVENANCE.md).

## Quick install

```bash
curl -fsSL https://raw.githubusercontent.com/kvnloo/hermes-liquid-glass/main/scripts/install.sh | bash
```

Then in Hermes Desktop:

1. **Cmd/Ctrl+K → Reload desktop plugins**
2. **Settings → Plugins** → enable `liquid-glass-wal` if needed
3. **Cmd/Ctrl+K → Liquid Glass: sync from pywal now**

Clone path defaults to `~/.local/share/hermes-liquid-glass`.  
Override with `HERMES_LIQUID_GLASS_HOME=/somewhere`.

## What you get

| Piece | Path |
|-------|------|
| Theme builder | `scripts/build_theme.py` |
| Apply hook | `scripts/apply.sh` |
| End-user installer | `scripts/install.sh` |
| Desktop runtime plugin | `plugin/plugin.js` |
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
3. Runtime plugin polls the file, installs skin `liquid-glass-wal`, paints CSS seeds **without** full-window reload
4. Hyprland `opacity` + `blur:ignore_opacity` provide frost see-through

## Palette commands

| Command | Action |
|---------|--------|
| Liquid Glass: sync from pywal now | Force rebuild apply + one reload |
| Liquid Glass: toggle auto-apply… | Enable/disable wallpaper auto-theme |

## Distribution / “store”

There is **no** Hermes Desktop plugin marketplace yet.  
Canonical delivery is **git + disk door** (`$HERMES_HOME/desktop-plugins/`).

See [docs/DISTRIBUTION.md](./docs/DISTRIBUTION.md) and [docs/COMMUNITY.md](./docs/COMMUNITY.md) (Discord pitch).

`hermes plugins install` and VS Code Marketplace themes are **different** systems.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

```bash
node --check plugin/plugin.js
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
