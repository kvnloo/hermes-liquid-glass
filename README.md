# Hermes Liquid Glass — pywal + Hyprland + Desktop plugin
#
# Canonical path (dotfiles):
#   config/hermes-liquid-glass/
#
# Standalone mirror (optional publish repo):
#   ~/workspace/zer0/oss/hermes-liquid-glass  → symlink/copy of this tree
#
# What it does
# 1. `scripts/build_theme.py` maps `~/.cache/wal/colors.json` → DesktopTheme
# 2. `scripts/apply.sh` writes:
#      ~/.cache/wal/hermes-liquid-glass-theme.json
#      ~/.hermes/liquid-glass-wal/theme.json
# 3. Desktop runtime plugin `plugin/plugin.js` polls that file and activates
#    skin `liquid-glass-wal` with frost mix knobs.
# 4. `hypr/liquid-glass.conf` sets Hermes compositor opacity (Linux frost).
#
# Install
#   # plugin
#   ln -sfn ~/workspace/.files/config/hermes-liquid-glass/plugin \
#     ~/.hermes/desktop-plugins/liquid-glass-wal
#
#   # pywal hook (already wired if you use apply-pywal-theme.sh from this repo)
#   # hyprland — add near other windowrules:
#   source = ~/workspace/.files/config/hermes-liquid-glass/hypr/liquid-glass.conf
#   # and ensure decoration:blur { ignore_opacity = true }
#
#   # build once
#   ~/workspace/.files/config/hermes-liquid-glass/scripts/apply.sh
#
#   # Desktop: Cmd-K → "Reload desktop plugins"
#   # then Cmd-K → "Liquid Glass: sync from pywal now"
#
# Palette commands
#   Liquid Glass: sync from pywal now
#   Liquid Glass: toggle auto-apply on wallpaper change
