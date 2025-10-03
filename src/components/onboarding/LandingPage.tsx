'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCodeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef } from 'react';
import { trackUserEvents, trackPageView } from '@/lib/firebase/analytics';

export function LandingPage() {
  const [eventCode, setEventCode] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Track page view
    trackPageView('landing_page');
  }, []);

  useEffect(() => {
    if (showQRScanner) {
      // Initialize QR code scanner
      qrScannerRef.current = new Html5QrcodeScanner(
        'qr-scanner',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        /* verbose= */ false
      );

      qrScannerRef.current.render(
        (decodedText) => {
          handleQRResult(decodedText);
        },
        (error) => {
          console.warn('QR scan error:', error);
        }
      );
    }

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear();
      }
    };
  }, [showQRScanner]);

  const handleQRResult = (code: string) => {
    // Extract event code from QR content
    let extractedCode = code;

    // If it's a URL, extract the code parameter
    if (code.includes('http')) {
      try {
        const url = new URL(code);
        extractedCode = url.searchParams.get('code') || code;
      } catch {
        // If URL parsing fails, use the whole string
      }
    }

    setEventCode(extractedCode);
    setShowQRScanner(false);

    if (qrScannerRef.current) {
      qrScannerRef.current.clear();
    }
  };

  const handleJoinEvent = async () => {
    if (!eventCode.trim()) {
      setError('Please enter an event code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Track event code entry
      trackUserEvents.eventCodeEntered(eventCode.trim());

      // Validate event code exists
      const response = await fetch(`/api/events/validate?code=${eventCode.trim()}`);

      if (!response.ok) {
        throw new Error('Event not found');
      }

      const { eventId } = await response.json();

      // Redirect to participant login page with event information
      router.push(`/participant/login?eventId=${eventId}&code=${eventCode.trim()}`);
    } catch (err) {
      setError('Invalid event code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinEvent();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">K</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome to Kople Game
            </h1>
            <p className="text-blue-100 text-sm">
              Connect with international students through interactive hints
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showQRScanner ? (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Join an Event
                  </h2>
                  <p className="text-sm text-gray-600">
                    Enter the event code provided by your organizer or scan the QR code
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="eventCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Event Code
                    </label>
                    <input
                      id="eventCode"
                      type="text"
                      value={eventCode}
                      onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter event code"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest uppercase"
                      disabled={isLoading}
                    />
                    {error && (
                      <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowQRScanner(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={isLoading}
                    >
                      <QrCodeIcon className="w-5 h-5" />
                      Scan QR
                    </button>

                    <button
                      onClick={handleJoinEvent}
                      disabled={isLoading || !eventCode.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          Join Event
                          <ArrowRightIcon className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    How it works:
                  </h3>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Join an event with the provided code</li>
                    <li>2. Share 6 levels of hints about yourself</li>
                    <li>3. Discover others through progressive clues</li>
                    <li>4. Connect and network in person!</li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Scan QR Code
                  </h2>
                  <p className="text-sm text-gray-600">
                    Point your camera at the QR code to join the event
                  </p>
                </div>

                <div className="mb-4">
                  <div id="qr-scanner" className="w-full"></div>
                </div>

                <button
                  onClick={() => {
                    setShowQRScanner(false);
                    if (qrScannerRef.current) {
                      qrScannerRef.current.clear();
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Login Links */}
        <div className="text-center mt-6 space-y-2">
          <div>
            <button
              onClick={() => router.push('/participant/login')}
              className="text-sm text-blue-600 hover:text-blue-500 underline font-medium"
            >
              Already have a participant ID? Sign in here
            </button>
          </div>
          <div>
            <button
              onClick={() => router.push('/admin/login')}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Event Organizer? Admin login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}