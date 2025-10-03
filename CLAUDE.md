# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the Next.js application with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint checks

### Firebase Commands
- `firebase deploy --only firestore:rules` - Deploy Firestore security rules
- `firebase deploy --only hosting` - Deploy to Firebase Hosting

## Project Architecture

### Technology Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, React 19
- **Styling**: Tailwind CSS 4, Headless UI
- **Backend**: Firebase (Firestore, Authentication, Functions, Hosting)
- **PWA**: Service Worker, Web App Manifest, next-pwa
- **Build**: Turbopack for development and production builds

### Core Application Structure

This is a **Progressive Web App (PWA)** for international student networking events with a 6-level hint system and real-time round management.

```
src/
├── app/                     # Next.js 15 App Router
│   ├── api/                # API routes for events, participants, matching
│   ├── event/[code]/       # Event participation flow
│   ├── onboarding/         # User onboarding (consent, profile setup)
│   ├── admin/              # Admin panel (event management, rounds)
│   └── page.tsx           # Landing page
├── components/
│   ├── feed/              # Participant browsing and discovery
│   ├── hints/             # H1-H6 hint input forms
│   ├── onboarding/        # Landing, consent, profile components
│   └── ui/                # Reusable UI components
├── lib/
│   ├── firebase/          # Firebase config, auth, Firestore helpers
│   ├── contexts/          # React contexts (Auth, Event state)
│   └── validation/        # PII detection and validation system
└── types/                 # Comprehensive TypeScript definitions
```

### Key Architectural Concepts

#### Hint System (H1-H6)
- **H1**: Abstract preferences (music, food, lifestyle)
- **H2**: Interests and background (studies, hobbies, sports)
- **H3**: Communication (languages, style)
- **H4**: Physical appearance (clothing, accessories for the day)
- **H5**: Personal items (phone case, accessories)
- **H6**: Key identifiers (initials, origin, expected location)

#### Round-Based Visibility
- Admins control which hint levels are visible in each round
- Participants can only see hints according to current round settings
- Enables structured, progressive revelation of information

#### PII Protection System
- Comprehensive validation prevents sharing of personal information
- Blocks emails, phone numbers, social handles, full names, addresses
- Real-time validation in forms with immediate feedback

#### Authentication & Roles
- **Participants**: Anonymous authentication for privacy
- **Admins**: Email/password authentication with role claims
- User roles stored in Firestore with security rules enforcement

#### Matching System
- Algorithm creates pairs/trios of participants
- Each participant gets a "target" to find using hints
- Match status tracking (pending → found → completed)

### Firebase Integration

#### Firestore Collections
- `events` - Event metadata and configuration
- `participants` - User profiles and participation data
- `hints` - All H1-H6 hint submissions
- `rounds` - Round definitions and visibility settings
- `matches` - Generated participant pairings/groupings
- `matchAssignments` - Individual finding targets

#### Security Rules
- Comprehensive row-level security in `firestore.rules`
- Round-based hint visibility enforcement
- Admin-only event management operations
- Rate limiting and input validation

### Configuration Files

#### Environment Setup
- Copy `.env.local.example` to `.env.local`
- Configure Firebase project credentials
- All environment variables prefixed with `NEXT_PUBLIC_`

#### PWA Configuration
- Service worker handles offline functionality
- Web app manifest enables installation
- Custom webpack configuration for PWA features

### State Management

#### React Contexts
- `AuthContext` - User authentication and role management
- Event-specific state managed through React hooks and contexts
- Form state with validation and submission handling

#### TypeScript Integration
- Comprehensive type definitions in `src/types/index.ts`
- Strict TypeScript configuration with Next.js integration
- Path mapping: `@/*` maps to `src/*`

### Development Workflow

#### Code Style
- ESLint with Next.js and TypeScript rules
- Tailwind CSS for all styling
- No additional formatting tools configured

#### Testing Strategy
- No test framework currently configured
- Manual testing through Firebase console
- PII validation testing with various input patterns

### Production Deployment

#### Firebase Hosting
- Build output goes to `build/` directory
- Single-page application configuration
- Static hosting with client-side routing

#### Build Process
- Next.js static export for Firebase Hosting
- Turbopack for optimized builds
- Service worker generation for PWA features