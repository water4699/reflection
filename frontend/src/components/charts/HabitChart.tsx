import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';

interface HabitData {
  dayIndex: number;
  habitCompletion: number;
  timestamp: number;
  date: string;
}

interface HabitChartProps {
  data: HabitData[];
  title?: string;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{`Day ${data.dayIndex + 1}`}</p>
        <p className="text-sm text-muted-foreground">{data.date}</p>
        <p className="text-sm">
          <span className="font-medium">Completion:</span> {data.habitCompletion}%
        </p>
      </div>
    );
  }
  return null;
};

const getBarColor = (completion: number) => {
  if (completion >= 80) return 'hsl(142, 76%, 36%)'; // green
  if (completion >= 60) return 'hsl(48, 96%, 53%)';  // yellow
  if (completion >= 40) return 'hsl(38, 92%, 50%)';  // orange
  return 'hsl(0, 84%, 60%)'; // red
};

const getAverageCompletion = (data: HabitData[]) => {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, item) => acc + item.habitCompletion, 0);
  return Math.round(sum / data.length);
};

const getCompletionLevel = (completion: number) => {
  if (completion >= 80) return { text: 'Excellent', emoji: '🎯', color: 'text-green-400' };
  if (completion >= 60) return { text: 'Good', emoji: '👍', color: 'text-yellow-400' };
  if (completion >= 40) return { text: 'Fair', emoji: '👌', color: 'text-orange-400' };
  return { text: 'Needs Work', emoji: '💪', color: 'text-red-400' };
};

export const HabitChart = ({ data, title = "Habit Completion", className = "" }: HabitChartProps) => {
  const averageCompletion = getAverageCompletion(data);
  const level = getCompletionLevel(averageCompletion);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-muted/30 rounded-lg border ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-2">📊</div>
          <p>No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            Average: {averageCompletion}%
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50`}>
          <span className="text-lg">{level.emoji}</span>
          <span className={`text-sm font-medium ${level.color}`}>
            {level.text}
          </span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="dayIndex"
              tickFormatter={(value) => `D${value + 1}`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="habitCompletion"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.habitCompletion)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Completion Levels Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }}></div>
          <span>80-100%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(48, 96%, 53%)' }}></div>
          <span>60-79%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(38, 92%, 50%)' }}></div>
          <span>40-59%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }}></div>
          <span>0-39%</span>
        </div>
      </div>
    </div>
  );
};
