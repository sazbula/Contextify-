import { GitBranch, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  backTo: string;
  backAriaLabel?: string;
}

const AppHeader = ({ backTo, backAriaLabel = "Back" }: AppHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border px-6 py-4 flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(backTo)}
        aria-label={backAriaLabel}
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-primary" />
        <span className="font-display font-semibold">Contextify</span>
      </div>
    </header>
  );
};

export default AppHeader;
