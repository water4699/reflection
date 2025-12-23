import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Heart, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useHabitMoodTracker } from "@/hooks/useHabitMoodTracker";
import { MoodSelector } from "./MoodSelector";
import { HabitCompletionSelector } from "./HabitCompletionSelector";
import { motion } from "framer-motion";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const HabitMoodLogger = () => {
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const [mood, setMood] = useState([3]);
  const [habitCompletion, setHabitCompletion] = useState([50]);

  const { addDailyRecord, batchAddDailyRecords, isLoading, message } = useHabitMoodTracker(CONTRACT_ADDRESS);

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

    if (!/^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS)) {
      toast({
        title: "Invalid Contract Address",
        description: "Contract address must be a valid Ethereum address",
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

      const moodEmoji = ['😢', '😕', '😐', '🙂', '😄'][mood[0] - 1];
      toast({
        title: "Record Added Successfully! 🎉",
        description: `Mood: ${moodEmoji} ${mood[0]}/5, Habit Completion: ${habitCompletion[0]}% has been encrypted and recorded.`,
      });
    } catch (error: any) {
      console.error("Failed to add daily record:", error);
      const errorMessage = error.message || "Failed to submit record";

      // Provide more specific error messages
      let description = errorMessage;
      if (errorMessage.includes("User rejected")) {
        description = "Transaction was cancelled by user";
      } else if (errorMessage.includes("insufficient funds")) {
        description = "Insufficient funds for transaction";
      } else if (errorMessage.includes("network")) {
        description = "Network error - please check your connection";
      }

      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <motion.section
      className="py-8 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto max-w-2xl">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="border-border card-premium card-logger relative overflow-hidden card-hover">
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-secondary/10 to-primary/10 rounded-full" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-3xl text-gradient-animated">
                Log Daily Record
              </CardTitle>
              <CardDescription className="text-base">
                Record your mood and habit completion. All data is encrypted before storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <MoodSelector
                    value={mood}
                    onChange={setMood}
                    disabled={isLoading}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <HabitCompletionSelector
                    value={habitCompletion}
                    onChange={setHabitCompletion}
                    disabled={isLoading}
                  />
                </motion.div>
              </div>

              <motion.div
                className="bg-muted/50 rounded-lg p-4 space-y-2 glass"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
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
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !isConnected || !CONTRACT_ADDRESS}
                  className="w-full gap-2 btn-primary btn-animated"
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
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HabitMoodLogger;