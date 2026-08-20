import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).parents[1] / "scripts" / "noctalia_theme_bridge.py"
spec = importlib.util.spec_from_file_location("bridge", MODULE_PATH)
assert spec is not None and spec.loader is not None
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)

THEME = {
    "colors": {"background":"#eff2ec","foreground":"#101417","card":"#edefe5","cardForeground":"#101417","primary":"#6f6c45","primaryForeground":"#f4f6f8","midground":"#6f6c45","accent":"#e9ead8","accentForeground":"#101417","border":"#b9bdb9","destructive":"#a9203d","destructiveForeground":"#ffffff"},
    "darkColors": {"background":"#181f23","foreground":"#d1deda","card":"#282d2a","cardForeground":"#d1deda","primary":"#c8be72","primaryForeground":"#181f23","midground":"#c8be72","accent":"#383c31","accentForeground":"#d1deda","border":"#494c39","destructive":"#e75e78","destructiveForeground":"#181f23"},
}

class NoctaliaBridgeTests(unittest.TestCase):
    def test_exact_profile_identity(self):
        self.assertEqual(bridge.validate("liquid-glass-forgotten-horizontal", "DP-1", "/x/forgotten-ruins.png", "LiquidGlass-Forgotten")["monitor"], "DP-1")
        self.assertEqual(bridge.validate("liquid-glass-clouds-vertical", "DP-2", "/x/mountain-peak-clouds.jpg", "LiquidGlass-Clouds")["monitor"], "DP-2")

    def test_monitor_and_stale_scheme_mismatch_fail(self):
        for monitor, scheme in (("DP-2", "LiquidGlass-Forgotten"), ("DP-1", "Noctalia (default)")):
            with self.assertRaisesRegex(ValueError, "preflight mismatch"):
                bridge.validate("liquid-glass-forgotten-horizontal", monitor, "forgotten-ruins.png", scheme)

    def test_dark_light_are_distinct_and_readable(self):
        scheme = bridge.noctalia_scheme(THEME)
        self.assertNotEqual(scheme["dark"], scheme["light"])
        for mode in ("dark", "light"):
            self.assertGreaterEqual(bridge.contrast(scheme[mode]["mOnSurface"], scheme[mode]["mSurface"]), 4.5)
            self.assertNotIn(scheme[mode]["mPrimary"].lower(), ("#3b82f6", "#fff59b"))

    def test_only_color_scheme_settings_mutate(self):
        original = {"bar":{"backgroundOpacity":.46}, "colorSchemes":{"useWallpaperColors":True,"predefinedScheme":"Noctalia (default)","darkMode":True,"monitorForColors":""}, "hooks":{"startup":"keep"}}
        changed = copy.deepcopy(original)
        changed["colorSchemes"].update({"useWallpaperColors":False,"predefinedScheme":"LiquidGlass-Forgotten","darkMode":False,"monitorForColors":"DP-1"})
        self.assertEqual(original["bar"], changed["bar"])
        self.assertEqual(original["hooks"], changed["hooks"])

if __name__ == "__main__": unittest.main()
