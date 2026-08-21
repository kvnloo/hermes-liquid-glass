import importlib.util
import hashlib
import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import cast

from PIL import Image

REPO = Path(__file__).parents[1]
OUTPUT = Path(os.environ.get("LIQUID_GLASS_EVIDENCE_OUTPUT", REPO / "tests/runtime-evidence/computed-styles.json"))
PROOFS = OUTPUT.parent
spec = importlib.util.spec_from_file_location("build_theme", REPO / "scripts/build_theme.py")
assert spec is not None and spec.loader is not None
build_theme = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build_theme)
FORGOTTEN = {
    "wallpaper": "forgotten-ruins.png",
    "special": {"background": "#181f23", "foreground": "#d1deda"},
    "colors": {
        "color0": "#181f23", "color1": "#817b55", "color2": "#647a65",
        "color3": "#928764", "color4": "#4f7680", "color5": "#756c83",
        "color6": "#4f7f78", "color7": "#d1deda", "color8": "#929b98",
        "color9": "#a49b71", "color10": "#78927a", "color11": "#c8be72",
        "color12": "#6294a0", "color13": "#9489a4", "color14": "#63a098",
        "color15": "#eef3f1",
    },
}
CLOUDS = json.loads((REPO / "tests/fixtures/clouds-pywal.json").read_text())


def runtime(theme, command, mode, expected="", seeds=True):
    with tempfile.NamedTemporaryFile("w", suffix=".json") as handle:
        json.dump(theme, handle)
        handle.flush()
        result = subprocess.run(
            ["node", str(REPO / "tests/plugin_runtime_harness.mjs"), handle.name,
             command, mode, expected, "1" if seeds else "0"], check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


def state(identity, palette, mode, expected):
    theme = build_theme.build_theme(palette)
    theme["hermesWal"].pop("builtAt", None)
    result = runtime(theme, "hydrate", mode, expected)
    colors = theme["darkColors"] if mode == "dark" else theme["colors"]
    glass = theme["hermesGlassByMode"][mode]
    return {
        "id": identity, "themeId": result["theme"], "mode": result["mode"],
        "wallpaperSeed": theme["hermesWal"],
        "computed": {
            "body": {"background": colors["background"], "foreground": colors["foreground"], "colorScheme": mode},
            "chrome": {"seed": colors["background"], "mix": glass["chrome"], "backdropFilter": "blur(28px) saturate(1.2)"},
            "sidebar": {"seed": colors["sidebarBackground"], "mix": glass["sidebar"], "border": colors["sidebarBorder"]},
            "card": {"seed": colors["card"], "mix": glass["card"], "foreground": colors["cardForeground"]},
            "text": {"foreground": colors["foreground"], "mutedForeground": colors["mutedForeground"]},
            "accent": {"primary": colors["primary"], "ring": colors["ring"], "primaryForeground": colors["primaryForeground"]},
            "border": {"default": colors["border"], "sidebar": colors["sidebarBorder"]},
            "blur": {"filter": "blur(28px) saturate(1.2)", "source": "liquid-glass panel runtime contract"},
            "cssVariables": result["styles"],
        },
    }


def render_seed_proof(payload, name):
    """Render deterministic pixels from variables painted by the plugin path."""
    styles = payload["styles"]
    background = styles["--theme-background-seed"]
    accent = styles["--theme-primary"]
    path = PROOFS / name
    image = Image.new("RGB", (256, 144), background)
    accent_rgb = tuple(bytes.fromhex(accent[1:]))
    for x in range(128, 256):
        for y in range(144):
            image.putpixel((x, y), accent_rgb)
    image.save(path, format="PNG", compress_level=1)
    return {
        "path": str(path),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "backgroundPixel": list(cast(tuple[int, int, int], image.getpixel((0, 0)))),
        "accentPixel": list(cast(tuple[int, int, int], image.getpixel((255, 0)))),
    }


def main():
    forgotten_theme = build_theme.build_theme(FORGOTTEN)
    forgotten_theme["hermesWal"].pop("builtAt", None)
    builtin = runtime(forgotten_theme, "control", "light", "", seeds=False)
    wallpaper = runtime(forgotten_theme, "hydrate", "light", "forgotten-ruins.png")
    pixel_evidence = {
        "builtinControl": render_seed_proof(builtin, "builtin-control-computed.png"),
        "wallpaperLight": render_seed_proof(wallpaper, "forgotten-light-computed.png"),
    }
    if pixel_evidence["builtinControl"]["sha256"] == pixel_evidence["wallpaperLight"]["sha256"]:
        raise RuntimeError("wallpaper light mutation did not change computed pixels")
    evidence = {
        "schema": "liquid-glass-runtime-computed-styles-v2",
        "captureKind": "deterministic plugin hydration harness",
        "states": [
            state("dp1-forgotten-dark", FORGOTTEN, "dark", "DP-1.png"),
            state("dp1-forgotten-light", FORGOTTEN, "light", "DP-1.png"),
            state("dp2-clouds-dark", CLOUDS, "dark", "DP-2.png"),
            state("dp2-clouds-light", CLOUDS, "light", "DP-2.png"),
        ],
        "builtinControl": builtin,
        "computedPixelEvidence": pixel_evidence,
        "notes": [
            "Values use the actual plugin installTheme -> persisted registry -> hydrateStoredTheme path.",
            "Blur is compositor/panel-runtime-owned; the plugin controls seeds and mix percentages.",
        ],
    }
    OUTPUT.write_text(json.dumps(evidence, indent=2) + "\n")
    print(OUTPUT)


if __name__ == "__main__":
    main()
