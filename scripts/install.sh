#!/usr/bin/env bash
# Install liquid-glass-wal into Hermes Desktop (+ optional Hyprland notes).
#
# Usage:
#   ./scripts/install.sh
#   curl -fsSL https://raw.githubusercontent.com/kvnloo/hermes-liquid-glass/main/scripts/install.sh | bash
#
# Env:
#   HERMES_LIQUID_GLASS_HOME  Install/clone dir (default: ~/.local/share/hermes-liquid-glass)
#   HERMES_HOME               Hermes profile root (default: ~/.hermes)
#   SKIP_APPLY=1              Skip pywal theme build
#   SKIP_CLONE=1              Use existing checkout only (must run from repo)
set -euo pipefail

REPO_URL="${HERMES_LIQUID_GLASS_REPO:-https://github.com/kvnloo/hermes-liquid-glass.git}"
INSTALL_HOME="${HERMES_LIQUID_GLASS_HOME:-$HOME/.local/share/hermes-liquid-glass}"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
PLUGIN_ID="liquid-glass-wal"

log() { printf 'hermes-liquid-glass: %s\n' "$*"; }
die() { printf 'hermes-liquid-glass: ERROR: %s\n' "$*" >&2; exit 1; }

# Resolve root: running from a clone vs curl|bash
if [[ -n ${BASH_SOURCE[0]+x} && -f ${BASH_SOURCE[0]} ]]; then
  _self=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
  if [[ -f $_self/../plugin/plugin.js ]]; then
    ROOT=$(cd -- "$_self/.." && pwd)
  fi
fi

if [[ -z ${ROOT:-} ]]; then
  if [[ ${SKIP_CLONE:-0} == 1 ]]; then
    die "SKIP_CLONE=1 but not running from a checkout"
  fi
  if [[ -d $INSTALL_HOME/.git ]]; then
    log "updating $INSTALL_HOME"
    git -C "$INSTALL_HOME" pull --ff-only || log "pull failed; using existing tree"
  else
    log "cloning into $INSTALL_HOME"
    mkdir -p "$(dirname -- "$INSTALL_HOME")"
    git clone --depth 1 "$REPO_URL" "$INSTALL_HOME"
  fi
  ROOT=$INSTALL_HOME
fi

[[ -f $ROOT/plugin/plugin.js ]] || die "plugin.js missing under $ROOT/plugin"

mkdir -p "$HERMES_HOME/desktop-plugins"
ln -sfn "$ROOT/plugin" "$HERMES_HOME/desktop-plugins/$PLUGIN_ID"
log "linked $HERMES_HOME/desktop-plugins/$PLUGIN_ID → $ROOT/plugin"

# Optional: local .files bridge
files_cfg="${WORKSPACE_FILES:-$HOME/workspace/.files}/config"
if [[ -d $files_cfg ]]; then
  if [[ -x $ROOT/scripts/sync-layout.sh ]]; then
    WORKSPACE_FILES="$(dirname -- "$files_cfg")" bash "$ROOT/scripts/sync-layout.sh" || true
  else
    ln -sfn "$ROOT" "$files_cfg/hermes-liquid-glass"
    log "linked $files_cfg/hermes-liquid-glass → $ROOT"
  fi
fi

if [[ ${SKIP_APPLY:-0} != 1 ]]; then
  if command -v python3 >/dev/null 2>&1; then
    bash "$ROOT/scripts/apply.sh" || log "apply.sh failed (need ~/.cache/wal/colors.json from pywal)"
  else
    log "python3 not found — skip theme build"
  fi
fi

HYPR_SNIPPET="$ROOT/hypr/liquid-glass.conf"
cat <<EOF

Done.

Next:
  1. Hermes Desktop → Cmd/Ctrl+K → "Reload desktop plugins"
  2. Settings → Plugins → enable "${PLUGIN_ID}" if needed
  3. Cmd/Ctrl+K → "Liquid Glass: sync from pywal now"
  4. Optional: Cmd/Ctrl+K → "Liquid Glass: toggle compact three-column layout"

Hyprland frost (Linux):
  Add to ~/.config/hypr/hyprland.conf:

    source = ${HYPR_SNIPPET}

  And under decoration:blur { ignore_opacity = true }

Wire pywal (after wal):
  ${ROOT}/scripts/apply.sh

Docs: ${ROOT}/README.md
Contributing: ${ROOT}/CONTRIBUTING.md
EOF
