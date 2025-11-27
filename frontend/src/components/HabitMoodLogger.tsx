import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Lock, Heart, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useHabitMoodTracker } from "@/hooks/useHabitMoodTracker";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const HabitMoodLogger = () => {
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const [mood, setMood] = useState([3]);
  const [habitCompletion, setHabitCompletion] = useState([50]);
  
  const { addDailyRecord, isLoading, message } = useHabitMoodTracker(CONTRACT_ADDRESS);

  useEffect(() => {
    if (message) {
      if (message.includes("Error") || message.includes("error")) {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } else if (message.includes("successfully") || message.includes("Success")) {
        toast({
          title: "Success! 🎉",
          description: message,
        });
      }
    }
  }, [message, toast]);

  const handleSubmit = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to log your data.",
        variant: "destructive",
      });
      return;
    }

    if (!CONTRACT_ADDRESS) {
      toast({
        title: "Contract Not Configured",
        description: "Please set VITE_CONTRACT_ADDRESS in .env.local",
        variant: "destructive",
      });
      return;
    }

    if (mood[0] < 1 || mood[0] > 5) {
      toast({
        title: "Invalid Mood",
        description: "Mood must be between 1 and 5.",
        variant: "destructive",
      });
      return;
    }

    if (habitCompletion[0] < 0 || habitCompletion[0] > 100) {
      toast({
        title: "Invalid Habit Completion",
        description: "Habit completion must be between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDailyRecord(mood[0], habitCompletion[0]);
      
      // Reset form on success
      setMood([3]);
      setHabitCompletion([50]);
      
      toast({
        title: "Record Added Successfully! 🎉",
        description: `Mood: ${mood[0]}/5, Habit Completion: ${habitCompletion[0]}% has been encrypted and recorded.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit record",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Log Daily Record
            </CardTitle>
            <CardDescription className="text-base">
              Record your mood and habit completion. All data is encrypted before storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  Mood (1-5)
                </label>
                <div className="space-y-2">
                  <Slider
                    value={mood}
                    onValueChange={setMood}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1 (Very Low)</span>
                    <span className="font-medium text-foreground">Current: {mood[0]}</span>
                    <span>5 (Very High)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Habit Completion Rate (0-100%)
                </label>
                <div className="space-y-2">
                  <Slider
                    value={habitCompletion}
                    onValueChange={setHabitCompletion}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0%</span>
                    <span className="font-medium text-foreground">Current: {habitCompletion[0]}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">Encryption Status:</span>
                <span className="font-mono text-foreground">
                  {isConnected ? "Ready to encrypt" : "Connect wallet first"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your data will be encrypted using FHEVM before blockchain storage
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isConnected || !CONTRACT_ADDRESS}
              className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Encrypting & Logging...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  {!CONTRACT_ADDRESS ? "Contract Not Configured" : isConnected ? "Log Record" : "Connect Wallet First"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default HabitMoodLogger;

