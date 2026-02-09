import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";

const steps = [
  { label: "Cloning", description: "Fetching repository..." },
  { label: "Indexing", description: "Building file index..." },
  { label: "RLM Context Map", description: "Mapping dependencies with RLM..." },
  { label: "Analysis Complete", description: "Ready to explore!" },
];

const RepoImport = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [progress, setProgress] = useState(0);

  const isValidUrl = url.match(/^https?:\/\/github\.com\/.+\/.+/);

  const startAnalysis = () => {
    setAnalyzing(true);
    setCurrentStep(0);
    setProgress(0);
  };

  useEffect(() => {
    if (!analyzing) return;
    const stepDurations = [1500, 2000, 2500, 500];
    let totalElapsed = 0;

    const timers: ReturnType<typeof setTimeout>[] = [];
    stepDurations.forEach((duration, i) => {
      totalElapsed += duration;
      timers.push(
        setTimeout(() => {
          setCurrentStep(i + 1);
          setProgress(((i + 1) / steps.length) * 100);
          if (i === steps.length - 1) {
            setTimeout(() => navigate("/dashboard"), 800);
          }
        }, totalElapsed)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [analyzing]);

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
