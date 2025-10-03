'use client';

import { Event, Round } from '@/types';
import {
  AdjustmentsHorizontalIcon,
  PencilIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface EventHeaderProps {
  event: Event;
  activeRound: Round | null;
  onShowFilters: () => void;
  onEditHints: () => void;
}

export function EventHeader({
  event,
  activeRound,
  onShowFilters,
  onEditHints
}: EventHeaderProps) {
  const getRoundStatus = () => {
    if (!activeRound) {
      return { text: 'No active round', color: 'bg-gray-100 text-gray-600' };
    }

    return {
      text: `${activeRound.name}: ${activeRound.visibleLevels.join(', ')} visible`,
      color: 'bg-green-100 text-green-700'
    };
  };

  const roundStatus = getRoundStatus();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate">
              {event.title}
            </h1>
            {event.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onEditHints}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Hints</span>
            </button>

            <button
              onClick={onShowFilters}
              className="lg:hidden inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Bottom Row - Round Status & Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Round Status */}
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roundStatus.color}`}>
                {roundStatus.text}
              </span>
            </div>
          </div>

          {/* Event Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <UserGroupIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Participants</span>
            </div>

            {event.location && (
              <div className="hidden md:block">
                📍 {event.location}
              </div>
            )}
          </div>
        </div>

        {/* Round Instructions */}
        {activeRound && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current Round:</strong> {activeRound.name} -
              Hint levels {activeRound.visibleLevels.join(', ')} are now visible.
              Use these clues to find other participants!
            </p>
          </div>
        )}

        {!activeRound && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Waiting for event to start...</strong>
              The organizer will begin rounds soon. Make sure your hints are complete!
            </p>
          </div>
        )}
      </div>
    </header>
  );
}