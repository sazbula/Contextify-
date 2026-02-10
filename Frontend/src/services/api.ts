/**
 * API Service for Contextify Backend
 *
 * Handles communication with the Python FastAPI backend for
 * repository analysis and graph data retrieval.
 */

const API_BASE = "http://localhost:8000";

// Types matching the backend response format
export interface AnalyzeResponse {
  repo_name: string;
  status: string;
  node_count: number | null;
  edge_count: number | null;
  message?: string;
}

export interface GraphNode {
  id: string;
  path: string;
  folder: string;
  severity: "green" | "yellow" | "orange" | "red" | "purple" | "gray";
  issues: number;
  topIssue?: string;
  size?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RepoInfo {
  name: string;
}

/**
 * Analyze a GitHub repository with full RLM scanning
 * @param url GitHub repository URL
 * @param force Force re-download and re-analysis
 * @param runRlm Whether to run RLM analysis (default: true)
 */
export async function analyzeRepo(
  url: string,
  force: boolean = false,
  runRlm: boolean = true
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/analyze-full`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, force, run_rlm: runRlm }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Analysis failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get graph visualization data for a repository
 * @param repoName Name of the analyzed repository
 * @param filesOnly If true, only return file nodes (better for large repos)
 */
export async function getGraph(
  repoName: string,
  filesOnly: boolean = true
): Promise<GraphData> {
  const params = new URLSearchParams();
  if (filesOnly) params.append("files_only", "true");

  const response = await fetch(
    `${API_BASE}/graph/${encodeURIComponent(repoName)}/vis?${params}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Failed to get graph: ${response.status}`);
  }

  return response.json();
}

/**
 * List all analyzed repositories
 */
export async function listRepos(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/repos`);

  if (!response.ok) {
    throw new Error(`Failed to list repos: ${response.status}`);
  }

  const data = await response.json();
  return data.repos || [];
}

/**
 * Check if backend is available
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Delete analysis data for a repository
 */
export async function deleteRepo(repoName: string): Promise<void> {
  const response = await fetch(
    `${API_BASE}/graph/${encodeURIComponent(repoName)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Failed to delete: ${response.status}`);
  }
}

/**
 * Analyze a local repository with full RLM scanning
 * @param repoName Name of the local repository in repos/ folder
 * @param force Force re-analysis
 * @param runRlm Whether to run RLM analysis (default: true)
 */
export async function analyzeLocalRepo(
  repoName: string,
  force: boolean = false,
  runRlm: boolean = true
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/analyze-local`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repo_name: repoName, force, run_rlm: runRlm }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Analysis failed: ${response.status}`);
  }

  return response.json();
}
