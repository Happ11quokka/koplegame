import { logEvent } from 'firebase/analytics';
import { analytics } from './config';

// Custom event types for Kople Game
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (analytics && typeof window !== 'undefined') {
    try {
      logEvent(analytics, eventName, parameters);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }
};

// Specific tracking functions for Kople Game events
export const trackUserEvents = {
  // Onboarding events
  eventCodeEntered: (code: string) =>
    trackEvent('event_code_entered', { event_code: code }),

  consentGiven: (eventId: string) =>
    trackEvent('consent_given', { event_id: eventId }),

  profileCreated: (language: string, eventId: string) =>
    trackEvent('profile_created', { language, event_id: eventId }),

  // Hint creation events
  hintStarted: (level: string, eventId: string) =>
    trackEvent('hint_started', { hint_level: level, event_id: eventId }),

  hintSaved: (level: string, eventId: string, hasPII: boolean) =>
    trackEvent('hint_saved', {
      hint_level: level,
      event_id: eventId,
      has_pii_violations: hasPII
    }),

  hintSubmitted: (level: string, eventId: string) =>
    trackEvent('hint_submitted', { hint_level: level, event_id: eventId }),

  allHintsCompleted: (eventId: string, timeSpent: number) =>
    trackEvent('all_hints_completed', {
      event_id: eventId,
      time_spent_minutes: Math.round(timeSpent / 60000)
    }),

  // Feed interaction events
  feedViewed: (eventId: string, roundName?: string) =>
    trackEvent('feed_viewed', { event_id: eventId, round_name: roundName }),

  participantCardViewed: (eventId: string, participantId: string) =>
    trackEvent('participant_card_viewed', {
      event_id: eventId,
      participant_id: participantId
    }),

  filterApplied: (eventId: string, filterType: string, filterValue: string) =>
    trackEvent('filter_applied', {
      event_id: eventId,
      filter_type: filterType,
      filter_value: filterValue
    }),

  searchPerformed: (eventId: string, searchQuery: string) =>
    trackEvent('search_performed', {
      event_id: eventId,
      search_query_length: searchQuery.length
    }),

  // PII violation events
  piiViolationDetected: (field: string, violationType: string) =>
    trackEvent('pii_violation_detected', {
      field_name: field,
      violation_type: violationType
    }),

  // PWA events
  pwaInstalled: () =>
    trackEvent('pwa_installed'),

  pwaInstallPrompted: () =>
    trackEvent('pwa_install_prompted'),

  // Error events
  errorOccurred: (errorType: string, errorMessage: string) =>
    trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage
    }),
};

// Page view tracking
export const trackPageView = (pageName: string, eventId?: string) => {
  trackEvent('page_view', {
    page_name: pageName,
    event_id: eventId
  });
};

// Session tracking
export const trackSession = {
  start: (eventId?: string) =>
    trackEvent('session_start', { event_id: eventId }),

  end: (eventId?: string, duration: number) =>
    trackEvent('session_end', {
      event_id: eventId,
      session_duration_minutes: Math.round(duration / 60000)
    }),
};