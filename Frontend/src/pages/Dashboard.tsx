import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import FileGraph from "@/components/dashboard/FileGraph";
import FileDetailsDrawer from "@/components/dashboard/FileDetailsDrawer";
import { mockNodes, mockIssues } from "@/data/mockData";
import type { FileNode } from "@/data/mockData";
import AppHeader from "@/components/layout/AppHeader";

const Dashboard = () => {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showFlagged, setShowFlagged] = useState(false);
  const [showHighSeverity, setShowHighSeverity] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = mockNodes.filter(n => {
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
          {activeTab === "overview" && (
            <FileGraph
              nodes={filteredNodes}
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
