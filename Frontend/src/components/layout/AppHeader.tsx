import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/contextify-logo.png";

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

      <img
        src={logo}
        alt="Contextify"
        className="h-8 scale-[4] origin-left object-contain select-none"
        draggable={false}
      />
    </header>
  );
};

export default AppHeader;
