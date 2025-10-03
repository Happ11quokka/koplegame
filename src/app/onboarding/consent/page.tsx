'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheckIcon, EyeSlashIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function ConsentPage() {
  const [eventTitle, setEventTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventId = searchParams.get('eventId');
  const eventCode = searchParams.get('code');

  useEffect(() => {
    if (!eventId || !eventCode) {
      router.push('/');
      return;
    }

    // Fetch event details
    fetchEventDetails();
  }, [eventId, eventCode]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const event = await response.json();
        setEventTitle(event.title);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!agreementChecked || !privacyChecked) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Here we would typically create a user session or store consent
      // For now, just redirect to profile setup
      router.push(`/onboarding/profile?eventId=${eventId}&code=${eventCode}`);
    } catch (error) {
      console.error('Error saving consent:', error);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-xl font-semibold text-white">
              Privacy & Guidelines
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              {eventTitle}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* PII Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-800 text-sm">
                    Important: No Personal Information
                  </h3>
                  <p className="text-amber-700 text-sm mt-1">
                    For your safety and privacy, <strong>do not share</strong>:
                  </p>
                  <ul className="text-amber-700 text-sm mt-2 ml-4 space-y-1 list-disc">
                    <li>Your full name or real name</li>
                    <li>Phone numbers or email addresses</li>
                    <li>Social media handles (@username)</li>
                    <li>Home addresses or specific locations</li>
                    <li>Student/Employee ID numbers</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How it Works */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5" />
                How Kople Game Works
              </h2>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    1
                  </div>
                  <p className="text-gray-700 text-sm">
                    You'll create <strong>6 levels of hints</strong> about yourself - from general interests to specific details
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    2
                  </div>
                  <p className="text-gray-700 text-sm">
                    Event organizers will reveal hint levels gradually during rounds
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    3
                  </div>
                  <p className="text-gray-700 text-sm">
                    Use the hints to find and connect with other participants in person
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <EyeSlashIcon className="w-5 h-5" />
                Your Privacy
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm text-gray-600">
                <p>
                  • Your hints will only be visible to other event participants
                </p>
                <p>
                  • Hints are automatically checked for personal information
                </p>
                <p>
                  • You can use initials, nicknames, or creative descriptions
                </p>
                <p>
                  • Data is deleted 30 days after the event ends
                </p>
                <p>
                  • You can leave the event at any time
                </p>
              </div>
            </div>

            {/* Agreement Checkboxes */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I understand the guidelines and agree not to share personal identifying information
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I consent to sharing my hints with other event participants
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>

              <button
                onClick={handleContinue}
                disabled={!agreementChecked || !privacyChecked || isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}