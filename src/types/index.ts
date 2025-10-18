import { Timestamp } from 'firebase/firestore';

// Core Types
export type HintLevel = 'H1' | 'H2' | 'H3' | 'H4' | 'H5';
export type Language = 'en' | 'ko' | 'ja' | 'zh' | 'es' | 'fr';
export type EventStatus = 'draft' | 'waiting_for_matching' | 'live' | 'ended';
export type MatchStatus = 'pending' | 'found' | 'completed';
export type HintStatus = 'ok' | 'flagged' | 'hidden';
export type UserRole = 'participant' | 'admin';

// Event Management
export interface Event {
  id: string;
  code: string;
  title: string;
  status: EventStatus;
  langs: Language[];
  description?: string;
  location?: string;
  startTime?: Timestamp;
  endTime?: Timestamp;
  matchingCreated: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface Round {
  id: string;
  name: string;
  visibleLevels: HintLevel[];
  isActive: boolean;
  order: number;
  eventId: string;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User & Participant Management
export interface User {
  uid: string;
  lastEventId?: string;
  roleClaims: {
    admin?: boolean;
    events?: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Participant {
  id: string;
  displayName: string;
  lang: Language;
  consent: boolean;
  submittedLevels: HintLevel[];
  profileEmoji?: string;
  eventId: string;
  createdBy: string;
  matchId?: string;
  isMatched: boolean;
  participantAccountId?: string; // Links to ParticipantAccount
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Pre-created participant accounts for events
export interface ParticipantAccount {
  id: string;
  participantId: string; // e.g., "kople1", "kople2"
  email: string; // e.g., "kople1@kople.com"
  password: string; // Always "kolple"
  eventId: string;
  isUsed: boolean;
  usedBy?: string; // uid of the user who used this account
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Hint System
export interface HintPayload {
  // H1: Preferences (most abstract)
  musicGenre?: string;
  faveSong?: string;
  coffeeOrTea?: 'coffee' | 'tea' | 'both' | 'neither';
  taste?: 'sweet' | 'salty' | 'both' | 'neither';
  chronotype?: 'morning' | 'evening' | 'flexible';

  // H2: Interests & Background
  majorOrDomain?: string;
  sportsTeam?: string;
  travelStyle?: 'photo' | 'food' | 'hiking' | 'history' | 'adventure' | 'relaxation';
  hobbies?: string[];

  // H3: Language & Communication
  languages?: Language[];
  languageNote?: string;
  favEmojis?: string[];
  communicationStyle?: 'formal' | 'casual' | 'mixed';

  // H4: Physical Appearance (for on-site observation)
  topColor?: string;
  glasses?: boolean;
  cap?: boolean;
  shoesColor?: string;
  bagType?: 'backpack' | 'crossbody' | 'tote' | 'none';
  height?: 'short' | 'average' | 'tall';

  // H5: Personal Items & Details
  phoneCase?: string;
  wristAccessory?: 'none' | 'watch' | 'bracelet' | 'both';
  uniqueAccessory?: string;

}

export interface Hint {
  id: string;
  level: HintLevel;
  payload: HintPayload;
  piiFlag: boolean;
  status: HintStatus;
  participantId: string;
  eventId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Matching System
export interface Match {
  id: string;
  eventId: string;
  participants: string[]; // Array of participant IDs (2 or 3 members)
  type: 'pair' | 'trio';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MatchAssignment {
  id: string;
  matchId: string;
  participantId: string;
  targetId: string; // The participant they need to find
  status: MatchStatus;
  foundAt?: Timestamp;
  eventId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Guessing & Interaction (Optional Feature)
export interface Guess {
  id: string;
  fromUid: string;
  toParticipantId: string;
  hypothesis: string;
  isCorrect?: boolean;
  eventId: string;
  createdAt: Timestamp;
}

// UI State Types
export interface FilterState {
  levels: HintLevel[];
  languages: Language[];
  interests: string[];
  appearance: string[];
  searchQuery: string;
}

export interface FormState {
  currentLevel: HintLevel;
  hints: Partial<Record<HintLevel, HintPayload>>;
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
}

// API Response Types
export interface ParticipantWithHints extends Participant {
  hints: Hint[];
  visibleHints: Hint[];
}

export interface EventWithRounds extends Event {
  rounds: Round[];
  activeRound?: Round;
}

export interface EventWithMatching extends Event {
  totalParticipants: number;
  matchedParticipants: number;
  totalMatches: number;
  matchingProgress: number; // 0-100
}

export interface ParticipantMatchInfo {
  participant: Participant;
  assignment?: MatchAssignment;
  target?: ParticipantWithHints;
}

// PII Validation
export interface PIIViolation {
  field: string;
  value: string;
  type: 'email' | 'phone' | 'social_handle' | 'full_name' | 'address';
  confidence: number;
}

export interface ValidationResult {
  isValid: boolean;
  violations: PIIViolation[];
  sanitizedValue?: string;
}

// Analytics & Metrics
export interface EventMetrics {
  totalParticipants: number;
  submissionRate: number;
  averageHintsPerParticipant: number;
  piiViolationRate: number;
  roundEngagement: Record<string, number>;
  languageDistribution: Record<Language, number>;
}
