'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Event, Round, Participant, HintLevel, EventWithMatching, Match, MatchAssignment, ParticipantAccount } from '@/types';
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  UserGroupIcon,
  ChartBarIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface EventPageProps {
  params: { eventId: string };
}

export default function EventManagePage({ params }: EventPageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [assignments, setAssignments] = useState<MatchAssignment[]>([]);
  const [participantAccounts, setParticipantAccounts] = useState<ParticipantAccount[]>([]);
  const [isCreatingMatches, setIsCreatingMatches] = useState(false);
  const [isCreatingAccounts, setIsCreatingAccounts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewRoundForm, setShowNewRoundForm] = useState(false);
  const [showAccountsSection, setShowAccountsSection] = useState(false);
  const [showDetailedMatching, setShowDetailedMatching] = useState(false);
  const [accountsToCreate, setAccountsToCreate] = useState(10);
  const [newRoundData, setNewRoundData] = useState({
    name: '',
    visibleLevels: [] as HintLevel[]
  });

  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const allHintLevels: HintLevel[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/admin/login');
      return;
    }
    fetchEventData();
  }, [user, isAdmin, params.eventId]);

  const fetchEventData = async () => {
    try {
      // Fetch event
      const eventDoc = await getDoc(doc(db, 'events', params.eventId));
      if (!eventDoc.exists()) {
        setError('Event not found');
        return;
      }

      const eventData = { ...eventDoc.data(), id: eventDoc.id } as Event;
      setEvent(eventData);

      // Fetch rounds
      const roundsRef = collection(db, `events/${params.eventId}/rounds`);
      const roundsQuery = query(roundsRef, orderBy('order', 'asc'));
      const roundsSnapshot = await getDocs(roundsQuery);
      const roundsData = roundsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Round[];
      setRounds(roundsData);

      // Fetch participants
      const participantsRef = collection(db, `events/${params.eventId}/participants`);
      const participantsSnapshot = await getDocs(participantsRef);
      const participantsData = participantsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Participant[];
      setParticipants(participantsData);

      // Fetch participant accounts
      await fetchParticipantAccounts();

      // Fetch matches and assignments if matching is created
      if (eventData.matchingCreated) {
        await fetchMatchingData();
      }

    } catch (error) {
      console.error('Error fetching event data:', error);
      setError('Failed to load event data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParticipantAccounts = async () => {
    try {
      const response = await fetch(`/api/events/${params.eventId}/participant-accounts`);
      if (response.ok) {
        const data = await response.json();
        setParticipantAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching participant accounts:', error);
    }
  };

  const createParticipantAccounts = async () => {
    if (isCreatingAccounts || accountsToCreate < 1) return;

    try {
      setIsCreatingAccounts(true);
      setError('');

      const response = await fetch(`/api/events/${params.eventId}/participant-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: accountsToCreate }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchParticipantAccounts(); // Refresh the list
        setAccountsToCreate(10); // Reset to default

        if (data.errors && data.errors.length > 0) {
          setError(`Created ${data.created} accounts. Some errors: ${data.errors.join(', ')}`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create participant accounts');
      }
    } catch (error: any) {
      console.error('Error creating participant accounts:', error);
      setError('Failed to create participant accounts');
    } finally {
      setIsCreatingAccounts(false);
    }
  };

  const fetchMatchingData = async () => {
    try {
      const response = await fetch(`/api/events/${params.eventId}/create-matches`);
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching matching data:', error);
    }
  };

  const createMatches = async () => {
    if (!event || isCreatingMatches) return;

    try {
      setIsCreatingMatches(true);
      setError('');

      const response = await fetch(`/api/events/${params.eventId}/create-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create matches');
      }

      const data = await response.json();
      setMatches(data.matches);
      setAssignments(data.assignments);

      // Refresh event data to get updated status
      await fetchEventData();

    } catch (error: any) {
      console.error('Error creating matches:', error);
      setError(error.message || 'Failed to create matches');
    } finally {
      setIsCreatingMatches(false);
    }
  };

  const updateEventStatus = async (newStatus: 'live' | 'ended') => {
    if (!event) return;

    try {
      await updateDoc(doc(db, 'events', event.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      setEvent(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating event status:', error);
      setError('Failed to update event status');
    }
  };

  const toggleRound = async (roundId: string, isActive: boolean) => {
    // Check if matching is created before allowing round activation
    if (!isActive && !event?.matchingCreated) {
      setError('You must create matches before starting any rounds');
      return;
    }

    try {
      // First, deactivate all other rounds
      const updatePromises = rounds.map(round =>
        updateDoc(doc(db, `events/${params.eventId}/rounds`, round.id), {
          isActive: round.id === roundId ? !isActive : false,
          updatedAt: serverTimestamp()
        })
      );

      await Promise.all(updatePromises);
      await fetchEventData(); // Refresh data
    } catch (error) {
      console.error('Error toggling round:', error);
      setError('Failed to update round');
    }
  };

  const createRound = async () => {
    if (!newRoundData.name.trim() || newRoundData.visibleLevels.length === 0) {
      setError('Round name and at least one visible level are required');
      return;
    }

    try {
      const roundData = {
        name: newRoundData.name.trim(),
        visibleLevels: newRoundData.visibleLevels,
        isActive: false,
        order: rounds.length + 1,
        eventId: params.eventId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, `events/${params.eventId}/rounds`), roundData);

      setNewRoundData({ name: '', visibleLevels: [] });
      setShowNewRoundForm(false);
      await fetchEventData();
    } catch (error) {
      console.error('Error creating round:', error);
      setError('Failed to create round');
    }
  };

  const copyEventCode = () => {
    if (event) {
      navigator.clipboard.writeText(event.code);
      // You could add a toast notification here
    }
  };

  const copyEventURL = () => {
    if (event) {
      const url = `${window.location.origin}/?code=${event.code}`;
      navigator.clipboard.writeText(url);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const activeRound = rounds.find(r => r.isActive);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {event?.title}
                </h1>
                <div className="flex items-center gap-4 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event?.status || '')}`}>
                    {event?.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    Code: {event?.code}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!event?.matchingCreated && event?.status !== 'ended' && (
                <button
                  onClick={createMatches}
                  disabled={isCreatingMatches || participants.length < 2}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <LinkIcon className="w-4 h-4" />
                  {isCreatingMatches ? 'Creating...' : 'Create Matches'}
                </button>
              )}

              {event?.status === 'live' && (
                <button
                  onClick={() => updateEventStatus('ended')}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <StopIcon className="w-4 h-4" />
                  End Event
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Participants</p>
                <p className="text-2xl font-bold text-gray-900">{participants.length}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Matches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {event?.matchingCreated ? matches.length : '-'}
                </p>
                <p className="text-xs text-gray-500">
                  {event?.matchingCreated ? 'Created' : 'Not created'}
                </p>
              </div>
              <LinkIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Round</p>
                <p className="text-lg font-semibold text-gray-900">
                  {activeRound ? activeRound.name : 'None'}
                </p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Event Code</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-gray-900 font-mono">{event?.code}</p>
                  <button
                    onClick={copyEventCode}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <QrCodeIcon className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Event Access */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Access</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={event?.code || ''}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono"
                />
                <button
                  onClick={copyEventCode}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Participant URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?code=${event?.code}`}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={copyEventURL}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Matching Information */}
        {event?.matchingCreated && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Matching Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matches Overview */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Matches Overview</h3>
                <div className="space-y-3">
                  {matches.map((match, index) => (
                    <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">
                          Match {index + 1}
                        </span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          match.type === 'pair'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {match.type === 'pair' ? '2 people' : '3 people'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {match.participants.length} participants
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignment Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Assignment Status</h3>
                <div className="space-y-2">
                  {['pending', 'found', 'completed'].map((status) => {
                    const count = assignments.filter(a => a.status === status).length;
                    const percentage = assignments.length > 0 ? (count / assignments.length) * 100 : 0;

                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{status}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                status === 'pending' ? 'bg-yellow-500' :
                                status === 'found' ? 'bg-blue-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Matching Summary */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Matching Complete
                  </span>
                </div>
                <button
                  onClick={() => setShowDetailedMatching(!showDetailedMatching)}
                  className="text-sm text-green-700 hover:text-green-900 underline"
                >
                  {showDetailedMatching ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              <p className="text-green-700 text-sm mt-1">
                {matches.length} matches created for {participants.length} participants.
                You can now start rounds to reveal hints.
              </p>
            </div>

            {/* Detailed Matching Information */}
            {showDetailedMatching && (
              <div className="mt-6 space-y-4">
                {matches.map((match, matchIndex) => {
                  const matchParticipants = participants.filter(p => match.participants.includes(p.id));
                  const matchAssignments = assignments.filter(a => a.matchId === match.id);

                  return (
                    <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">
                          Match {matchIndex + 1} ({match.type})
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          match.type === 'pair'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {match.participants.length} participants
                        </span>
                      </div>

                      {/* Participants in this match */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Participants:</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {matchParticipants.map((participant) => (
                            <div key={participant.id} className="bg-gray-50 rounded p-2">
                              <p className="text-sm font-medium text-gray-900">
                                {participant.displayName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {participant.profileEmoji && `${participant.profileEmoji} `}
                                {participant.lang}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Assignment details */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Who is looking for whom:
                        </h5>
                        <div className="space-y-2">
                          {matchAssignments.map((assignment) => {
                            const finder = participants.find(p => p.id === assignment.participantId);
                            const target = participants.find(p => p.id === assignment.targetId);

                            if (!finder || !target) return null;

                            return (
                              <div key={assignment.id} className="bg-white border border-gray-200 rounded p-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-900">
                                      {finder.displayName}
                                    </span>
                                    <span className="text-gray-500 mx-2">→</span>
                                    <span className="font-medium text-gray-900">
                                      {target.displayName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      assignment.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : assignment.status === 'found'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {assignment.status}
                                    </span>
                                    {assignment.foundAt && (
                                      <span className="text-xs text-gray-500 hidden sm:inline">
                                        {new Date(assignment.foundAt.seconds * 1000).toLocaleTimeString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {assignment.foundAt && (
                                  <div className="mt-1 sm:hidden">
                                    <span className="text-xs text-gray-500">
                                      Found: {new Date(assignment.foundAt.seconds * 1000).toLocaleTimeString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Match Statistics */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-gray-500">Pending</p>
                            <p className="text-sm font-medium text-yellow-600">
                              {matchAssignments.filter(a => a.status === 'pending').length}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Found</p>
                            <p className="text-sm font-medium text-blue-600">
                              {matchAssignments.filter(a => a.status === 'found').length}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Completed</p>
                            <p className="text-sm font-medium text-green-600">
                              {matchAssignments.filter(a => a.status === 'completed').length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Overall Statistics */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Overall Progress</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{participants.length}</p>
                      <p className="text-xs text-gray-500">Total Participants</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {assignments.filter(a => a.status === 'pending').length}
                      </p>
                      <p className="text-xs text-gray-500">Still Looking</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {assignments.filter(a => a.status === 'found').length}
                      </p>
                      <p className="text-xs text-gray-500">Found Target</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {assignments.filter(a => a.status === 'completed').length}
                      </p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>
                        {Math.round((assignments.filter(a => a.status !== 'pending').length / assignments.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(assignments.filter(a => a.status !== 'pending').length / assignments.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Participant Accounts Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Participant Accounts</h2>
            <button
              onClick={() => setShowAccountsSection(!showAccountsSection)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <UserGroupIcon className="w-4 h-4" />
              {showAccountsSection ? 'Hide' : 'Manage'} Accounts
            </button>
          </div>

          {/* Account Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Accounts</p>
                  <p className="text-2xl font-bold text-blue-900">{participantAccounts.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Available</p>
                  <p className="text-2xl font-bold text-green-900">
                    {participantAccounts.filter(acc => !acc.isUsed).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">In Use</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {participantAccounts.filter(acc => acc.isUsed).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {showAccountsSection && (
            <>
              {/* Create New Accounts */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Create Participant Accounts</h3>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of accounts to create
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={accountsToCreate}
                      onChange={(e) => setAccountsToCreate(parseInt(e.target.value) || 1)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={createParticipantAccounts}
                      disabled={isCreatingAccounts}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <PlusIcon className="w-4 h-4" />
                      {isCreatingAccounts ? 'Creating...' : 'Create Accounts'}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  This will create accounts like kople1@kople.com, kople2@kople.com, etc.
                  All accounts use the password "kolple".
                </p>
              </div>

              {/* Accounts List */}
              {participantAccounts.length > 0 && (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Participant ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participantAccounts.map((account) => (
                          <tr key={account.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {account.participantId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {account.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                account.isUsed
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {account.isUsed ? 'In Use' : 'Available'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {account.createdAt && new Date(account.createdAt.seconds * 1000).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {participantAccounts.map((account) => (
                      <div key={account.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{account.participantId}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            account.isUsed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {account.isUsed ? 'In Use' : 'Available'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{account.email}</p>
                        <p className="text-xs text-gray-500">
                          Created: {account.createdAt && new Date(account.createdAt.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Rounds Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Rounds Management</h2>
            <button
              onClick={() => setShowNewRoundForm(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              Add Round
            </button>
          </div>

          {/* New Round Form */}
          {showNewRoundForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Create New Round</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Round Name
                  </label>
                  <input
                    type="text"
                    value={newRoundData.name}
                    onChange={(e) => setNewRoundData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Round 1: Ice Breaker"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visible Hint Levels
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allHintLevels.map(level => (
                      <label key={level} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newRoundData.visibleLevels.includes(level)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRoundData(prev => ({
                                ...prev,
                                visibleLevels: [...prev.visibleLevels, level]
                              }));
                            } else {
                              setNewRoundData(prev => ({
                                ...prev,
                                visibleLevels: prev.visibleLevels.filter(l => l !== level)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={createRound}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Round
                  </button>
                  <button
                    onClick={() => {
                      setShowNewRoundForm(false);
                      setNewRoundData({ name: '', visibleLevels: [] });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rounds List */}
          <div className="space-y-4">
            {rounds.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No rounds created yet. Add a round to get started.
              </p>
            ) : (
              rounds.map((round) => (
                <div
                  key={round.id}
                  className={`p-4 border-2 rounded-lg ${
                    round.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{round.name}</h3>
                      <p className="text-sm text-gray-600">
                        Visible levels: {round.visibleLevels.join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {round.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleRound(round.id, false)}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          <PlayIcon className="w-3 h-3" />
                          Activate
                        </button>
                      )}

                      {round.isActive && (
                        <button
                          onClick={() => toggleRound(round.id, true)}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                        >
                          <PauseIcon className="w-3 h-3" />
                          Pause
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}