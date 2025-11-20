import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Lock, Eye } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useHabitMoodTracker } from "@/hooks/useHabitMoodTracker";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const HabitMoodViewer = () => {
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const [decryptingIndex, setDecryptingIndex] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterMood, setFilterMood] = useState<number | null>(null);
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');

  const { records, dayCount, loadRecords, decryptRecord, isLoading, message } = useHabitMoodTracker(CONTRACT_ADDRESS);

  useEffect(() => {
    if (isConnected && CONTRACT_ADDRESS) {
      loadRecords();
    }
  }, [isConnected, CONTRACT_ADDRESS]);

  useEffect(() => {
    if (message) {
      if (message.includes("Error") || message.includes("error")) {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } else if (!message.includes("Decrypting") && !message.includes("Loading")) {
        toast({
          title: message.includes("decrypted") ? "Success" : "Info",
          description: message,
        });
      }
    }
  }, [message, toast]);

  const handleLoadRecords = useCallback(async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to view records.",
        variant: "destructive",
      });
      return;
    }
    await loadRecords();
  }, [isConnected, loadRecords, toast]);

  const handleDecryptRecord = async (dayIndex: number) => {
    if (!isConnected) {
      return;
    }

    setDecryptingIndex(dayIndex);
    try {
      await decryptRecord(dayIndex);
      toast({
        title: "Decryption Complete",
        description: "Record decrypted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Decryption Error",
        description: error.message || "Failed to decrypt record",
        variant: "destructive",
      });
    } finally {
      setDecryptingIndex(null);
    }
  };

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              View Records
            </CardTitle>
            <CardDescription className="text-base">
              View and decrypt your encrypted habit and mood records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-center">
                <Button
                  onClick={handleLoadRecords}
                  disabled={isLoading || !isConnected || !CONTRACT_ADDRESS}
                  variant="outline"
                >
                  {isLoading ? "Loading..." : "Refresh Records"}
                </Button>

                {dayCount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {dayCount} record{dayCount !== 1 ? 's' : ''} found
                  </span>
                )}
              </div>

              {records.length > 0 && (
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Sort:</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      className="px-2 py-1 text-sm border rounded"
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Filter Mood:</label>
                    <select
                      value={filterMood || ''}
                      onChange={(e) => setFilterMood(e.target.value ? parseInt(e.target.value) : null)}
                      className="px-2 py-1 text-sm border rounded"
                    >
                      <option value="">All Moods</option>
                      <option value="1">Very Low (1)</option>
                      <option value="2">Low (2)</option>
                      <option value="3">Neutral (3)</option>
                      <option value="4">High (4)</option>
                      <option value="5">Very High (5)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">View:</label>
                    <select
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value as 'list' | 'chart')}
                      className="px-2 py-1 text-sm border rounded"
                    >
                      <option value="list">List View</option>
                      <option value="chart">Chart View</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No records found. Log your first record to get started.</p>
                {!CONTRACT_ADDRESS && (
                  <p className="text-xs mt-2 text-destructive">
                    Contract address not configured. Set VITE_CONTRACT_ADDRESS in .env.local
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.dayIndex}
                    className="p-4 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">
                          Day {record.dayIndex + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(record.timestamp * 1000).toLocaleDateString()}
                        </span>
                        {record.mood === null && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDecryptRecord(record.dayIndex)}
                            disabled={decryptingIndex === record.dayIndex || !isConnected}
                          >
                            {decryptingIndex === record.dayIndex ? (
                              <>
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Decrypting...
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 mr-2" />
                                Decrypt
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Mood:</span>
                        <span className="ml-2 font-medium">
                          {record.mood !== null ? `${record.mood}/5` : "🔒 Encrypted"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Habit Completion:</span>
                        <span className="ml-2 font-medium">
                          {record.habitCompletion !== null ? `${record.habitCompletion}%` : "🔒 Encrypted"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default HabitMoodViewer;

