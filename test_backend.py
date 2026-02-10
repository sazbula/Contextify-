"""
Test script for Contextify backend API

This script demonstrates how to interact with the Contextify backend
to analyze GitHub repositories.
"""

import requests
import json
import time
from typing import Optional

# Backend API configuration
API_BASE = "http://localhost:8000"


class ContextifyClient:
    """Simple client for Contextify API"""

    def __init__(self, base_url: str = API_BASE):
        self.base_url = base_url

    def health_check(self) -> dict:
        """Check if the API is running"""
        response = requests.get(f"{self.base_url}/")
        return response.json()

    def check_rlm_status(self) -> dict:
        """Check if RLM scanner is available"""
        response = requests.get(f"{self.base_url}/rlm/status")
        return response.json()

    def analyze_full(
        self,
        github_url: str,
        run_rlm: bool = True,
        force: bool = False,
        timeout: int = 600
    ) -> dict:
        """
        Full analysis: Clone repo, build graph, and optionally run RLM.

        Args:
            github_url: GitHub repository URL
            run_rlm: Whether to run RLM analysis
            force: Force re-download and re-analysis
            timeout: Request timeout in seconds (default 10 minutes)

        Returns:
            Analysis results dictionary
        """
        response = requests.post(
            f"{self.base_url}/analyze-full",
            json={
                "url": github_url,
                "run_rlm": run_rlm,
                "force": force
            },
            timeout=timeout
        )
        response.raise_for_status()
        return response.json()

    def get_rlm_results(self, repo_name: str) -> dict:
        """Get detailed RLM analysis results"""
        response = requests.get(f"{self.base_url}/rlm/results/{repo_name}")
        response.raise_for_status()
        return response.json()

    def list_repos(self) -> list:
        """List all analyzed repositories"""
        response = requests.get(f"{self.base_url}/repos")
        response.raise_for_status()
        return response.json()["repos"]


def print_section(title: str):
    """Print a formatted section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def print_results(data: dict):
    """Pretty print analysis results"""
    print_section(f"Analysis Results: {data['repo_name']}")

    # Graph analysis
    print("\n📊 Code Graph Analysis:")
    graph = data['graph_analysis']
    print(f"  • Repository: {graph['repo_name']}")
    print(f"  • Total Nodes: {graph['node_count']:,}")
    print(f"  • Total Edges: {graph['edge_count']:,}")
    print(f"  • Local Path: {graph['repo_path']}")

    # RLM analysis
    if data.get('rlm_analysis'):
        rlm = data['rlm_analysis']
        if rlm.get('error'):
            print(f"\n⚠️  RLM Analysis: {rlm['error']}")
        else:
            print("\n🤖 RLM Analysis:")
            print(f"  • Files Analyzed: {rlm.get('files_analyzed', 0):,}")
            print(f"  • Issues Found: {rlm.get('issues_found', 0):,}")
            print(f"  • Execution Time: {rlm.get('execution_time', 0):.2f}s")


def print_detailed_results(data: dict, repo_name: str):
    """Pretty print detailed RLM results"""
    print_section(f"Detailed Issues Report: {repo_name}")

    summary = data.get('summary', {})
    print("\n📋 Summary:")
    print(f"  • Total Files: {summary.get('total_files', 0)}")
    print(f"  • Files with Issues: {summary.get('files_with_issues', 0)}")
    print(f"  • Total Issues: {summary.get('total_issues', 0)}")
    print(f"  • Critical Issues: {summary.get('critical_issues', 0)}")
    print(f"  • High Issues: {summary.get('high_issues', 0)}")

    issues_by_file = data.get('issues_by_file', {})
    if issues_by_file:
        print("\n🔍 Issues by File:")
        for file, issues in list(issues_by_file.items())[:5]:  # Show first 5 files
            print(f"\n  📄 {file}:")
            for issue in issues[:3]:  # Show first 3 issues per file
                severity = issue.get('severity', 'info').upper()
                desc = issue.get('description', 'No description')
                print(f"    [{severity:8}] {desc}")

        if len(issues_by_file) > 5:
            print(f"\n  ... and {len(issues_by_file) - 5} more files")


def main():
    """Main test function"""
    print_section("Contextify Backend Test")

    # Initialize client
    client = ContextifyClient()

    # Test repositories (from small to medium)
    test_repos = [
        {
            "url": "https://github.com/pallets/flask",
            "name": "Flask - Python web framework",
            "run_rlm": True
        },
        # Add more test repos here if needed
    ]

    print("\n🔧 Configuration:")
    print(f"  • API Base URL: {API_BASE}")
    print(f"  • Test Repositories: {len(test_repos)}")

    # Step 1: Health check
    print("\n[1/4] Checking API health...")
    try:
        health = client.health_check()
        print(f"  ✅ API is running: {health}")
    except Exception as e:
        print(f"  ❌ Error: Cannot connect to backend!")
        print(f"     Make sure the server is running: uvicorn src.api.server:app --reload")
        return

    # Step 2: Check RLM status
    print("\n[2/4] Checking RLM status...")
    try:
        rlm_status = client.check_rlm_status()
        if rlm_status['available']:
            print(f"  ✅ {rlm_status['message']}")
        else:
            print(f"  ⚠️  {rlm_status['message']}")
            print(f"     RLM analysis will be skipped")
    except Exception as e:
        print(f"  ❌ Error: {e}")

    # Step 3: Analyze repositories
    print("\n[3/4] Analyzing repositories...")
    for i, repo in enumerate(test_repos, 1):
        print(f"\n  📦 Repository {i}/{len(test_repos)}: {repo['name']}")
        print(f"     URL: {repo['url']}")
        print(f"     Starting analysis... (this may take a few minutes)")

        start_time = time.time()

        try:
            result = client.analyze_full(
                github_url=repo['url'],
                run_rlm=repo.get('run_rlm', False),
                force=False  # Use cached data if available
            )

            elapsed = time.time() - start_time
            print(f"\n  ✅ Analysis completed in {elapsed:.1f}s")
            print_results(result)

            # Get detailed results if RLM was run
            if result.get('rlm_analysis') and not result['rlm_analysis'].get('error'):
                try:
                    print("\n  📄 Fetching detailed results...")
                    detailed = client.get_rlm_results(result['repo_name'])
                    print_detailed_results(detailed, result['repo_name'])
                except Exception as e:
                    print(f"  ⚠️  Could not fetch detailed results: {e}")

        except requests.exceptions.Timeout:
            print(f"  ⏱️  Timeout: Analysis is taking longer than expected")
            print(f"     The analysis may still be running in the background")
        except requests.exceptions.HTTPError as e:
            print(f"  ❌ HTTP Error: {e}")
            if e.response is not None:
                try:
                    error_detail = e.response.json()
                    print(f"     Detail: {error_detail.get('detail', 'Unknown error')}")
                except:
                    print(f"     Response: {e.response.text[:200]}")
        except Exception as e:
            print(f"  ❌ Error: {e}")

    # Step 4: List all analyzed repos
    print("\n[4/4] Listing all analyzed repositories...")
    try:
        repos = client.list_repos()
        print(f"  📚 Total repositories analyzed: {len(repos)}")
        for repo in repos:
            print(f"    • {repo}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

    print_section("Test Complete!")
    print("\n💡 Next steps:")
    print("  1. Open http://localhost:8000/docs for interactive API docs")
    print("  2. Open test_frontend.html in your browser for a web UI")
    print("  3. Check the 'analysis/' folder for detailed results")


if __name__ == "__main__":
    main()
