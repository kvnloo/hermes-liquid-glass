#!/usr/bin/env bash
# Point local Hermes + .files at this OSS checkout (single source of truth).
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
files_cfg="${WORKSPACE_FILES:-$HOME/workspace/.files}/config"
live="$HOME/.hermes/desktop-plugins/liquid-glass-wal"

mkdir -p "$HOME/.hermes/desktop-plugins"
ln -sfn "$root/plugin" "$live"
echo "live plugin → $root/plugin"

if [[ -d $files_cfg ]]; then
  # Prefer relative link when both under ~/workspace
  if [[ $root == "$HOME/workspace/zer0/oss/hermes-liquid-glass" && -d $HOME/workspace/.files/config ]]; then
    ln -sfn ../../zer0/oss/hermes-liquid-glass "$HOME/workspace/.files/config/hermes-liquid-glass"
  else
    ln -sfn "$root" "$files_cfg/hermes-liquid-glass"
  fi
  echo ".files config → $(readlink -f "$files_cfg/hermes-liquid-glass")"
fi

echo "done. Reload desktop plugins in Hermes if it is running."
