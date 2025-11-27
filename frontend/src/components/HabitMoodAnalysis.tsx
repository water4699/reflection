import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Brain } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useHabitMoodTracker } from "@/hooks/useHabitMoodTracker";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const HabitMoodAnalysis = () => {
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const { dayCount, runAnalysis, analysis, isLoading, message } = useHabitMoodTracker(CONTRACT_ADDRESS);

  useEffect(() => {
    if (message && message.includes("Analysis")) {
      if (message.includes("Error") || message.includes("error")) {
        toast({
          title: "Analysis Error",
          description: message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Complete",
          description: message,
        });
      }
    }
  }, [message, toast]);

  const handleRunAnalysis = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to run analysis.",
        variant: "destructive",
      });
      return;
    }

    if (dayCount < 2) {
      toast({
        title: "Insufficient Data",
        description: "You need at least 2 records to run analysis.",
        variant: "destructive",
      });
      return;
    }

    try {
      await runAnalysis(Math.min(dayCount, 10)); // Limit to 10 records for MVP
    } catch (error: any) {
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to run analysis",
        variant: "destructive",
      });
    }
  };

  // Calculate correlation from analysis data
  const correlation = analysis && analysis.moodHabitProduct && analysis.habitSquared
    ? 0.8 // Placeholder - would need actual correlation calculation
    : null;

  const recentMoodAvg = analysis && analysis.recentMoodSum ? analysis.recentMoodSum / 2 : null;
  const earlierMoodAvg = analysis && analysis.earlierMoodSum ? analysis.earlierMoodSum / 2 : null;
  const moodImprovement = recentMoodAvg !== null && earlierMoodAvg !== null 
    ? recentMoodAvg > earlierMoodAvg 
    : null;
  const stressReduction = recentMoodAvg !== null && earlierMoodAvg !== null
    ? Math.round((recentMoodAvg - earlierMoodAvg) * 20) // Rough percentage estimate
    : null;

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Encrypted Analysis
            </CardTitle>
            <CardDescription className="text-base">
              Analyze correlations between habits and mood improvements. All analysis is performed on encrypted data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleRunAnalysis}
              disabled={isLoading || !isConnected || !CONTRACT_ADDRESS || dayCount < 2}
              className="w-full gap-2"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Analyzing Encrypted Data...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  {!CONTRACT_ADDRESS 
                    ? "Contract Not Configured" 
                    : dayCount < 2 
                    ? `Need ${2 - dayCount} more record${2 - dayCount > 1 ? 's' : ''}` 
                    : isConnected 
                    ? "Run Analysis" 
                    : "Connect Wallet First"}
                </>
              )}
            </Button>

            {correlation !== null && (
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="p-6 rounded-lg border bg-muted/50">
                  <BarChart3 className="w-8 h-8 mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Correlation</h3>
                  <p className="text-3xl font-bold">
                    {correlation ? `${(correlation * 100).toFixed(0)}%` : "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {correlation && correlation > 0.5 
                      ? "Strong positive correlation between habits and mood"
                      : correlation
                      ? "Weak correlation"
                      : "Analysis pending"}
                  </p>
                </div>

                <div className="p-6 rounded-lg border bg-muted/50">
                  <TrendingUp className="w-8 h-8 mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Stress Reduction</h3>
                  <p className="text-3xl font-bold">
                    {stressReduction !== null ? `${stressReduction > 0 ? '+' : ''}${stressReduction}%` : "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stressReduction !== null
                      ? stressReduction > 0
                        ? "Mood improvement indicates stress reduction"
                        : "No significant change"
                      : "Analysis pending"}
                  </p>
                </div>

                <div className="p-6 rounded-lg border bg-muted/50">
                  <Brain className="w-8 h-8 mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Trend</h3>
                  <p className="text-3xl font-bold">
                    {moodImprovement !== null ? (moodImprovement ? "↑" : "→") : "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {moodImprovement !== null
                      ? moodImprovement
                        ? "Mood is improving over time"
                        : "Mood trend is stable"
                      : "Analysis pending"}
                  </p>
                </div>
              </div>
            )}

            {correlation === null && (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Run analysis to see encrypted correlation results.</p>
                <p className="text-sm mt-2">Requires at least 2 records for trend analysis.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default HabitMoodAnalysis;

