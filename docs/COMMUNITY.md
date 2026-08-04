# Community / Discord pitch

Copy-paste friendly text for Nous Research Discord  
**`#plugins-skills-and-skins`**.

---

## Short pitch

**hermes-liquid-glass** — Linux liquid glass for Hermes Desktop.

Wallpaper / Wallpaper Engine → **pywal** → **Hyprland frost** → Desktop theme  
plugin that auto-recolors chrome when the wallpaper changes.

Repo: https://github.com/kvnloo/hermes-liquid-glass

```bash
curl -fsSL https://raw.githubusercontent.com/kvnloo/hermes-liquid-glass/main/scripts/install.sh | bash
```

Then: Cmd/Ctrl+K → **Reload desktop plugins** → **Liquid Glass: sync from pywal now**.

**Needs:** Linux + Hyprland + pywal + Hermes Desktop.  
**Not** a VS Code theme pack and **not** `hermes plugins install` (those are different plugin systems).

Trailer is synthetic UI only (no real chats).

---

## Slightly longer

Shipped a small OSS bridge for people who live in Hyprland + animated wallpapers:

1. `scripts/build_theme.py` maps pywal colors → Hermes `DesktopTheme` + glass mix knobs  
2. Runtime plugin under `desktop-plugins/liquid-glass-wal` polls and live-paints (no reload flash)  
3. `hypr/liquid-glass.conf` sets Hermes window opacity; pair with `blur:ignore_opacity = true`  

Install / contrib docs in the repo. PRs welcome for palette edge cases and non-Hyprland notes.

---

## Screenshot notes

- Prefer wallpaper + frosted Hermes chrome, **not** readable private chat  
- Or use `trailer/out/liquid-glass-trailer.mp4` (demo chat only)  
- Blur sidebar session titles if you capture a real window  

---

## Maintainer checklist before posting

- [ ] `main` green, README install matches `install.sh`  
- [ ] `node --check plugin/plugin.js`  
- [ ] Fresh install path tested once (`install.sh` into a temp `HERMES_HOME`)  
- [ ] No secrets in repo  
- [ ] boplog entry present (optional)  
