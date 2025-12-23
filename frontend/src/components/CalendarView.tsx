import { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface DailyRecord {
  dayIndex: number;
  mood: number | null;
  habitCompletion: number | null;
  timestamp: number;
}

interface CalendarViewProps {
  records: DailyRecord[];
  onDecryptRecord: (dayIndex: number) => void;
  decryptingIndex: number | null;
  className?: string;
}

interface CalendarDay {
  date: Date;
  dayIndex: number | null;
  mood: number | null;
  habitCompletion: number | null;
  hasRecord: boolean;
  isToday: boolean;
}

const getMoodColor = (mood: number | null) => {
  if (!mood) return 'bg-muted';
  if (mood >= 4.5) return 'bg-green-500';
  if (mood >= 3.5) return 'bg-blue-500';
  if (mood >= 2.5) return 'bg-yellow-500';
  if (mood >= 1.5) return 'bg-orange-500';
  return 'bg-red-500';
};

const getMoodEmoji = (mood: number | null) => {
  if (!mood) return '';
  if (mood >= 4.5) return '😄';
  if (mood >= 3.5) return '🙂';
  if (mood >= 2.5) return '😐';
  if (mood >= 1.5) return '😕';
  return '😢';
};

export const CalendarView = ({
  records,
  onDecryptRecord,
  decryptingIndex,
  className = ""
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const { calendarDays, monthName, year } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // End on Saturday

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create record lookup map
    const recordMap = new Map<number, DailyRecord>();
    records.forEach(record => {
      const recordDate = new Date(record.timestamp * 1000);
      recordDate.setHours(0, 0, 0, 0);
      recordMap.set(record.dayIndex, record);
    });

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayIndex = records.find(r => {
        const recordDate = new Date(r.timestamp * 1000);
        return recordDate.toDateString() === d.toDateString();
      })?.dayIndex ?? null;

      const record = dayIndex !== null ? recordMap.get(dayIndex) : null;
      const isToday = d.toDateString() === today.toDateString();

      days.push({
        date: new Date(d),
        dayIndex,
        mood: record?.mood ?? null,
        habitCompletion: record?.habitCompletion ?? null,
        hasRecord: record !== null,
        isToday,
      });
    }

    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    return { calendarDays: days, monthName, year };
  }, [currentDate, records]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDay(null);
  };

  const selectedRecord = selectedDay ? records.find(r => {
    const recordDate = new Date(r.timestamp * 1000);
    return recordDate.toDateString() === selectedDay.toDateString();
  }) : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CalendarIcon className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Calendar View</h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="w-8 h-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="min-w-[140px] text-center">
            <div className="font-medium">{monthName}</div>
            <div className="text-sm text-muted-foreground">{year}</div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="w-8 h-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: day.hasRecord ? 1.05 : 1 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Button
              variant="ghost"
              className={`
                w-full aspect-square p-1 h-auto relative
                ${day.isToday ? 'ring-2 ring-primary' : ''}
                ${selectedDay?.toDateString() === day.date.toDateString() ? 'ring-2 ring-accent' : ''}
              `}
              onClick={() => setSelectedDay(day.date)}
              disabled={!day.hasRecord}
            >
              <div className="w-full h-full flex flex-col items-center justify-center">
                <span className={`text-sm ${day.isToday ? 'font-bold text-primary' : ''}`}>
                  {day.date.getDate()}
                </span>

                {day.hasRecord && (
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs mt-1
                    ${getMoodColor(day.mood)}
                    ${day.mood ? 'text-white' : 'text-muted-foreground'}
                  `}>
                    {getMoodEmoji(day.mood)}
                  </div>
                )}
              </div>
            </Button>

            {/* Habit completion indicator */}
            {day.hasRecord && day.habitCompletion !== null && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-2 rounded-full bg-primary opacity-60"></div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Selected day details */}
      {selectedRecord && selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-muted/50 rounded-lg border"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">
              {selectedDay.toLocaleDateString('default', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h4>

            {selectedRecord.mood === null && (
              <Button
                size="sm"
                onClick={() => onDecryptRecord(selectedRecord.dayIndex)}
                disabled={decryptingIndex === selectedRecord.dayIndex}
              >
                {decryptingIndex === selectedRecord.dayIndex ? 'Decrypting...' : 'Decrypt'}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Mood:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{getMoodEmoji(selectedRecord.mood)}</span>
                <span className="font-medium">
                  {selectedRecord.mood !== null ? `${selectedRecord.mood}/5` : "🔒 Encrypted"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-sm text-muted-foreground">Habit Completion:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-medium">
                  {selectedRecord.habitCompletion !== null ? `${selectedRecord.habitCompletion}%` : "🔒 Encrypted"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
