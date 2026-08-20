import importlib.util
import json
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

    def test_clouds_scheme_identity_survives(self):
        clouds = json.loads((Path(__file__).parent / "fixtures/clouds-pywal.json").read_text())
        theme = build_theme.build_theme(clouds)
        self.assertIn("mountain-peak-clouds.jpg", theme["hermesWal"]["wallpaper"])
        self.assertNotEqual(theme["colors"], theme["darkColors"])


if __name__ == "__main__":
    unittest.main()
