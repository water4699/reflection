import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface MoodOption {
  value: number;
  emoji: string;
  label: string;
  description: string;
  color: string;
}

const moodOptions: MoodOption[] = [
  {
    value: 1,
    emoji: '😢',
    label: 'Very Low',
    description: 'Feeling very down',
    color: 'from-red-500 to-red-600'
  },
  {
    value: 2,
    emoji: '😕',
    label: 'Low',
    description: 'Not feeling great',
    color: 'from-orange-500 to-orange-600'
  },
  {
    value: 3,
    emoji: '😐',
    label: 'Neutral',
    description: 'Feeling okay',
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    value: 4,
    emoji: '🙂',
    label: 'High',
    description: 'Feeling good',
    color: 'from-lime-500 to-lime-600'
  },
  {
    value: 5,
    emoji: '😄',
    label: 'Very High',
    description: 'Feeling amazing',
    color: 'from-green-500 to-green-600'
  }
];

interface MoodSelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
  className?: string;
}

export const MoodSelector = ({ value, onChange, disabled = false, className = "" }: MoodSelectorProps) => {
  const [hoveredMood, setHoveredMood] = useState<number | null>(null);
  const selectedMood = value[0];

  const handleMoodSelect = (moodValue: number) => {
    if (disabled) return;
    onChange([moodValue]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <span className="text-lg">😊</span>
          How are you feeling?
        </label>
        <p className="text-xs text-muted-foreground">
          Select your current mood level
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {moodOptions.map((mood) => {
          const isSelected = selectedMood === mood.value;
          const isHovered = hoveredMood === mood.value;

          return (
            <motion.div
              key={mood.value}
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
              className="relative"
            >
              <Button
                type="button"
                variant="ghost"
                disabled={disabled}
                onClick={() => handleMoodSelect(mood.value)}
                onMouseEnter={() => setHoveredMood(mood.value)}
                onMouseLeave={() => setHoveredMood(null)}
                className={`
                  relative w-full aspect-square rounded-xl border-2 transition-all duration-200
                  ${isSelected
                    ? `bg-gradient-to-br ${mood.color} border-transparent text-white shadow-lg`
                    : isHovered && !disabled
                    ? `bg-gradient-to-br ${mood.color} border-transparent text-white shadow-md`
                    : 'bg-muted/50 border-border hover:border-primary/50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                    {mood.value}
                  </span>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                  >
                    <span className="text-xs text-primary-foreground">✓</span>
                  </motion.div>
                )}
              </Button>

              {/* Tooltip on hover */}
              {(isHovered || isSelected) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg z-10 min-w-max"
                >
                  <div className="text-center">
                    <div className="font-medium text-sm">{mood.label}</div>
                    <div className="text-xs text-muted-foreground">{mood.description}</div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Selected mood summary */}
      {selectedMood && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-3 p-3 bg-muted/30 rounded-lg"
        >
          <span className="text-2xl">
            {moodOptions.find(m => m.value === selectedMood)?.emoji}
          </span>
          <div className="text-center">
            <div className="font-medium">
              {moodOptions.find(m => m.value === selectedMood)?.label}
            </div>
            <div className="text-sm text-muted-foreground">
              Mood level: {selectedMood}/5
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
