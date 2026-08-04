#!/usr/bin/env bash
# Point local Hermes + optional .files at this OSS checkout (single source of truth).
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
hermes_home="${HERMES_HOME:-$HOME/.hermes}"
files_cfg="${WORKSPACE_FILES:-$HOME/workspace/.files}/config"
live="$hermes_home/desktop-plugins/liquid-glass-wal"

[[ -f $root/plugin/plugin.js ]] || {
  echo "missing $root/plugin/plugin.js" >&2
  exit 1
}

mkdir -p "$hermes_home/desktop-plugins"
ln -sfn "$root/plugin" "$live"
echo "live plugin → $(readlink -f "$live")"

if [[ -d $files_cfg ]]; then
  # Prefer relative link when both live under ~/workspace
  if [[ $root == "$HOME/workspace/zer0/oss/hermes-liquid-glass" && -d $HOME/workspace/.files/config ]]; then
    ln -sfn ../../zer0/oss/hermes-liquid-glass "$HOME/workspace/.files/config/hermes-liquid-glass"
  else
    ln -sfn "$root" "$files_cfg/hermes-liquid-glass"
  fi
  echo ".files config → $(readlink -f "$files_cfg/hermes-liquid-glass" 2>/dev/null || echo "$files_cfg/hermes-liquid-glass")"
else
  echo ".files config skipped (no $files_cfg)"
fi

echo "done. Hermes: Cmd/Ctrl+K → Reload desktop plugins"
