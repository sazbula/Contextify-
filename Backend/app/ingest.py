"""Wrapper around the legacy pipeline (github_fetch + graph_builder).

This keeps the FastAPI app decoupled while letting us reuse the existing
code that downloads a repo and builds a graph.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import TypedDict

# Add project root /src to import path
ROOT = Path(__file__).resolve().parents[2]
SRC_PATH = ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

try:  # noqa: SIM105
    from pipeline import ContextifyPipeline  # type: ignore
except ImportError as exc:  # pragma: no cover - defensive import
    raise ImportError("pipeline.py not found; ensure SRC is on PYTHONPATH") from exc


class PipelineResult(TypedDict):
    repo_name: str
    repo_path: str
    graph_path: str
    tags_path: str
    node_count: int
    edge_count: int


def run_pipeline(github_url: str, force: bool = False) -> PipelineResult:
    """Run the graph-builder pipeline for a GitHub URL.

    Args:
        github_url: full GitHub repo URL
        force: re-download / re-analyze if already present
    """
    pipeline = ContextifyPipeline(
        output_dir=ROOT / "output",
        repos_dir=ROOT / "repos",
    )

    result = pipeline.analyze(
        github_url,
        force_download=force,
        force_analyze=force,
    )

    return {
        "repo_name": result.repo_name,
        "repo_path": str(result.repo_path),
        "graph_path": str(result.graph_path),
        "tags_path": str(result.tags_path),
        "node_count": result.node_count,
        "edge_count": result.edge_count,
    }
