"""RLM client stub.

This is the seam where the real Recursive Language Model will plug in.
For now it converts the graph produced by the pipeline into the UI
schema with placeholder severities/issues.
"""
from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any, Dict, List

import networkx as nx

Severity = str  # alias for clarity


def _graph_to_ui(graph: nx.DiGraph) -> Dict[str, Any]:
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, str]] = []

    # File nodes only
    file_nodes = {n for n, d in graph.nodes(data=True) if d.get("category") == "file"}

    for n in file_nodes:
        data = graph.nodes[n]
        path = data.get("file") or n
        path = str(path)
        folder = path.rsplit("/", 1)[0] if "/" in path else "root"
        nodes.append(
            {
                "id": n,
                "path": path,
                "folder": folder,
                "severity": "green",  # placeholder until RLM scores
                "issues": 0,
                "topIssue": None,
                "size": None,
            }
        )

    for u, v in graph.edges():
        if u in file_nodes and v in file_nodes:
            edges.append({"from": u, "to": v})

    severity_counts = {"green": len(nodes), "yellow": 0, "orange": 0, "red": 0, "purple": 0, "gray": 0}

    return {"nodes": nodes, "edges": edges, "severity_counts": severity_counts}


def analyze_repo(repo_name: str, graph_path: str | Path, tags_path: str | Path, repo_path: str | Path | None = None) -> Dict[str, Any]:
    """Run (stub) RLM analysis.

    In the future, this will send graph + code context to the RLM and
    return scored issues. For now, it loads the graph.pkl to surface
    file structure with neutral severities and no issues.
    """
    graph_path = Path(graph_path)
    with open(graph_path, "rb") as f:
        graph: nx.DiGraph = pickle.load(f)

    graph_ui = _graph_to_ui(graph)

    return {
        "repo_name": repo_name,
        "graph": graph_ui,
        "issues": [],  # placeholder until RLM provides findings
        "meta": {
            "engine": "stub-rlm",
            "notes": "Replace analyze_repo with real RLM inference.",
        },
    }
