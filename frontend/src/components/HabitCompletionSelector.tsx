import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from 'lucide-react';

interface HabitCompletionSelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
  className?: string;
}

const getCompletionLevel = (percentage: number) => {
  if (percentage >= 90) return { text: 'Excellent!', emoji: '🎯', color: 'text-green-400' };
  if (percentage >= 75) return { text: 'Great!', emoji: '⭐', color: 'text-blue-400' };
  if (percentage >= 50) return { text: 'Good', emoji: '👍', color: 'text-yellow-400' };
  if (percentage >= 25) return { text: 'Fair', emoji: '👌', color: 'text-orange-400' };
  return { text: 'Keep going!', emoji: '💪', color: 'text-red-400' };
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return 'stroke-green-500';
  if (percentage >= 60) return 'stroke-blue-500';
  if (percentage >= 40) return 'stroke-yellow-500';
  if (percentage >= 20) return 'stroke-orange-500';
  return 'stroke-red-500';
};

export const HabitCompletionSelector = ({
  value,
  onChange,
  disabled = false,
  className = ""
}: HabitCompletionSelectorProps) => {
  const [percentage, setPercentage] = useState(value[0] || 50);
  const [isDragging, setIsDragging] = useState(false);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    setPercentage(value[0] || 50);
  }, [value]);

  const handleValueChange = (newValue: number) => {
    const clampedValue = Math.max(0, Math.min(100, newValue));
    setPercentage(clampedValue);
    onChange([clampedValue]);
  };

  const handleIncrement = () => {
    handleValueChange(percentage + 5);
  };

  const handleDecrement = () => {
    handleValueChange(percentage - 5);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGCircleElement>) => {
    if (disabled) return;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;

    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    const angle = Math.atan2(y, x);
    let newPercentage = ((angle + Math.PI) / (2 * Math.PI)) * 100;

    // Adjust for the fact that we want 0 at the top
    newPercentage = 100 - newPercentage;
    if (newPercentage < 0) newPercentage += 100;

    handleValueChange(Math.round(newPercentage / 5) * 5); // Round to nearest 5
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const level = getCompletionLevel(percentage);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <span className="text-lg">🎯</span>
          Habit Completion Rate
        </label>
        <p className="text-xs text-muted-foreground">
          How much of your planned habits did you complete today?
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        {/* Circular Progress */}
        <div className="relative">
          <svg
            width="200"
            height="200"
            className="transform -rotate-90"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="100"
              cy="100"
              r={radius}
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`${getProgressColor(percentage)} cursor-${disabled ? 'not-allowed' : 'pointer'}`}
              onMouseDown={handleMouseDown}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={percentage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <div className="text-3xl font-bold">{percentage}%</div>
              <div className="text-lg">{level.emoji}</div>
              <div className={`text-sm font-medium ${level.color}`}>
                {level.text}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDecrement}
            disabled={disabled || percentage <= 0}
            className="w-10 h-10 p-0"
          >
            <Minus className="w-4 h-4" />
          </Button>

          <div className="text-center min-w-[120px]">
            <div className="text-sm font-medium">Quick Adjust</div>
            <div className="text-xs text-muted-foreground">±5% increments</div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleIncrement}
            disabled={disabled || percentage >= 100}
            className="w-10 h-10 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Preset buttons */}
        <div className="flex gap-2">
          {[25, 50, 75, 100].map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={percentage === preset ? "default" : "outline"}
              size="sm"
              onClick={() => handleValueChange(preset)}
              disabled={disabled}
              className="min-w-[50px]"
            >
              {preset}%
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
