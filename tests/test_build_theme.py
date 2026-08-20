import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).parents[1] / "scripts" / "build_theme.py"
spec = importlib.util.spec_from_file_location("build_theme", MODULE_PATH)
assert spec is not None and spec.loader is not None
build_theme = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build_theme)


class ThemeBuildTests(unittest.TestCase):
    def setUp(self):
        self.palette = {
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

    def run_runtime(self, theme, command, mode="light", expected=""):
        with tempfile.NamedTemporaryFile("w", suffix=".json") as handle:
            json.dump(theme, handle)
            handle.flush()
            result = subprocess.run(
                ["node", str(Path(__file__).parent / "plugin_runtime_harness.mjs"),
                 handle.name, command, mode, expected],
                text=True, capture_output=True,
            )
        return result, json.loads(result.stdout)

    def test_dark_palette_is_unchanged_and_light_is_distinct(self):
        theme = build_theme.build_theme(self.palette)
        self.assertEqual(theme["darkColors"]["background"], "#181f23")
        self.assertEqual(theme["darkColors"]["foreground"], "#d1deda")
        self.assertNotEqual(theme["colors"], theme["darkColors"])
        self.assertNotEqual(theme["colors"]["primary"].lower(), "#3b82f6")
        self.assertGreaterEqual(build_theme.contrast(theme["colors"]["foreground"], theme["colors"]["background"]), 7.0)
        self.assertGreaterEqual(build_theme.contrast(theme["colors"]["primary"], theme["colors"]["background"]), 4.5)

    def test_mode_specific_glass_contract_is_complete(self):
        theme = build_theme.build_theme(self.palette)
        expected = {"chrome", "sidebar", "card", "elevated", "bubble"}
        self.assertEqual(set(theme["hermesGlassByMode"]["dark"]), expected)
        self.assertEqual(set(theme["hermesGlassByMode"]["light"]), expected)
        self.assertNotEqual(theme["hermesGlassByMode"]["dark"], theme["hermesGlassByMode"]["light"])

    def test_light_seed_mutation_control_and_wallpaper_runtime_differ(self):
        theme = build_theme.build_theme(self.palette)
        _, control = self.run_runtime(theme, "control")
        result, painted = self.run_runtime(theme, "install")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(control["styles"]["--theme-background-seed"], "#ffffff")
        self.assertEqual(control["styles"]["--theme-primary"], "#3b82f6")
        self.assertNotEqual(control["styles"], painted["styles"])
        self.assertEqual(painted["theme"], "liquid-glass-wal")

    def test_wrong_vertical_theme_identity_fails_closed(self):
        clouds = json.loads((Path(__file__).parent / "fixtures/clouds-pywal.json").read_text())
        theme = build_theme.build_theme(clouds)
        result, payload = self.run_runtime(theme, "install", expected="forgotten-ruins.png")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(payload["ok"])
        self.assertIn("identity mismatch", payload["error"])

    def test_clouds_vertical_identity_and_hydration_preserve_light_mode(self):
        clouds = json.loads((Path(__file__).parent / "fixtures/clouds-pywal.json").read_text())
        theme = build_theme.build_theme(clouds)
        result, payload = self.run_runtime(theme, "hydrate", "light", "mountain-peak-clouds.jpg")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(payload["mode"], "light")
        self.assertEqual(payload["theme"], "liquid-glass-wal")
        self.assertEqual(payload["styles"]["--theme-background-seed"], theme["colors"]["background"])
        self.assertNotEqual(payload["styles"]["--theme-primary"], "#3b82f6")

    def test_forgotten_dark_runtime_is_unchanged_after_hydration(self):
        theme = build_theme.build_theme(self.palette)
        result, payload = self.run_runtime(theme, "hydrate", "dark", "forgotten-ruins.png")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(payload["mode"], "dark")
        self.assertEqual(payload["styles"]["--theme-background-seed"], "#181f23")
        self.assertEqual(payload["styles"]["--theme-foreground"], "#d1deda")


if __name__ == "__main__":
    unittest.main()
