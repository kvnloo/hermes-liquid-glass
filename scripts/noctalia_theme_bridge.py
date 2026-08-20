#!/usr/bin/env python3
"""Fail-closed Hermes recording-profile to Noctalia color-scheme bridge."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).parents[1]
PROFILES = {
    "liquid-glass-forgotten-horizontal": {"monitor": "DP-1", "wallpaper": "forgotten-ruins.png", "scheme": "LiquidGlass-Forgotten"},
    "liquid-glass-clouds-vertical": {"monitor": "DP-2", "wallpaper": "mountain-peak-clouds.jpg", "scheme": "LiquidGlass-Clouds"},
}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text())


def contrast(a: str, b: str) -> float:
    def lum(value: str) -> float:
        channels = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        channels = [x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in channels]
        return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2]
    hi, lo = sorted((lum(a), lum(b)), reverse=True)
    return (hi + .05) / (lo + .05)


def noctalia_scheme(theme: dict) -> dict:
    def variant(colors: dict) -> dict:
        on_primary = colors["primaryForeground"]
        if contrast(on_primary, colors["primary"]) < 3.0:
            alternatives = (colors["background"], colors["foreground"], "#101417", "#f4f6f8")
            on_primary = max(alternatives, key=lambda candidate: contrast(candidate, colors["primary"]))
        result = {
            "mPrimary": colors["primary"], "mOnPrimary": on_primary,
            "mSecondary": colors["midground"], "mOnSecondary": colors["background"],
            "mTertiary": colors["accentForeground"], "mOnTertiary": colors["accent"],
            "mError": colors["destructive"], "mOnError": colors["destructiveForeground"],
            "mSurface": colors["background"], "mOnSurface": colors["foreground"],
            "mSurfaceVariant": colors["card"], "mOnSurfaceVariant": colors["cardForeground"],
            "mOutline": colors["border"], "mShadow": colors["background"],
            "mHover": colors["accent"], "mOnHover": colors["accentForeground"],
        }
        if contrast(result["mOnSurface"], result["mSurface"]) < 4.5:
            raise ValueError("Noctalia surface contrast below 4.5")
        if contrast(result["mOnPrimary"], result["mPrimary"]) < 3.0:
            raise ValueError("Noctalia primary contrast below 3.0")
        return result
    return {"dark": variant(theme["darkColors"]), "light": variant(theme["colors"])}


def validate(profile_id: str, monitor: str, wallpaper: str, scheme_name: str) -> dict:
    expected = PROFILES.get(profile_id)
    if not expected:
        raise ValueError(f"unknown profile: {profile_id}")
    actual = {"monitor": monitor, "wallpaper": Path(wallpaper).name, "scheme": scheme_name}
    if actual != expected:
        raise ValueError(f"recording preflight mismatch: expected {expected}, got {actual}")
    return expected


def atomic_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.")
    try:
        with os.fdopen(fd, "w") as handle:
            json.dump(data, handle, indent=2)
            handle.write("\n")
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary): os.unlink(temporary)


def apply(profile_id: str, monitor: str, wallpaper: str, mode: str, theme_path: Path, config_dir: Path) -> dict:
    expected = PROFILES[profile_id]
    validate(profile_id, monitor, wallpaper, expected["scheme"])
    scheme = noctalia_scheme(load_json(theme_path))
    scheme_path = config_dir / "colorschemes" / expected["scheme"] / f"{expected['scheme']}.json"
    atomic_json(scheme_path, scheme)
    settings_path = config_dir / "settings.json"
    settings = load_json(settings_path)
    before = hashlib.sha256(settings_path.read_bytes()).hexdigest()
    colors = settings["colorSchemes"]
    colors.update({"useWallpaperColors": False, "predefinedScheme": expected["scheme"], "darkMode": mode == "dark", "monitorForColors": monitor})
    atomic_json(settings_path, settings)
    subprocess.run(["qs", "-c", "noctalia-shell", "ipc", "call", "colorScheme", "set", expected["scheme"]], check=True)
    subprocess.run(["qs", "-c", "noctalia-shell", "ipc", "call", "darkMode", "setDark" if mode == "dark" else "setLight"], check=True)
    return {"profileId": profile_id, "monitor": monitor, "mode": mode, "scheme": expected["scheme"], "schemePath": str(scheme_path), "settingsBefore": before, "settingsAfter": hashlib.sha256(settings_path.read_bytes()).hexdigest(), "metrics": scheme[mode]}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("profile")
    parser.add_argument("monitor")
    parser.add_argument("wallpaper")
    parser.add_argument("mode", choices=("dark", "light"))
    parser.add_argument("theme", type=Path)
    parser.add_argument("--config-dir", type=Path, default=Path.home() / ".config/noctalia")
    args = parser.parse_args()
    print(json.dumps(apply(args.profile, args.monitor, args.wallpaper, args.mode, args.theme, args.config_dir), indent=2))

if __name__ == "__main__": main()
