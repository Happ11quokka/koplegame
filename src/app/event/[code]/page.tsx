'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ParticipantFeed } from '@/components/feed/ParticipantFeed';
import { EventHeader } from '@/components/feed/EventHeader';
import { FilterPanel } from '@/components/feed/FilterPanel';
import { Event, Round, FilterState, HintLevel } from '@/types';

interface EventPageProps {
  params: { code: string };
}

export default function EventPage({ params }: EventPageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    levels: [],
    languages: [],
    interests: [],
    appearance: [],
    searchQuery: '',
  });

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      fetchEventData();
    }
  }, [user, authLoading, params.code]);

  const fetchEventData = async () => {
    try {
      // Validate event code and get event details
      const eventResponse = await fetch(`/api/events/validate?code=${params.code}`);
      if (!eventResponse.ok) {
        throw new Error('Event not found');
      }

      const eventData = await eventResponse.json();

      // Get full event details
      const fullEventResponse = await fetch(`/api/events/${eventData.eventId}`);
      if (!fullEventResponse.ok) {
        throw new Error('Failed to load event details');
      }

      const fullEvent = await fullEventResponse.json();
      setEvent({ ...fullEvent, id: eventData.eventId });

      // Get active round
      const roundsResponse = await fetch(`/api/events/${eventData.eventId}/rounds`);
      if (roundsResponse.ok) {
        const rounds = await roundsResponse.json();
        const active = rounds.find((r: Round) => r.isActive);
        setActiveRound(active || null);
      }

      // Get current participant ID
      if (user) {
        const participantsResponse = await fetch(`/api/events/${eventData.eventId}/participants`);
        if (participantsResponse.ok) {
          const participants = await participantsResponse.json();
          const currentParticipant = participants.find((p: any) => p.createdBy === user.uid);
          if (currentParticipant) {
            setParticipantId(currentParticipant.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Event not found or no longer active');
      setTimeout(() => router.push('/'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Event not found'}</p>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <EventHeader
        event={event}
        activeRound={activeRound}
        onShowFilters={() => setShowFilters(true)}
        onEditHints={() => router.push(`/event/${params.code}/hints`)}
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filter Panel */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                show={showFilters}
                onClose={() => setShowFilters(false)}
                activeRound={activeRound}
              />
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3">
            <ParticipantFeed
              eventId={event.id}
              activeRound={activeRound}
              filters={filters}
              currentUserId={user?.uid}
              participantId={participantId || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}