'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  collectionGroup
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Participant, ParticipantMatchInfo, Hint, Event, Round } from '@/types';
import {
  ArrowRightOnRectangleIcon,
  UserIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function ParticipantDashboard() {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [matchInfo, setMatchInfo] = useState<ParticipantMatchInfo | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || isAdmin) {
        router.push('/participant/login');
        return;
      }
      fetchParticipantData();
    }
  }, [user, isAdmin, loading, router]);

  const fetchParticipantData = async () => {
    if (!user) return;

    try {
      // Find participant data for this user
      const participantsQuery = query(
        collectionGroup(db, 'participants'),
        where('createdBy', '==', user.uid)
      );
      const participantsSnapshot = await getDocs(participantsQuery);

      if (participantsSnapshot.empty) {
        setError('No participant profile found. Please join an event first.');
        return;
      }

      // Get the most recent participant (assuming one active event per user)
      const participantDoc = participantsSnapshot.docs[0];
      const participantData = {
        ...participantDoc.data(),
        id: participantDoc.id
      } as Participant;
      setParticipant(participantData);

      // Fetch event information
      const eventDoc = await getDoc(doc(db, 'events', participantData.eventId));
      if (eventDoc.exists()) {
        const eventData = { ...eventDoc.data(), id: eventDoc.id } as Event;
        setEvent(eventData);

        // Fetch active round
        const roundsRef = collection(db, `events/${participantData.eventId}/rounds`);
        const roundsSnapshot = await getDocs(roundsRef);
        const rounds = roundsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Round[];
        const activeRoundData = rounds.find(r => r.isActive);
        setActiveRound(activeRoundData || null);
      }

      // Fetch match information if participant is matched
      if (participantData.isMatched && participantData.eventId) {
        await fetchMatchInfo(participantData);
      }

    } catch (error) {
      console.error('Error fetching participant data:', error);
      setError('Failed to load your profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatchInfo = async (participantData: Participant) => {
    try {
      const response = await fetch(
        `/api/events/${participantData.eventId}/my-target?participantId=${participantData.id}`
      );

      if (response.ok) {
        const data = await response.json();
        setMatchInfo(data);
      }
    } catch (error) {
      console.error('Error fetching match info:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/participant/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getHintLevelDescription = (level: string) => {
    const descriptions = {
      H1: 'Preferences (music, food, lifestyle)',
      H2: 'Interests & Background (studies, hobbies)',
      H3: 'Language & Communication',
      H4: 'Physical Appearance (clothing, accessories)',
      H5: 'Personal Items & Details',
      H6: 'Key Identifiers (initials, origin, expected location)'
    };
    return descriptions[level as keyof typeof descriptions] || level;
  };

  const renderHintContent = (hint: Hint) => {
    const payload = hint.payload;
    const items = [];

    // Extract readable information from hint payload
    if (payload.musicGenre) items.push(`Music: ${payload.musicGenre}`);
    if (payload.faveSong) items.push(`Favorite Song: ${payload.faveSong}`);
    if (payload.coffeeOrTea) items.push(`Drinks: ${payload.coffeeOrTea}`);
    if (payload.taste) items.push(`Taste: ${payload.taste}`);
    if (payload.chronotype) items.push(`Time: ${payload.chronotype} person`);

    if (payload.majorOrDomain) items.push(`Study/Work: ${payload.majorOrDomain}`);
    if (payload.sportsTeam) items.push(`Sports: ${payload.sportsTeam}`);
    if (payload.travelStyle) items.push(`Travel Style: ${payload.travelStyle}`);
    if (payload.hobbies?.length) items.push(`Hobbies: ${payload.hobbies.join(', ')}`);

    if (payload.languages?.length) items.push(`Languages: ${payload.languages.join(', ')}`);
    if (payload.languageNote) items.push(`Language Note: ${payload.languageNote}`);
    if (payload.favEmojis?.length) items.push(`Emojis: ${payload.favEmojis.join(' ')}`);
    if (payload.communicationStyle) items.push(`Style: ${payload.communicationStyle}`);

    if (payload.topColor) items.push(`Top: ${payload.topColor}`);
    if (payload.glasses) items.push('Glasses: Yes');
    if (payload.cap) items.push('Hat/Cap: Yes');
    if (payload.shoesColor) items.push(`Shoes: ${payload.shoesColor}`);
    if (payload.bagType) items.push(`Bag: ${payload.bagType}`);
    if (payload.height) items.push(`Height: ${payload.height}`);

    if (payload.phoneCase) items.push(`Phone Case: ${payload.phoneCase}`);
    if (payload.wristAccessory) items.push(`Wrist: ${payload.wristAccessory}`);
    if (payload.uniqueAccessory) items.push(`Accessory: ${payload.uniqueAccessory}`);

    if (payload.nameInitials) items.push(`Initials: ${payload.nameInitials}`);
    if (payload.originRegion) items.push(`From: ${payload.originRegion}`);
    if (payload.expectedSpot) items.push(`Expected Spot: ${payload.expectedSpot}`);
    if (payload.currentCity) items.push(`Current City: ${payload.currentCity}`);

    return items;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {participant?.displayName || 'Participant Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">
                  {event?.title || 'Loading event...'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Event Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Event Status</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {event?.status || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Matching Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <MagnifyingGlassIcon className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Matching</p>
                <p className="text-lg font-semibold text-gray-900">
                  {participant?.isMatched ? 'Matched' : 'Waiting'}
                </p>
              </div>
            </div>
          </div>

          {/* Round Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <EyeIcon className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Round</p>
                <p className="text-lg font-semibold text-gray-900">
                  {activeRound?.name || 'None'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Mission */}
        {participant?.isMatched && matchInfo ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              Your Mission
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 font-medium">
                Find this person at the event:
              </p>
              <p className="text-blue-700 text-sm mt-1">
                Use the hints below to identify your target. When you find them, let them know!
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                Target: {matchInfo.target?.displayName}
              </h3>
              <p className="text-sm text-gray-600">
                Status: <span className="capitalize">{matchInfo.assignment?.status}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Mission</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                {event?.matchingCreated
                  ? 'Waiting for matching to be assigned...'
                  : 'Waiting for event to start...'}
              </p>
            </div>
          </div>
        )}

        {/* Available Hints */}
        {matchInfo?.target && activeRound && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Available Hints (Round: {activeRound.name})
            </h2>

            {matchInfo.target.visibleHints.length === 0 ? (
              <div className="text-center py-8">
                <EyeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hints available in current round</p>
                <p className="text-sm text-gray-500 mt-1">
                  Wait for the admin to activate a round with visible hints
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {matchInfo.target.visibleHints.map((hint) => (
                  <div key={hint.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                      <h3 className="font-medium text-gray-900 text-lg">{hint.level}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded self-start sm:self-auto">
                        {getHintLevelDescription(hint.level)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {renderHintContent(hint).map((item, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2 mt-1 text-xs">●</span>
                          <p className="text-sm text-gray-700 flex-1">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
