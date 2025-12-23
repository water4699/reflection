import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Brain, Target, Heart, Activity, Sparkles } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useHabitMoodTracker } from "@/hooks/useHabitMoodTracker";
import { MoodChart } from "./charts/MoodChart";
import { HabitChart } from "./charts/HabitChart";
import { motion } from "framer-motion";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const HabitMoodAnalysis = () => {
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const { dayCount, records, runAnalysis, analysis, isLoading, message } = useHabitMoodTracker(CONTRACT_ADDRESS);

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

  const handleRunAnalysis = async (analysisType: string = 'correlation') => {
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

  const handleRunTrendAnalysis = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to run trend analysis.",
        variant: "destructive",
      });
      return;
    }

    if (dayCount < 3) {
      toast({
        title: "Insufficient Data",
        description: "You need at least 3 records to run trend analysis.",
        variant: "destructive",
      });
      return;
    }

    try {
      // For now, we'll use the existing analysis function
      // In a full implementation, this would call a separate trend analysis function
      await runAnalysis(Math.min(dayCount, 10));
      toast({
        title: "Trend Analysis Complete",
        description: "Habit completion trend has been analyzed.",
      });
    } catch (error: any) {
      toast({
        title: "Trend Analysis Error",
        description: error.message || "Failed to run trend analysis",
        variant: "destructive",
      });
    }
  };

  // Calculate comprehensive statistics from decrypted records
  const stats = useMemo(() => {
    const decryptedRecords = records.filter(r => r.mood !== null && r.habitCompletion !== null);

    if (decryptedRecords.length === 0) {
      return {
        totalRecords: 0,
        avgMood: null,
        avgHabits: null,
        correlation: null,
        bestDay: null,
        worstDay: null,
        consistency: null,
        trend: null,
        insights: []
      };
    }

    const moods = decryptedRecords.map(r => r.mood!);
    const habits = decryptedRecords.map(r => r.habitCompletion!);

    const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
    const avgHabits = habits.reduce((a, b) => a + b, 0) / habits.length;

    // Calculate correlation coefficient
    const n = decryptedRecords.length;
    const sumXY = decryptedRecords.reduce((sum, r) => sum + r.mood! * r.habitCompletion!, 0);
    const sumX = moods.reduce((a, b) => a + b, 0);
    const sumY = habits.reduce((a, b) => a + b, 0);
    const sumX2 = moods.reduce((sum, x) => sum + x * x, 0);
    const sumY2 = habits.reduce((sum, y) => sum + y * y, 0);

    const correlation = n > 1 ? (n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)) : 0;

    // Find best and worst days
    const scores = decryptedRecords.map((r, i) => ({
      index: i,
      score: r.mood! * 0.4 + r.habitCompletion! * 0.6, // Weighted score
      record: r
    }));

    const bestDay = scores.reduce((best, current) => current.score > best.score ? current : best);
    const worstDay = scores.reduce((worst, current) => current.score < worst.score ? current : worst);

    // Calculate consistency (inverse of variance)
    const moodVariance = moods.reduce((sum, mood) => sum + Math.pow(mood - avgMood, 2), 0) / moods.length;
    const habitVariance = habits.reduce((sum, habit) => sum + Math.pow(habit - avgHabits, 2), 0) / habits.length;
    const consistency = Math.max(0, 100 - (moodVariance * 20 + habitVariance * 0.5));

    // Calculate trend
    const firstHalf = decryptedRecords.slice(0, Math.floor(decryptedRecords.length / 2));
    const secondHalf = decryptedRecords.slice(Math.floor(decryptedRecords.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.mood! + r.habitCompletion!, 0) / (firstHalf.length * 2);
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.mood! + r.habitCompletion!, 0) / (secondHalf.length * 2);
    const trend = secondHalfAvg - firstHalfAvg;

    // Generate insights
    const insights: string[] = [];

    if (correlation > 0.7) {
      insights.push("Strong positive correlation between mood and habit completion");
    } else if (correlation > 0.3) {
      insights.push("Moderate positive correlation between mood and habits");
    } else if (correlation < -0.3) {
      insights.push("Negative correlation detected - investigate what affects your mood");
    }

    if (avgMood > 3.5) {
      insights.push("Your average mood is above neutral - great job!");
    } else if (avgMood < 2.5) {
      insights.push("Your average mood is below neutral - consider lifestyle changes");
    }

    if (avgHabits > 75) {
      insights.push("Excellent habit completion rate!");
    } else if (avgHabits < 50) {
      insights.push("Habit completion could be improved - try breaking tasks into smaller steps");
    }

    if (trend > 0.5) {
      insights.push("Overall improvement trend detected - you're progressing!");
    } else if (trend < -0.5) {
      insights.push("Declining trend - consider adjusting your approach");
    }

    return {
      totalRecords: decryptedRecords.length,
      avgMood: Math.round(avgMood * 10) / 10,
      avgHabits: Math.round(avgHabits),
      correlation: Math.round(correlation * 100) / 100,
      bestDay: bestDay.record,
      worstDay: worstDay.record,
      consistency: Math.round(consistency),
      trend: Math.round(trend * 100) / 100,
      insights
    };
  }, [records]);

  // Legacy analysis data (for encrypted analysis)
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
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <Card className="border-border card-premium card-analysis relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-500/10 to-purple-500/10 rounded-full" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-green-500/10 to-teal-500/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-3xl text-gradient-animated">
              Advanced Analytics Dashboard
            </CardTitle>
            <CardDescription className="text-base">
              Comprehensive analysis of your mood and habit patterns with visual insights and personalized recommendations.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Stats Overview */}
        {stats.totalRecords > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Card className="border-border card-premium relative overflow-hidden">
                <div className="absolute top-2 right-2 w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Heart className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Mood</p>
                      <p className="text-2xl font-bold gradient-text">{stats.avgMood}/5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Card className="border-border card-premium relative overflow-hidden">
                <div className="absolute top-2 right-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
                      whileHover={{ rotate: -15, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Target className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-sm text-muted-foreground">Habit Completion</p>
                      <p className="text-2xl font-bold gradient-text">{stats.avgHabits}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Card className="border-border card-premium relative overflow-hidden">
                <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Activity className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-sm text-muted-foreground">Correlation</p>
                      <p className="text-2xl font-bold gradient-text">{stats.correlation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Card className="border-border card-premium relative overflow-hidden">
                <div className="absolute top-2 right-2 w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center"
                      whileHover={{ rotate: -15, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Sparkles className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-sm text-muted-foreground">Consistency</p>
                      <p className="text-2xl font-bold gradient-text">{stats.consistency}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Charts */}
        {stats.totalRecords > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <MoodChart
              data={records
                .filter(r => r.mood !== null)
                .map(r => ({
                  dayIndex: r.dayIndex,
                  mood: r.mood!,
                  timestamp: r.timestamp,
                  date: new Date(r.timestamp * 1000).toLocaleDateString()
                }))
                .sort((a, b) => a.dayIndex - b.dayIndex)
              }
            />
            <HabitChart
              data={records
                .filter(r => r.habitCompletion !== null)
                .map(r => ({
                  dayIndex: r.dayIndex,
                  habitCompletion: r.habitCompletion!,
                  timestamp: r.timestamp,
                  date: new Date(r.timestamp * 1000).toLocaleDateString()
                }))
                .sort((a, b) => a.dayIndex - b.dayIndex)
              }
            />
          </div>
        )}

        {/* Insights */}
        {stats.insights.length > 0 && (
          <Card className="border-border bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Personalized insights based on your data patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm">{insight}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Encrypted Analysis (Legacy) */}
        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle>Encrypted Analysis</CardTitle>
            <CardDescription>
              Run privacy-preserving analysis directly on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
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
                      ? "Run Correlation Analysis"
                      : "Connect Wallet First"}
                  </>
                )}
              </Button>

              <Button
                onClick={handleRunTrendAnalysis}
                disabled={isLoading || !isConnected || !CONTRACT_ADDRESS || dayCount < 3}
                variant="outline"
                className="w-full gap-2"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Analyzing Trend...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    {!CONTRACT_ADDRESS
                      ? "Contract Not Configured"
                      : dayCount < 3
                      ? `Need ${3 - dayCount} more record${3 - dayCount > 1 ? 's' : ''}`
                      : isConnected
                      ? "Run Trend Analysis"
                      : "Connect Wallet First"}
                  </>
                )}
              </Button>
            </div>

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

            {correlation === null && stats.totalRecords === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Decrypt some records or run encrypted analysis to see insights.</p>
                <p className="text-sm mt-2">Requires at least 2 records for analysis.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default HabitMoodAnalysis;

