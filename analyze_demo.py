#!/usr/bin/env python3
"""Script to analyze the demo_repo and generate graph + mock RLM results."""

import sys
import os
import json

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from pipeline import ContextifyPipeline
from graph_builder import GraphBuilder

def create_mock_rlm_results():
    """Create mock RLM analysis results for demo_repo with realistic issues."""
    return {
        "repo_name": "demo_repo",
        "total_issues": 8,
        "files_analyzed": 3,
        "execution_time": 15.3,
        "issues_by_file": {
            "src/auth.py": [
                {
                    "severity": "critical",
                    "category": "security",
                    "description": "Hardcoded credentials: admin/password123",
                    "line": 6,
                    "recommendation": "Use environment variables or secure vault for credentials"
                },
                {
                    "severity": "critical",
                    "category": "security",
                    "description": "MD5 is cryptographically broken - do not use for password hashing",
                    "line": 14,
                    "recommendation": "Use bcrypt, scrypt, or argon2 for password hashing"
                }
            ],
            "src/database.py": [
                {
                    "severity": "critical",
                    "category": "security",
                    "description": "SQL injection vulnerability in user lookup",
                    "line": 6,
                    "recommendation": "Use parameterized queries or ORM to prevent SQL injection"
                },
                {
                    "severity": "critical",
                    "category": "security",
                    "description": "SQL injection in search functionality",
                    "line": 12,
                    "recommendation": "Use parameterized queries with proper input sanitization"
                },
                {
                    "severity": "high",
                    "category": "security",
                    "description": "SQL injection in delete operation",
                    "line": 23,
                    "recommendation": "Use parameterized queries to prevent injection attacks"
                }
            ],
            "utils/helpers.py": [
                {
                    "severity": "high",
                    "category": "error_handling",
                    "description": "Division by zero not handled",
                    "line": 6,
                    "recommendation": "Add check for zero divisor before division operation"
                },
                {
                    "severity": "medium",
                    "category": "error_handling",
                    "description": "File operations without error handling",
                    "line": 13,
                    "recommendation": "Add try-except for IOError and FileNotFoundError"
                },
                {
                    "severity": "low",
                    "category": "code_quality",
                    "description": "Inefficient list iteration using range(len())",
                    "line": 21,
                    "recommendation": "Use list comprehension: [item * 2 for item in items]"
                }
            ]
        },
        "summary": {
            "critical_issues": 4,
            "high_issues": 2,
            "medium_issues": 1,
            "low_issues": 1,
            "files_with_issues": 3,
            "total_files": 3
        }
    }

def main():
    print("=" * 70)
    print("ANALYZING DEMO REPO")
    print("=" * 70)

    # Paths
    repos_dir = "./repos"
    output_dir = "./output"
    demo_path = os.path.join(repos_dir, "demo_repo")

    if not os.path.exists(demo_path):
        print(f"Error: demo_repo not found at {demo_path}")
        return

    print(f"\n[OK] Found demo_repo at: {demo_path}")

    # Create output directory
    graph_output_dir = os.path.join(output_dir, "demo_repo")
    os.makedirs(graph_output_dir, exist_ok=True)

    # Build graph
    print("\n[1/2] Building code graph for demo_repo...")
    builder = GraphBuilder(demo_path)
    graph = builder.build()
    stats = builder.get_stats()

    print(f"[OK] Graph built: {stats['nodes']} nodes, {stats['edges']} edges")

    # Save graph
    graph_file = os.path.join(graph_output_dir, "graph.json")

    # Convert graph to JSON format
    graph_data = {
        "nodes": [{"id": node} for node in graph.nodes()],
        "edges": [{"from": u, "to": v} for u, v in graph.edges()],
        "stats": stats
    }

    with open(graph_file, 'w') as f:
        json.dump(graph_data, f, indent=2)

    print(f"[OK] Graph saved to: {graph_file}")

    # Create mock RLM results
    print("\n[2/2] Creating RLM analysis results...")

    rlm_results = create_mock_rlm_results()

    # Save detailed analysis
    analysis_dir = os.path.join("analysis", "demo_repo")
    os.makedirs(analysis_dir, exist_ok=True)

    detailed_file = os.path.join(analysis_dir, "detailed_analysis.json")
    with open(detailed_file, 'w') as f:
        json.dump(rlm_results, f, indent=2)

    print(f"[OK] RLM results saved to: {detailed_file}")

    # Save summary
    summary_file = os.path.join(analysis_dir, "summary.json")
    with open(summary_file, 'w') as f:
        json.dump(rlm_results['summary'], f, indent=2)

    print(f"[OK] Summary saved to: {summary_file}")

    print("\n" + "=" * 70)
    print("ANALYSIS COMPLETE")
    print("=" * 70)
    print(f"Issues found: {rlm_results['total_issues']}")
    print(f"  - Critical: {rlm_results['summary']['critical_issues']}")
    print(f"  - High: {rlm_results['summary']['high_issues']}")
    print(f"  - Medium: {rlm_results['summary']['medium_issues']}")
    print(f"  - Low: {rlm_results['summary']['low_issues']}")
    print(f"\nFiles analyzed: {rlm_results['files_analyzed']}")
    print(f"Output directory: {graph_output_dir}")
    print("\n[SUCCESS] You can now load the demo repo in the frontend!")

if __name__ == "__main__":
    main()
