import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Lock, Eye, BarChart3 } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useHabitMoodTracker } from "@/hooks/useHabitMoodTracker";
import { DashboardCharts } from "./charts/DashboardCharts";
import { CalendarView } from "./CalendarView";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const HabitMoodViewer = () => {
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const [decryptingIndex, setDecryptingIndex] = useState<number | null>(null);
  const [decryptingAll, setDecryptingAll] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterMood, setFilterMood] = useState<number | null>(null);
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'chart'>('list');

  const {
    records,
    dayCount,
    loadRecords,
    decryptRecord,
    isLoading,
    message,
    clearDecryptionCache,
    getCacheStats
  } = useHabitMoodTracker(CONTRACT_ADDRESS);

  useEffect(() => {
    if (isConnected && CONTRACT_ADDRESS) {
      loadRecords();
    }
  }, [isConnected, CONTRACT_ADDRESS, loadRecords]);

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

  const handleDecryptAllRecords = async () => {
    if (!isConnected || decryptingAll) {
      return;
    }

    const encryptedRecords = records.filter(record => record.mood === null);
    if (encryptedRecords.length === 0) {
      toast({
        title: "All Records Decrypted",
        description: "No encrypted records to decrypt.",
      });
      return;
    }

    setDecryptingAll(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const record of encryptedRecords) {
        try {
          await decryptRecord(record.dayIndex);
          successCount++;
        } catch (error) {
          console.error(`Failed to decrypt record ${record.dayIndex}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Batch Decryption Complete",
        description: `Successfully decrypted ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
        variant: errorCount > 0 ? "destructive" : "default",
      });
    } catch (error: any) {
      toast({
        title: "Batch Decryption Error",
        description: error.message || "Failed to decrypt records",
        variant: "destructive",
      });
    } finally {
      setDecryptingAll(false);
    }
  };

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-border card-premium card-viewer relative overflow-hidden">
          <CardHeader className="relative z-10">
            <CardTitle className="text-3xl text-gradient-animated">
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
                <>
                  <div className="flex flex-wrap gap-4 items-center relative z-50">
                    <div className="flex items-center gap-2 relative z-50">
                      <label className="text-sm font-medium">Sort:</label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                        className="px-2 py-1 text-sm border rounded bg-background relative z-50"
                        style={{ zIndex: 9999 }}
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 relative z-50">
                      <label className="text-sm font-medium">Filter Mood:</label>
                      <select
                        value={filterMood || ''}
                        onChange={(e) => setFilterMood(e.target.value ? parseInt(e.target.value) : null)}
                        className="px-2 py-1 text-sm border rounded bg-background relative z-50"
                        style={{ zIndex: 9999 }}
                      >
                        <option value="">All Moods</option>
                        <option value="1">Very Low (1)</option>
                        <option value="2">Low (2)</option>
                        <option value="3">Neutral (3)</option>
                        <option value="4">High (4)</option>
                        <option value="5">Very High (5)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 relative z-50">
                      <label className="text-sm font-medium">View:</label>
                      <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as 'list' | 'calendar' | 'chart')}
                        className="px-2 py-1 text-sm border rounded bg-background relative z-50"
                        style={{ zIndex: 9999 }}
                      >
                        <option value="list">List View</option>
                        <option value="calendar">Calendar View</option>
                        <option value="chart">Chart View</option>
                      </select>
                    </div>
                  </div>

                  {/* Cache Management */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-medium">Cache Status:</span>
                        <span className="ml-2 text-green-400">
                          {getCacheStats().totalRecords} cached records
                        </span>
                      </div>
                      {getCacheStats().expiredRecords > 0 && (
                        <div className="text-sm text-yellow-400">
                          {getCacheStats().expiredRecords} expired
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDecryptAllRecords}
                        disabled={decryptingAll || !isConnected || records.filter(r => r.mood === null).length === 0}
                        className="text-xs"
                      >
                        {decryptingAll ? (
                          <>
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            Decrypting All...
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 mr-2" />
                            Decrypt All ({records.filter(r => r.mood === null).length})
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          clearDecryptionCache();
                          loadRecords();
                          toast({
                            title: "Cache Cleared",
                            description: "All cached decryption data has been cleared.",
                          });
                        }}
                        className="text-xs"
                      >
                        Clear Cache
                      </Button>
                    </div>
                  </div>

                  {viewMode === 'chart' ? (
                    <DashboardCharts records={records} />
                  ) : viewMode === 'calendar' ? (
                    <CalendarView
                      records={records}
                      onDecryptRecord={handleDecryptRecord}
                      decryptingIndex={decryptingIndex}
                    />
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

                      <div className="space-y-6">
                        {records.map((record, index) => {
                          const moodEmoji = record.mood ?
                            ['😢', '😕', '😐', '🙂', '😄'][Math.floor(record.mood) - 1] : '🔒';
                          const isRecent = index < 3; // Mark recent 3 records

                          return (
                            <div key={record.dayIndex} className="relative flex gap-4">
                              {/* Timeline dot */}
                              <div className={`
                                relative z-10 w-12 h-12 rounded-full border-4 border-background
                                ${record.mood !== null
                                  ? 'bg-gradient-to-br from-primary to-accent'
                                  : 'bg-muted'
                                }
                                ${isRecent ? 'ring-2 ring-primary/30' : ''}
                              `}>
                                <div className="w-full h-full flex items-center justify-center text-lg">
                                  {moodEmoji}
                                </div>
                              </div>

                              {/* Content card */}
                              <div className="flex-1 pb-6">
                                <div className="p-4 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium text-lg">
                                        Day {record.dayIndex + 1}
                                      </span>
                                      {isRecent && (
                                        <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                                          Recent
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">
                                        {new Date(record.timestamp * 1000).toLocaleDateString('default', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
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
                                      {record.mood !== null && (
                                        <div className="flex items-center gap-1 text-xs text-green-400">
                                          <Eye className="w-3 h-3" />
                                          Cached
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Mood Level:</span>
                                        <span className="font-medium">
                                          {record.mood !== null ? `${record.mood}/5` : "🔒 Encrypted"}
                                        </span>
                                      </div>
                                      {record.mood !== null && (
                                        <div className="flex items-center gap-2">
                                          <div className={`w-3 h-3 rounded-full ${
                                            record.mood >= 4 ? 'bg-green-500' :
                                            record.mood >= 3 ? 'bg-blue-500' :
                                            record.mood >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                                          }`}></div>
                                          <span className="text-sm text-muted-foreground">
                                            {record.mood >= 4 ? 'Very High' :
                                             record.mood >= 3 ? 'High' :
                                             record.mood >= 2 ? 'Neutral' : 'Low'}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Habit Completion:</span>
                                        <span className="font-medium">
                                          {record.habitCompletion !== null ? `${record.habitCompletion}%` : "🔒 Encrypted"}
                                        </span>
                                      </div>
                                      {record.habitCompletion !== null && (
                                        <div className="w-full bg-muted rounded-full h-2">
                                          <div
                                            className="bg-primary h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${record.habitCompletion}%` }}
                                          ></div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {records.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No records found. Log your first record to get started.</p>
                  {!CONTRACT_ADDRESS && (
                    <p className="text-xs mt-2 text-destructive">
                      Contract address not configured. Set VITE_CONTRACT_ADDRESS in .env.local
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default HabitMoodViewer;