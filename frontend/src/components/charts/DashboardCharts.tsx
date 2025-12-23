import { useMemo } from 'react';
import { MoodChart } from './MoodChart';
import { HabitChart } from './HabitChart';
import { Heart, Target, Calendar, TrendingUp } from 'lucide-react';

interface DailyRecord {
  dayIndex: number;
  mood: number | null;
  habitCompletion: number | null;
  timestamp: number;
}

interface DashboardChartsProps {
  records: DailyRecord[];
  className?: string;
}

export const DashboardCharts = ({ records, className = "" }: DashboardChartsProps) => {
  const chartData = useMemo(() => {
    return records
      .filter(record => record.mood !== null && record.habitCompletion !== null)
      .map(record => ({
        dayIndex: record.dayIndex,
        mood: record.mood!,
        habitCompletion: record.habitCompletion!,
        timestamp: record.timestamp,
        date: new Date(record.timestamp * 1000).toLocaleDateString(),
      }))
      .sort((a, b) => a.dayIndex - b.dayIndex);
  }, [records]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const moods = chartData.map(d => d.mood);
    const habits = chartData.map(d => d.habitCompletion);

    const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
    const avgHabits = habits.reduce((a, b) => a + b, 0) / habits.length;

    const moodChange = moods.length > 1 ? moods[moods.length - 1] - moods[0] : 0;
    const habitChange = habits.length > 1 ? habits[habits.length - 1] - habits[0] : 0;

    const correlation = (() => {
      if (moods.length < 2) return 0;
      const n = moods.length;
      const sumXY = moods.reduce((sum, mood, i) => sum + mood * habits[i], 0);
      const sumX = moods.reduce((a, b) => a + b, 0);
      const sumY = habits.reduce((a, b) => a + b, 0);
      const sumX2 = moods.reduce((sum, x) => sum + x * x, 0);
      const sumY2 = habits.reduce((sum, y, i) => sum + y * y, 0);

      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

      return denominator === 0 ? 0 : numerator / denominator;
    })();

    return {
      avgMood: Math.round(avgMood * 10) / 10,
      avgHabits: Math.round(avgHabits),
      moodChange: Math.round(moodChange * 10) / 10,
      habitChange: Math.round(habitChange * 10) / 10,
      correlation: Math.round(correlation * 100) / 100,
      totalDays: chartData.length,
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className={`text-center py-12 text-muted-foreground ${className}`}>
        <div className="text-6xl mb-4">📈</div>
        <h3 className="text-lg font-medium mb-2">No Data Available</h3>
        <p>Decrypt some records to see your mood and habit trends</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Avg Mood</span>
            </div>
            <div className="text-2xl font-bold">{stats.avgMood}/5</div>
            <div className={`text-xs ${stats.moodChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.moodChange >= 0 ? '+' : ''}{stats.moodChange} from start
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Avg Habits</span>
            </div>
            <div className="text-2xl font-bold">{stats.avgHabits}%</div>
            <div className={`text-xs ${stats.habitChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.habitChange >= 0 ? '+' : ''}{stats.habitChange}% from start
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Correlation</span>
            </div>
            <div className="text-2xl font-bold">{stats.correlation}</div>
            <div className="text-xs text-muted-foreground">
              {stats.correlation > 0.5 ? 'Strong +' :
               stats.correlation > 0.3 ? 'Moderate +' :
               stats.correlation < -0.3 ? 'Moderate -' :
               'Weak'}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Days</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalDays}</div>
            <div className="text-xs text-muted-foreground">
              data points
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <MoodChart data={chartData} />
        <HabitChart data={chartData} />
      </div>
    </div>
  );
};
