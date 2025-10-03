'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Language } from '@/types';
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  LanguageIcon,
  DocumentTextIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';

export default function CreateEventPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    h6CommonQuestion: '',
    langs: ['en'] as Language[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const availableLanguages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  // Redirect if not admin
  if (!user || !isAdmin) {
    router.push('/admin/login');
    return null;
  }

  const generateEventCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleLanguageToggle = (lang: Language) => {
    if (formData.langs.includes(lang)) {
      if (formData.langs.length > 1) {
        setFormData(prev => ({
          ...prev,
          langs: prev.langs.filter(l => l !== lang)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        langs: [...prev.langs, lang]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Event title is required');
      return;
    }

    if (!formData.h6CommonQuestion.trim()) {
      setError('H6 common question is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const eventCode = generateEventCode();

      const eventData = {
        code: eventCode,
        title: formData.title.trim(),
        description: formData.description.trim() || '',
        location: formData.location.trim() || '',
        status: 'live' as const,
        langs: formData.langs,
        h6CommonQuestion: formData.h6CommonQuestion.trim(),
        matchingCreated: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
      };

      const eventsRef = collection(db, 'events');
      const docRef = await addDoc(eventsRef, eventData);

      // Redirect to event management page
      router.push(`/admin/events/${docRef.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  Create New Event
                </h1>
                <p className="text-sm text-gray-600">
                  Set up a new Kople Game networking event
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., International Student Networking Night"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the event..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Seoul Campus Student Center"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LanguageIcon className="w-5 h-5" />
              Supported Languages
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Select the languages that participants can use in the app
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableLanguages.map((lang) => (
                <label
                  key={lang.code}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    formData.langs.includes(lang.code)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.langs.includes(lang.code)}
                    onChange={() => handleLanguageToggle(lang.code)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {lang.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* H6 Common Question */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5" />
              H6 Common Question
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              This question will be asked to all participants in their H6 (final) hints.
              It should be specific to your event location or theme.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Common Question *
              </label>
              <input
                type="text"
                value={formData.h6CommonQuestion}
                onChange={(e) => setFormData(prev => ({ ...prev, h6CommonQuestion: e.target.value }))}
                placeholder="e.g., What location in Seoul are you most excited to visit today?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Examples: "What's your favorite spot on campus?", "Which restaurant are you hoping to try tonight?"
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <QrCodeIcon className="w-4 h-4" />
                  Create Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}