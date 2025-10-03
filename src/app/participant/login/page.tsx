'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmail } from '@/lib/firebase/auth';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useEffect } from 'react';
import {
  UserIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function ParticipantLoginPage() {
  const [participantId, setParticipantId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [eventId, setEventId] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    // Get event info from URL parameters
    const urlEventCode = searchParams.get('code');
    const urlEventId = searchParams.get('eventId');

    if (urlEventCode) setEventCode(urlEventCode);
    if (urlEventId) setEventId(urlEventId);
  }, [searchParams]);

  useEffect(() => {
    // Redirect if already logged in
    if (!loading && user) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/participant/dashboard');
      }
    }
  }, [user, isAdmin, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!participantId || !password) {
      setError('Please enter both participant ID and password');
      return;
    }

    // Check password
    if (password !== 'kolple') {
      setError('Invalid password. Use "kolple"');
      return;
    }

    // Check participant ID format
    if (!participantId.startsWith('kople') || !/^kople\d+$/.test(participantId)) {
      setError('Invalid participant ID format. Use kople1, kople2, etc.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const email = `${participantId}@kople.com`;
      await signInWithEmail(email, 'kolple');
      // Redirect will be handled by useEffect
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.code === 'auth/user-not-found') {
        setError('Participant ID not found. Contact admin to create your account.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Invalid password. Use "kolple"');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid participant ID format');
      } else {
        setError('Login failed. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Participant Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {eventCode ? `Join Event: ${eventCode}` : 'Sign in to access your Kople Game profile'}
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Participant ID Field */}
            <div>
              <label htmlFor="participantId" className="block text-sm font-medium text-gray-700">
                Participant ID
              </label>
              <input
                id="participantId"
                name="participantId"
                type="text"
                autoComplete="username"
                required
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value.toLowerCase())}
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="kople1"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="kolple"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  Sign In
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </div>
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => router.push('/admin/login')}
              className="text-sm text-gray-600 hover:text-gray-500 underline"
            >
              Admin? Login here
            </button>
            <br />
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-gray-500 underline"
            >
              ← Back to main site
            </button>
          </div>
        </form>

        {/* Event & Login Instructions */}
        <div className="mt-8 space-y-4">
          {eventCode && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                Event Code: {eventCode}
              </h3>
              <p className="text-xs text-green-700">
                You're joining this event. Please login with your assigned participant ID.
              </p>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              How to Login
            </h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use your assigned participant ID (e.g., kople1, kople2)</li>
              <li>• Password is always <code className="bg-blue-100 px-1 rounded font-mono">kolple</code></li>
              <li>• Contact event admin if you don't have an ID</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}