
import base64
import hashlib
import json
import subprocess
import tempfile
import unittest
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).parents[1]
HARNESS = ROOT / "tests/plugin_runtime_harness.mjs"
HOSTILE = "HERMES3D/OBS/PRIVATE"


def png_data(size, color):
    image = Image.new("RGB", size, color)
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, size[0] // 3, size[1]), fill=(17, 111, 73))
    stream = BytesIO()
    image.save(stream, "PNG")
    return stream.getvalue()


def theme(backdrop=None):
    colors = {
        "background": "#eef2ec", "foreground": "#101417", "primary": "#596b42",
        "sidebarBackground": "#e5eae2", "card": "#e8ece6", "popover": "#e7ebe5",
        "userBubble": "#dfe7da", "border": "#899087", "ring": "#596b42",
    }
    payload = {
        "colors": colors, "darkColors": {**colors, "background": "#181f23", "foreground": "#d1deda"},
        "hermesGlass": {"chrome": "48%", "sidebar": "62%", "card": "14%"},
        "hermesGlassByMode": {
            "dark": {"chrome": "48%", "sidebar": "62%", "card": "14%"},
            "light": {"chrome": "76%", "sidebar": "86%", "card": "20%"},
        },
        "hermesWal": {"wallpaper": "DP-1.png", "isDark": True},
    }
    if backdrop:
        payload["hermesBackdrop"] = backdrop
    return payload


def run(payload, command, mode):
    with tempfile.NamedTemporaryFile("w", suffix=".json") as handle:
        json.dump(payload, handle)
        handle.flush()
        result = subprocess.run(
            ["node", str(HARNESS), handle.name, command, mode],
            check=True, capture_output=True, text=True,
        )
    return json.loads(result.stdout)


class WallpaperBackdropTests(unittest.TestCase):
    def test_hostile_underlay_never_enters_four_state_renderer_output(self):
        states = (
            ("DP-1", "2133182232", (1920, 1080), "dark"),
            ("DP-1", "2133182232", (1920, 1080), "light"),
            ("DP-2", "1888636115", (1080, 1920), "dark"),
            ("DP-2", "1888636115", (1080, 1920), "light"),
        )
        for monitor, asset, size, mode in states:
            with self.subTest(monitor=monitor, mode=mode):
                pixels = png_data(size, (41, 62, 74))
                digest = hashlib.sha256(pixels).hexdigest()
                backdrop = {
                    "kind": "verified-wallpaper-frame-v1", "monitor": monitor,
                    "assetId": asset, "frameHash": digest, "frozen": True,
                    "mime": "image/png", "frameUrl": "data:image/png;base64," + base64.b64encode(pixels).decode(),
                }
                output = run(theme(backdrop), "install", mode)
                serialized = json.dumps(output)
                self.assertNotIn(HOSTILE, serialized)
                self.assertEqual(output["backdrop"], f"{monitor}:{asset}:{digest}")
                self.assertIn("background-image:var(--hermes-wallpaper-backdrop)", output["backdropStyle"])
                self.assertIn(digest, output["backdrop"])

    def test_absent_wallpaper_engine_fails_closed_opaque(self):
        output = run(theme(), "hydrate", "light")
        self.assertEqual(output["backdrop"], "opaque-fallback")
        self.assertEqual(output["styles"]["--theme-mix-chrome"], "100%")
        self.assertEqual(output["styles"]["--hermes-wallpaper-backdrop"], "none")

    def test_stale_or_malformed_backdrop_fails_closed(self):
        for mutation in (
            {"frameHash": "stale"},
            {"frameUrl": "https://example.invalid/private.png"},
            {"monitor": ""},
            {"assetId": ""},
        ):
            pixels = png_data((64, 64), (20, 30, 40))
            backdrop = {
                "kind": "verified-wallpaper-frame-v1", "monitor": "DP-1",
                "assetId": "2133182232", "frameHash": hashlib.sha256(pixels).hexdigest(),
                "mime": "image/png", "frameUrl": "data:image/png;base64," + base64.b64encode(pixels).decode(),
            }
            backdrop.update(mutation)
            with self.subTest(mutation=mutation):
                output = run(theme(backdrop), "hydrate", "dark")
                self.assertEqual(output["backdrop"], "opaque-fallback")
                self.assertEqual(output["styles"]["--theme-mix-sidebar"], "100%")

    def test_performance_frozen_frame_survives_hydration_resume(self):
        pixels = png_data((96, 64), (31, 72, 61))
        digest = hashlib.sha256(pixels).hexdigest()
        backdrop = {
            "kind": "verified-wallpaper-frame-v1", "monitor": "DP-1",
            "assetId": "2133182232", "frameHash": digest, "frozen": True,
            "mime": "image/png", "frameUrl": "data:image/png;base64," + base64.b64encode(pixels).decode(),
        }
        output = run(theme(backdrop), "install", "dark")
        self.assertEqual(output["backdrop"], f"DP-1:2133182232:{digest}")
        self.assertIn("data:image/png;base64", output["styles"]["--hermes-wallpaper-backdrop"])


if __name__ == "__main__":
    unittest.main()
