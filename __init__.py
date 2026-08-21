"""Hermes unified-package marker for the Liquid Glass Desktop plugin.

This package intentionally registers no agent-side hooks, tools, or commands.
Its opt-in Desktop contribution is loaded from ``desktop/plugin.js``.
"""

from __future__ import annotations

from typing import Any


def register(ctx: Any) -> None:
    """Keep the agent-side half inert; Desktop owns all contributions."""
