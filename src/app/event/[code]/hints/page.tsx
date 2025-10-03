'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { HintLevel } from '@/types';
import { HintInputForm } from '@/components/hints/HintInputForm';
import { HintNavigation } from '@/components/hints/HintNavigation';
import { ProgressBar } from '@/components/hints/ProgressBar';

interface HintsPageProps {
  params: { code: string };
}

export default function HintsPage({ params }: HintsPageProps) {
  const [currentLevel, setCurrentLevel] = useState<HintLevel>('H1');
  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const hintLevels: HintLevel[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

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
      const response = await fetch(`/api/events/validate?code=${params.code}`);
      if (!response.ok) {
        throw new Error('Event not found');
      }

      const data = await response.json();
      setEventData(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Event not found or no longer active');
      setTimeout(() => router.push('/'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevelChange = (level: HintLevel) => {
    setCurrentLevel(level);
  };

  const handleComplete = () => {
    // Redirect to event feed
    router.push(`/event/${params.code}`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Create Your Hints
              </h1>
              <p className="text-sm text-gray-600">
                {eventData?.title}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {currentLevel}
              </p>
              <p className="text-xs text-gray-500">
                {hintLevels.indexOf(currentLevel) + 1} of {hintLevels.length}
              </p>
            </div>
          </div>

          <ProgressBar
            currentLevel={currentLevel}
            totalLevels={hintLevels.length}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <HintNavigation
              currentLevel={currentLevel}
              onLevelChange={handleLevelChange}
              eventId={eventData?.eventId}
              userId={user?.uid}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <HintInputForm
              level={currentLevel}
              eventId={eventData?.eventId}
              eventCode={params.code}
              userId={user?.uid}
              h6CommonQuestion={eventData?.h6CommonQuestion}
              onComplete={handleComplete}
              onLevelChange={handleLevelChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}