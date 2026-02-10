import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import FileGraph from "@/components/dashboard/FileGraph";
import FileDetailsDrawer from "@/components/dashboard/FileDetailsDrawer";
import { mockNodes, mockIssues, mockEdges } from "@/data/mockData";
import type { FileNode, Edge } from "@/data/mockData";
import AppHeader from "@/components/layout/AppHeader";
import { getGraph, type GraphNode, type GraphEdge } from "@/services/api";
import { Loader2 } from "lucide-react";

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

  // Fetch graph data on mount
  useEffect(() => {
    const fetchGraph = async () => {
      const repoName = localStorage.getItem("currentRepo");

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
  }, []);

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
