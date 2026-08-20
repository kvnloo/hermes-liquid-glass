import importlib.util
import json
import subprocess
import tempfile
from pathlib import Path

REPO = Path(__file__).parents[1]
OUTPUT = REPO.parent / "task-t_26a896f4/proofs/computed-styles.json"
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


def runtime(theme, command, mode, expected=""):
    with tempfile.NamedTemporaryFile("w", suffix=".json") as handle:
        json.dump(theme, handle)
        handle.flush()
        result = subprocess.run(
            ["node", str(REPO / "tests/plugin_runtime_harness.mjs"), handle.name,
             command, mode, expected], check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


def state(identity, palette, mode, expected):
    theme = build_theme.build_theme(palette)
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


def main():
    forgotten_theme = build_theme.build_theme(FORGOTTEN)
    evidence = {
        "schema": "liquid-glass-runtime-computed-styles-v2",
        "captureKind": "deterministic plugin hydration harness",
        "states": [
            state("dp1-forgotten-dark", FORGOTTEN, "dark", "forgotten-ruins.png"),
            state("dp1-forgotten-light", FORGOTTEN, "light", "forgotten-ruins.png"),
            state("dp2-clouds-dark", CLOUDS, "dark", "mountain-peak-clouds.jpg"),
            state("dp2-clouds-light", CLOUDS, "light", "mountain-peak-clouds.jpg"),
        ],
        "builtinControl": runtime(forgotten_theme, "control", "light"),
        "notes": [
            "Values use the actual plugin installTheme -> persisted registry -> hydrateStoredTheme path.",
            "Blur is compositor/panel-runtime-owned; the plugin controls seeds and mix percentages.",
        ],
    }
    OUTPUT.write_text(json.dumps(evidence, indent=2) + "\n")
    print(OUTPUT)


if __name__ == "__main__":
    main()
