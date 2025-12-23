import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MoodData {
  dayIndex: number;
  mood: number;
  timestamp: number;
  date: string;
}

interface MoodChartProps {
  data: MoodData[];
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
          <span className="font-medium">Mood:</span> {data.mood}/5
        </p>
      </div>
    );
  }
  return null;
};

const getMoodEmoji = (mood: number) => {
  if (mood >= 4.5) return '😄';
  if (mood >= 3.5) return '🙂';
  if (mood >= 2.5) return '😐';
  if (mood >= 1.5) return '😕';
  return '😢';
};

const getTrendIndicator = (data: MoodData[]) => {
  if (data.length < 2) return null;

  const first = data[0].mood;
  const last = data[data.length - 1].mood;
  const change = last - first;

  if (Math.abs(change) < 0.1) {
    return {
      icon: Minus,
      text: 'Stable',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted'
    };
  }

  if (change > 0) {
    return {
      icon: TrendingUp,
      text: `+${change.toFixed(1)}`,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    };
  }

  return {
    icon: TrendingDown,
    text: change.toFixed(1),
    color: 'text-red-400',
    bgColor: 'bg-red-500/10'
  };
};

export const MoodChart = ({ data, title = "Mood Trend", className = "" }: MoodChartProps) => {
  const trend = getTrendIndicator(data);

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
            {data.length} data point{data.length !== 1 ? 's' : ''}
          </p>
        </div>
        {trend && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${trend.bgColor}`}>
            <trend.icon className={`w-4 h-4 ${trend.color}`} />
            <span className={`text-sm font-medium ${trend.color}`}>
              {trend.text}
            </span>
          </div>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="dayIndex"
              tickFormatter={(value) => `Day ${value + 1}`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              domain={[1, 5]}
              tickFormatter={(value) => `${value}`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="mood"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#moodGradient)"
            />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mood Scale Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>😢</span>
          <span>1</span>
        </div>
        <div className="flex items-center gap-1">
          <span>😕</span>
          <span>2</span>
        </div>
        <div className="flex items-center gap-1">
          <span>😐</span>
          <span>3</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🙂</span>
          <span>4</span>
        </div>
        <div className="flex items-center gap-1">
          <span>😄</span>
          <span>5</span>
        </div>
      </div>
    </div>
  );
};
