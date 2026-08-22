#!/usr/bin/env python3
import json
import os
import platform
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
commands = [
    ["node", "--test", "tests/plugin.test.mjs"],
    ["node", "audit/t_7584592c/verify-plugin-load.mjs"],
    ["node", "--check", "plugin/plugin.js"],
    ["python", "-m", "py_compile", "scripts/build_theme.py"],
    ["bash", "-n", "scripts/apply.sh", "scripts/install.sh", "scripts/sync-layout.sh"],
    ["git", "diff", "--check"],
    ["git", "diff", "HEAD^", "HEAD", "--check"],
    ["npm", "exec", "tsc", "--", "--noEmit"],
    ["npm", "run", "build"],
]
results = []
for command in commands:
    cwd = ROOT / "trailer" if command[0] == "npm" else ROOT
    started = datetime.now(timezone.utc).isoformat()
    proc = subprocess.run(command, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    results.append({
        "command": " ".join(command),
        "cwd": str(cwd),
        "startedUtc": started,
        "exitCode": proc.returncode,
        "output": proc.stdout,
    })
    print(f"$ (cd {cwd} && {' '.join(command)})", flush=True)
    print(proc.stdout, end="" if proc.stdout.endswith("\n") or not proc.stdout else "\n", flush=True)
    print(f"[exit {proc.returncode}]", flush=True)
meta = {
    "task": "t_7584592c",
    "revision": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
    "branch": subprocess.check_output(["git", "branch", "--show-current"], cwd=ROOT, text=True).strip(),
    "utcCompleted": datetime.now(timezone.utc).isoformat(),
    "platform": platform.platform(),
    "node": subprocess.check_output(["node", "--version"], text=True).strip(),
    "npm": subprocess.check_output(["npm", "--version"], text=True).strip(),
    "python": platform.python_version(),
    "chromium": subprocess.check_output(["chromium", "--version"], text=True).strip() if shutil.which("chromium") else None,
    "isolation": "Node VM synthetic plugin host plus test-owned ephemeral headless Chromium profiles; no live Hermes Desktop interaction",
    "results": results,
}
(OUT / "check-results.json").write_text(json.dumps(meta, indent=2) + "\n")
raise SystemExit(0 if all(item["exitCode"] == 0 for item in results) else 1)
