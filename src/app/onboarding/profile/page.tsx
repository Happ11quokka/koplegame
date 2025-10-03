'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { signInAnonymously_Client } from '@/lib/firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Language } from '@/types';

const AVAILABLE_LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

const EMOJI_OPTIONS = ['😊', '🎉', '🌟', '🎯', '🚀', '💫', '🎪', '🎨', '🎵', '⚡', '🌈', '🎭'];

function ProfileSetupContent() {
  const [displayName, setDisplayName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventId = searchParams.get('eventId');
  const eventCode = searchParams.get('code');

  useEffect(() => {
    if (!eventId || !eventCode) {
      router.push('/');
    }
  }, [eventId, eventCode]);

  const validateDisplayName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Display name is required';
    }

    if (name.trim().length < 2) {
      return 'Display name must be at least 2 characters';
    }

    if (name.trim().length > 20) {
      return 'Display name must be less than 20 characters';
    }

    // Check for potential PII
    const piiPatterns = [
      /@\w+/,  // Social handles
      /\b\w+@\w+\.\w+/,  // Emails
      /\+?\d[\d\s\-\(\)]{7,}/,  // Phone numbers
    ];

    for (const pattern of piiPatterns) {
      if (pattern.test(name)) {
        return 'Please use a nickname or initials, not personal information';
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const nameError = validateDisplayName(displayName);
    if (nameError) {
      setError(nameError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Sign in anonymously
      const { user } = await signInAnonymously_Client();

      // Create participant document
      const participantData = {
        displayName: displayName.trim(),
        lang: selectedLanguage,
        profileEmoji: selectedEmoji,
        consent: true,
        submittedLevels: [],
        eventId: eventId!,
        createdBy: user.uid,
        isMatched: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const participantDocRef = doc(db, `events/${eventId}/participants`, user.uid);
      await setDoc(participantDocRef, participantData);

      // Redirect to hint creation
      router.push(`/event/${eventCode}/hints`);
    } catch (error) {
      console.error('Error creating profile:', error);
      setError('Failed to create profile. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-xl font-semibold text-white">
              Create Your Profile
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Choose how others will see you
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="inline w-4 h-4 mr-1" />
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your nickname or initials"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use a nickname, initials, or creative name - not your real name
              </p>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LanguageIcon className="inline w-4 h-4 mr-1" />
                Primary Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      selectedLanguage === lang.code
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg">{lang.flag}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {lang.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Emoji (Optional)
              </label>
              <div className="grid grid-cols-6 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`p-2 rounded-lg border-2 transition-colors text-center text-xl ${
                      selectedEmoji === emoji
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg border border-gray-200">
                  {selectedEmoji}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {displayName || 'Your display name'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {AVAILABLE_LANGUAGES.find(l => l.code === selectedLanguage)?.flag} {' '}
                    {AVAILABLE_LANGUAGES.find(l => l.code === selectedLanguage)?.name}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => router.push(`/onboarding/consent?eventId=${eventId}&code=${eventCode}`)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Back
              </button>

              <button
                onClick={handleSubmit}
                disabled={isLoading || !displayName.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Continue to Hints'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ProfileSetupContent />
    </Suspense>
  );
}