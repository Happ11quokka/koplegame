'use client';

import { useState, useEffect } from 'react';
import { ParticipantWithHints, Round, FilterState, HintLevel, ParticipantMatchInfo, MatchStatus } from '@/types';
import { UserIcon, EyeIcon, FunnelIcon, MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ParticipantFeedProps {
  eventId: string;
  activeRound: Round | null;
  filters: FilterState;
  currentUserId?: string;
  participantId?: string; // Current participant's ID for matching
}

export function ParticipantFeed({
  eventId,
  activeRound,
  filters,
  currentUserId,
  participantId
}: ParticipantFeedProps) {
  const [matchInfo, setMatchInfo] = useState<ParticipantMatchInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventId && participantId) {
      fetchMatchInfo();
    }
  }, [eventId, participantId, activeRound]);

  const fetchMatchInfo = async () => {
    if (!participantId) return;

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`/api/events/${eventId}/my-target?participantId=${participantId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('No matching assignment found. Please wait for the organizer to create matches.');
        } else {
          throw new Error(`Failed to fetch target: ${response.statusText}`);
        }
        return;
      }

      const data: ParticipantMatchInfo = await response.json();
      setMatchInfo(data);
    } catch (error) {
      console.error('Error fetching match info:', error);
      setError('Failed to load your target');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMatchStatus = async (status: MatchStatus) => {
    if (!participantId) return;

    try {
      const response = await fetch(`/api/events/${eventId}/update-match-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participantId,
          status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update match status');
      }

      // Refresh match info
      await fetchMatchInfo();
    } catch (error) {
      console.error('Error updating match status:', error);
      setError('Failed to update match status');
    }
  };

  const getVisibleHintLevels = (): HintLevel[] => {
    return activeRound?.visibleLevels || [];
  };

  const renderHintContent = (hint: { payload: any }) => {
    const payload = hint.payload;
    const items: string[] = [];

    // H1: Preferences
    if (payload.musicGenre) items.push(`🎵 Music: ${payload.musicGenre}`);
    if (payload.faveSong) items.push(`🎶 Favorite Song: ${payload.faveSong}`);
    if (payload.coffeeOrTea) items.push(`☕ Drinks: ${payload.coffeeOrTea}`);
    if (payload.taste) items.push(`👅 Taste: ${payload.taste}`);
    if (payload.chronotype) items.push(`⏰ Time: ${payload.chronotype} person`);

    // H2: Interests & Background
    if (payload.majorOrDomain) items.push(`📚 Field: ${payload.majorOrDomain}`);
    if (payload.sportsTeam) items.push(`⚽ Team: ${payload.sportsTeam}`);
    if (payload.travelStyle) items.push(`✈️ Travel: ${payload.travelStyle}`);
    if (payload.hobbies?.length) items.push(`🎯 Hobbies: ${payload.hobbies.join(', ')}`);

    // H3: Language & Communication
    if (payload.languages?.length) items.push(`🗣️ Languages: ${payload.languages.join(', ')}`);
    if (payload.languageNote) items.push(`💬 Language Note: ${payload.languageNote}`);
    if (payload.favEmojis?.length) items.push(`😊 Favorite Emojis: ${payload.favEmojis.join(' ')}`);
    if (payload.communicationStyle) items.push(`💭 Communication: ${payload.communicationStyle}`);

    // H4: Physical Appearance
    if (payload.topColor) items.push(`👕 Top Color: ${payload.topColor}`);
    if (payload.glasses !== undefined) items.push(`👓 Glasses: ${payload.glasses ? 'Yes' : 'No'}`);
    if (payload.cap !== undefined) items.push(`🧢 Cap: ${payload.cap ? 'Yes' : 'No'}`);
    if (payload.shoesColor) items.push(`👟 Shoes: ${payload.shoesColor}`);
    if (payload.bagType) items.push(`🎒 Bag: ${payload.bagType}`);
    if (payload.height) items.push(`📏 Height: ${payload.height}`);

    // H5: Personal Items
    if (payload.phoneCase) items.push(`📱 Phone Case: ${payload.phoneCase}`);
    if (payload.wristAccessory) items.push(`⌚ Wrist: ${payload.wristAccessory}`);
    if (payload.uniqueAccessory) items.push(`✨ Unique Item: ${payload.uniqueAccessory}`);

    // H6: Key Identifiers
    if (payload.nameInitials) items.push(`📝 Initials: ${payload.nameInitials}`);
    if (payload.originRegion) items.push(`🌍 Origin: ${payload.originRegion}`);
    if (payload.expectedSpot) items.push(`📍 Expected Spot: ${payload.expectedSpot}`);
    if (payload.currentCity) items.push(`🏙️ Current City: ${payload.currentCity}`);

    return items.length > 0 ? (
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-sm">{item}</li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-gray-500 italic">No details available</p>
    );
  };

  const renderTargetCard = () => {
    if (!matchInfo?.target) return null;

    const { target, assignment } = matchInfo;
    const visibleLevels = getVisibleHintLevels();
    const statusIcon = assignment?.status === 'found' ?
      <CheckCircleIcon className="w-5 h-5 text-green-600" /> :
      <MagnifyingGlassIcon className="w-5 h-5 text-blue-600" />;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
              {target.profileEmoji || target.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Your Target</h3>
              <p className="text-sm text-gray-600">
                {target.lang === 'en' && '🇺🇸 English'}
                {target.lang === 'ko' && '🇰🇷 한국어'}
                {target.lang === 'ja' && '🇯🇵 日本語'}
                {target.lang === 'zh' && '🇨🇳 中文'}
                {target.lang === 'es' && '🇪🇸 Español'}
                {target.lang === 'fr' && '🇫🇷 Français'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusIcon}
            <span className={`text-sm font-medium ${
              assignment?.status === 'found' ? 'text-green-700' : 'text-blue-700'
            }`}>
              {assignment?.status === 'found' ? 'Found!' : 'Searching...'}
            </span>
          </div>
        </div>

        {/* Status Message */}
        <div className={`mb-4 p-3 rounded-lg ${
          assignment?.status === 'found'
            ? 'bg-green-50 border border-green-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-sm ${
            assignment?.status === 'found' ? 'text-green-800' : 'text-blue-800'
          }`}>
            {assignment?.status === 'found'
              ? "🎉 Congratulations! You've found your target. You can now complete the match."
              : "🔍 Use the hints below to find this person at the event. Look around and match the clues!"
            }
          </p>
        </div>

        {/* Action Buttons */}
        {assignment?.status === 'pending' && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => updateMatchStatus('found')}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              I Found Them! ✅
            </button>
          </div>
        )}

        {assignment?.status === 'found' && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => updateMatchStatus('completed')}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Complete Match 🤝
            </button>
            <button
              onClick={() => updateMatchStatus('pending')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Undo
            </button>
          </div>
        )}

        {/* Hints */}
        <div className="space-y-3">
          {visibleLevels.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">
                  Available Hints ({visibleLevels.join(', ')}):
                </h4>
                <span className="text-xs text-gray-500">
                  {target.submittedLevels.length}/6 levels submitted
                </span>
              </div>
              {target.visibleHints.length > 0 ? (
                <div className="space-y-3">
                  {target.visibleHints.map((hint) => (
                    <div key={hint.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-400">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                          {hint.level}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {renderHintContent(hint)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Your target hasn't submitted hints for the current round yet. Please wait...
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                No hints visible yet. Wait for the organizer to start a round.
              </p>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>Target's Progress: {target.submittedLevels.length}/6 levels</span>
          <div className="flex gap-1">
            {(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'] as HintLevel[]).map((level) => (
              <div
                key={level}
                className={`w-2 h-2 rounded-full ${
                  target.submittedLevels.includes(level)
                    ? 'bg-green-400'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-200"></div>
          <div>
            <div className="w-32 h-5 bg-gray-200 rounded mb-2"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg h-32 mb-4"></div>
        <div className="bg-gray-100 rounded-lg h-20"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <UserIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Unable to Load Target</h3>
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={fetchMatchInfo}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No participant ID provided
  if (!participantId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <UserIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-yellow-900 mb-2">Authentication Required</h3>
        <p className="text-yellow-800">
          Please ensure you're properly logged in to view your target.
        </p>
      </div>
    );
  }

  // No matching found
  if (!matchInfo) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <MagnifyingGlassIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-blue-900 mb-2">Waiting for Matches</h3>
        <p className="text-blue-800 mb-4">
          The organizer hasn't created matches yet. Please wait for the matching phase to begin.
        </p>
        <button
          onClick={fetchMatchInfo}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Check Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 Find Your Target</h2>
        <p className="text-gray-600">
          Use the hints below to find this person at the event. Good luck!
        </p>
      </div>

      {/* Target Card */}
      {renderTargetCard()}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 How to Play</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use the hints above to identify your target person</li>
          <li>• Look around the event space for someone matching the clues</li>
          <li>• When you find them, click "I Found Them!" button</li>
          <li>• Introduce yourself and complete the networking!</li>
        </ul>
      </div>
    </div>
  );
}