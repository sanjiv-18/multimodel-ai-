import React from 'react';

interface MasteryBarProps {
  score: number; // 0.0 to 1.0
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const MasteryBar: React.FC<MasteryBarProps> = ({
  score,
  label,
  showPercentage = true,
  size = 'md',
}) => {
  const percentage = Math.round(score * 100);

  const getColorClass = () => {
    if (score < 0.40) return 'bg-rose-500';
    if (score < 0.75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getTextColorClass = () => {
    if (score < 0.40) return 'text-rose-400';
    if (score < 0.75) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getHeightClass = () => {
    switch (size) {
      case 'sm':
        return 'h-1.5';
      case 'lg':
        return 'h-3.5';
      default:
        return 'h-2.5';
    }
  };

  return (
    <div className="w-full space-y-1.5">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-medium">
          {label && <span className="text-slate-300 truncate max-w-[70%]">{label}</span>}
          {showPercentage && (
            <span className={`font-mono font-semibold ${getTextColorClass()}`}>
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${getHeightClass()}`}>
        <div
          className={`${getColorClass()} ${getHeightClass()} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.max(4, Math.min(100, percentage))}%` }}
        />
      </div>
    </div>
  );
};
