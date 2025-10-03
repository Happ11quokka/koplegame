'use client';

import { HintLevel } from '@/types';

interface ProgressBarProps {
  currentLevel: HintLevel;
  totalLevels: number;
}

export function ProgressBar({ currentLevel, totalLevels }: ProgressBarProps) {
  const levels: HintLevel[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
  const currentIndex = levels.indexOf(currentLevel);
  const progress = ((currentIndex + 1) / totalLevels) * 100;

  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-gray-600 mb-2">
        <span>Level {currentIndex + 1} of {totalLevels}</span>
        <span>{Math.round(progress)}% Complete</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between mt-2">
        {levels.map((level, index) => (
          <div
            key={level}
            className={`text-xs font-medium ${
              index <= currentIndex ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            {level}
          </div>
        ))}
      </div>
    </div>
  );
}