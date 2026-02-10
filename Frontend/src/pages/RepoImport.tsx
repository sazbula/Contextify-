import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";
import { analyzeRepo } from "@/services/api";

const steps = [
  { label: "Cloning", description: "Fetching repository..." },
  { label: "Indexing", description: "Building file index..." },
  { label: "Building Graph", description: "Mapping dependencies..." },
  { label: "Analysis Complete", description: "Ready to explore!" },
];

const RepoImport = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const analysisStarted = useRef(false);

  const isValidUrl = url.match(/^https?:\/\/github\.com\/.+\/.+/);

  const startAnalysis = async () => {
    if (analysisStarted.current) return;
    analysisStarted.current = true;

    setAnalyzing(true);
    setCurrentStep(0);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Cloning
      setCurrentStep(0);
      setProgress(25);

      // Call the backend API
      const result = await analyzeRepo(url);

      // Step 2: Indexing (simulated progress during API call)
      setCurrentStep(1);
      setProgress(50);

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Building Graph
      setCurrentStep(2);
      setProgress(75);

      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 4: Complete
      setCurrentStep(3);
      setProgress(100);

      // Store repo name for dashboard
      localStorage.setItem("currentRepo", result.repo_name);

      // Navigate to dashboard after brief delay
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setAnalyzing(false);
      setCurrentStep(-1);
      setProgress(0);
      analysisStarted.current = false;
    }
  };

  // Reset ref when component unmounts
  useEffect(() => {
    return () => {
      analysisStarted.current = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader backTo="/" backAriaLabel="Back to login" />

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {!analyzing ? (
            <>
              <h1 className="text-2xl font-display font-bold mb-2">
                Open a repository
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                Paste a GitHub repo URL. We clone and analyze it securely.
              </p>

              <div className="space-y-4">
                <Input
                  placeholder="https://github.com/org/repo"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="h-12 font-mono"
                />

                <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Private repo</span>
                  </div>
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>

                <Button
                  variant="glow"
                  size="lg"
                  className="w-full h-12"
                  disabled={!isValidUrl}
                  onClick={startAnalysis}
                >
                  Clone & Analyze
                </Button>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  Analyzing repository
                </h2>
                <p className="text-sm text-muted-foreground font-mono">{url}</p>
              </div>

              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ width: `${progress}%` }}
                />
              </div>

              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div
                    key={step.label}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-muted">
                      {currentStep > i ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RepoImport;
