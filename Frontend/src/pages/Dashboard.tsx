import { useState, useEffect, useRef } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import FileGraph from "@/components/dashboard/FileGraph";
import FileDetailsDrawer from "@/components/dashboard/FileDetailsDrawer";
import { mockNodes, mockIssues, mockEdges } from "@/data/mockData";
import type { FileNode, Edge } from "@/data/mockData";
import AppHeader from "@/components/layout/AppHeader";
import { getGraph, type GraphNode, type GraphEdge } from "@/services/api";
import { Loader2 } from "lucide-react";

const API_BASE = "http://localhost:8000";

// Helper function to determine severity from issues
const getSeverityFromIssues = (issues: any[]): FileNode["severity"] => {
  if (issues.length === 0) return "green";

  const hasCritical = issues.some(i => i.severity === "critical");
  const hasHigh = issues.some(i => i.severity === "high");
  const hasMedium = issues.some(i => i.severity === "medium");

  if (hasCritical) return "purple";
  if (hasHigh) return "red";
  if (hasMedium) return "orange";
  return "yellow";
};

const Dashboard = () => {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showFlagged, setShowFlagged] = useState(false);
  const [showHighSeverity, setShowHighSeverity] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Graph data state
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rlmInProgress, setRlmInProgress] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch graph data on mount
  useEffect(() => {
    const fetchGraph = async () => {
      const repoName = localStorage.getItem("currentRepo");
      const rlmStatus = localStorage.getItem("rlmInProgress");

      if (!repoName) {
        // No repo selected, use mock data for demo
        setNodes(mockNodes);
        setEdges(mockEdges);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getGraph(repoName, true);

        // Transform API nodes to FileNode format
        const fileNodes: FileNode[] = data.nodes.map((n: GraphNode, idx: number) => ({
          id: n.id,
          path: n.path,
          folder: n.folder,
          severity: n.severity,
          issues: n.issues,
          topIssue: n.topIssue,
          size: n.size,
          // Add x, y for layout (will be computed by FileGraph)
          x: 0,
          y: 0,
        }));

        // Transform API edges to Edge format
        const graphEdges: Edge[] = data.edges.map((e: GraphEdge) => ({
          from: e.from,
          to: e.to,
        }));

        setNodes(fileNodes);
        setEdges(graphEdges);
        setError(null);
        
        // After graph is loaded, connect to SSE for live RLM updates if analysis is in progress
        if (rlmStatus === "true") {
          setRlmInProgress(true);
          connectToSSE(repoName);
        }
      } catch (err) {
        console.error("Failed to fetch graph:", err);
        setError(err instanceof Error ? err.message : "Failed to load graph");
        // Fall back to mock data on error
        setNodes(mockNodes);
        setEdges(mockEdges);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();

    // Cleanup SSE on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Connect to SSE for live RLM updates
  const connectToSSE = (repoName: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log(`Connecting to SSE for live updates: ${repoName}`);
    eventSourceRef.current = new EventSource(`${API_BASE}/rlm/stream/${repoName}`);

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Dashboard SSE event:", data);

        // Update node colors based on batch_complete events
        if (data.type === "batch_complete" && data.issues_by_file) {
          console.log("Updating nodes with issues:", data.issues_by_file);
          console.log("Current nodes paths:", nodes.map(n => n.path));
          
          setNodes(prevNodes => {
            return prevNodes.map(node => {
              // Normalize node path for comparison
              const normalizedNodePath = node.path.replace(/\\/g, '/');
              
              // Check if this file has issues
              const fileIssues = data.issues_by_file[normalizedNodePath];

              if (fileIssues && fileIssues.length > 0) {
                console.log(`Updating node ${normalizedNodePath} with ${fileIssues.length} issues`);
                return {
                  ...node,
                  severity: getSeverityFromIssues(fileIssues),
                  issues: fileIssues.length,
                  topIssue: fileIssues[0]?.description,
                };
              } else if (data.type === "batch_complete") {
                // File was analyzed but has no issues - mark as green
                return {
                  ...node,
                  severity: "green",
                  issues: 0,
                };
              }

              return node;
            });
          });
        }

        // Mark RLM as complete
        if (data.type === "analysis_complete") {
          setRlmInProgress(false);
          localStorage.setItem("rlmInProgress", "false");

          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error("SSE error:", error);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  };

  const filteredNodes = nodes.filter(n => {
    if (showFlagged && n.issues === 0) return false;
    if (showHighSeverity && !["red", "purple"].includes(n.severity)) return false;
    if (searchQuery && !n.path.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    return true;
  });

  const fileIssues = selectedNode
    ? mockIssues.filter(i => i.file === selectedNode.path)
    : [];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <AppHeader backTo="/import" backAriaLabel="Back to import" />

      {/* RLM Analysis Progress Banner */}
      {rlmInProgress && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm text-blue-500">
            AI Analysis in progress... Circle colors will update as issues are discovered
          </span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showFlagged={showFlagged}
          onShowFlaggedChange={setShowFlagged}
          showHighSeverity={showHighSeverity}
          onShowHighSeverityChange={setShowHighSeverity}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="flex-1 relative overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Loading graph...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-1">Showing demo data</p>
              </div>
            </div>
          ) : activeTab === "overview" && (
            <FileGraph
              nodes={filteredNodes}
              edges={edges}
              onNodeClick={setSelectedNode}
              selectedNodeId={selectedNode?.id}
            />
          )}
        </div>

        <FileDetailsDrawer
          node={selectedNode}
          issues={fileIssues}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </div>
  );
};

export default Dashboard;
