'use client';

import { useState, useEffect } from 'react';
import { HintLevel } from '@/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface HintNavigationProps {
  currentLevel: HintLevel;
  onLevelChange: (level: HintLevel) => void;
  eventId?: string;
  userId?: string;
}

export function HintNavigation({
  currentLevel,
  onLevelChange,
  eventId,
  userId,
}: HintNavigationProps) {
  const [completedLevels, setCompletedLevels] = useState<Set<HintLevel>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const levels: { level: HintLevel; title: string; description: string }[] = [
    {
      level: 'H1',
      title: 'Preferences',
      description: 'Music, food, lifestyle',
    },
    {
      level: 'H2',
      title: 'Interests',
      description: 'Studies, hobbies, sports',
    },
    {
      level: 'H3',
      title: 'Communication',
      description: 'Languages, style',
    },
    {
      level: 'H4',
      title: 'Appearance',
      description: 'Clothing, accessories',
    },
    {
      level: 'H5',
      title: 'Personal Items',
      description: 'Phone, accessories',
    },
    {
      level: 'H6',
      title: 'Identifiers',
      description: 'Final clues',
    },
  ];

  useEffect(() => {
    if (eventId && userId) {
      loadCompletedLevels();
    }
  }, [eventId, userId]);

  const loadCompletedLevels = async () => {
    if (!eventId || !userId) return;

    try {
      const hintsRef = collection(db, `events/${eventId}/participants/${userId}/hints`);
      const hintsSnapshot = await getDocs(hintsRef);

      const completed = new Set<HintLevel>();
      hintsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'ok') {
          completed.add(data.level as HintLevel);
        }
      });

      setCompletedLevels(completed);
    } catch (error) {
      console.error('Error loading completed levels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:sticky lg:top-6">
      <h3 className="font-semibold text-gray-900 mb-4">Hint Levels</h3>

      <div className="space-y-2">
        {levels.map((levelData, index) => {
          const isCompleted = completedLevels.has(levelData.level);
          const isCurrent = currentLevel === levelData.level;
          const isAccessible = index === 0 || completedLevels.has(levels[index - 1]?.level);

          return (
            <button
              key={levelData.level}
              onClick={() => isAccessible ? onLevelChange(levelData.level) : null}
              disabled={!isAccessible}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                isCurrent
                  ? 'border-blue-500 bg-blue-50'
                  : isCompleted
                  ? 'border-green-200 bg-green-50 hover:bg-green-100'
                  : isAccessible
                  ? 'border-gray-200 bg-white hover:bg-gray-50'
                  : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-medium text-sm ${
                  isCurrent
                    ? 'text-blue-700'
                    : isCompleted
                    ? 'text-green-700'
                    : isAccessible
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}>
                  {levelData.level}
                </span>

                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                ) : isCompleted ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                ) : isCurrent ? (
                  <ClockIcon className="w-5 h-5 text-blue-600" />
                ) : null}
              </div>

              <div className={`text-xs ${
                isCurrent
                  ? 'text-blue-600'
                  : isCompleted
                  ? 'text-green-600'
                  : isAccessible
                  ? 'text-gray-600'
                  : 'text-gray-400'
              }`}>
                <div className="font-medium">{levelData.title}</div>
                <div className="mt-0.5">{levelData.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Progress: {completedLevels.size} of {levels.length} completed
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(completedLevels.size / levels.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Tips:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Use creative descriptions</li>
          <li>• Avoid personal information</li>
          <li>• Think about what makes you unique</li>
          <li>• Save drafts as you work</li>
        </ul>
      </div>
    </div>
  );
}