# Kople Game - International Student Networking App

A Progressive Web App (PWA) for international students to share 6-level hints during networking events, with round-based visibility control and strict PII protection.

## 🚀 Features

### Core Features

- **6-Level Hint System (H1-H6)**: Progressive hint sharing from abstract preferences to specific identifiers
- **Round-Based Visibility**: Admin-controlled hint level visibility for structured networking
- **PII Protection**: Comprehensive validation to prevent sharing of personal information
- **Mobile-First PWA**: Installable app with offline support
- **Real-time Updates**: Live round changes and participant updates
- **Multi-language Support**: English, Korean, Japanese, Chinese, Spanish, French

### User Flows

1. **Participants**: Event code entry → Consent → Profile setup → Hint creation → Feed browsing
2. **Admins**: Event creation → Round management → Participant monitoring

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Headless UI
- **Backend**: Firebase (Firestore, Authentication, Functions, Hosting)
- **PWA**: Service Worker, Web App Manifest
- **State Management**: React Context + useReducer

### Project Structure

```
src/
├── app/                    # Next.js 14 app router
│   ├── api/               # API routes
│   ├── event/[code]/      # Event participation
│   ├── onboarding/        # User onboarding flow
│   └── admin/             # Admin panel (to be completed)
├── components/
│   ├── feed/              # Participant feed components
│   ├── hints/             # H1-H6 form components
│   ├── onboarding/        # Onboarding flow
│   └── ui/                # Reusable UI components
├── lib/
│   ├── firebase/          # Firebase config and helpers
│   ├── contexts/          # React contexts
│   └── validation/        # PII validation system
└── types/                 # TypeScript definitions
```

## 🔧 Setup Instructions

### 1. Firebase Configuration

Create a Firebase project and enable the following services:

1. **Authentication**

   - Enable Anonymous authentication
   - Enable Email/Password authentication for admins

2. **Firestore Database**

   - Create database in production mode
   - Deploy the security rules from `firestore.rules`

3. **Cloud Functions** (Optional for enhanced PII validation)

   - Set up Functions for server-side validation

4. **Hosting** (For production deployment)
   - Configure for single-page application

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase configuration:

```bash
cp .env.local.example .env.local
```

Update the following values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 5. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## 📱 PWA Features

### Installation

- **Desktop**: Install prompt appears after user interaction
- **Mobile**: Add to Home Screen functionality
- **Offline Support**: Service worker caches essential resources

### Manifest Features

- App icons (multiple sizes)
- Splash screen
- Standalone display mode
- Theme color customization

## 🔒 Security & Privacy

### PII Protection

The app includes comprehensive validation to prevent sharing of:

- Full names
- Phone numbers and email addresses
- Social media handles
- Home addresses
- Student/Employee ID numbers

### Data Handling

- Anonymous authentication for participants
- Event data deleted 30 days after completion
- GDPR-compliant consent flow
- Audit logging for all hint submissions

### Firestore Security

- Row-level security with custom rules
- Round-based visibility enforcement
- Admin-only event management
- Rate limiting and input validation

## 🎯 Usage Guide

### For Participants

1. **Join Event**

   - Enter event code or scan QR code
   - Review privacy guidelines and consent
   - Set up profile with display name and language

2. **Create Hints**

   - **H1**: Preferences (music, food, lifestyle)
   - **H2**: Interests (studies, hobbies, sports)
   - **H3**: Communication (languages, style)
   - **H4**: Appearance (clothing, accessories for today)
   - **H5**: Personal items (phone case, accessories)
   - **H6**: Key identifiers (initials, origin, expected spots)

3. **Discover Others**
   - Browse participant feed
   - Filter by visible hint levels
   - Search across available hints
   - Connect in person using clues

### For Organizers

1. **Event Setup**

   - Create event with unique code
   - Set common H6 question
   - Configure languages and settings

2. **Round Management**

   - Create rounds with specific hint level visibility
   - Control timing and progression
   - Monitor participant engagement

3. **Monitoring**
   - Track submission rates
   - Review PII violations
   - Export analytics

## 🚧 Implementation Status

### ✅ Completed Features

- ✅ Next.js project setup with TypeScript and Tailwind
- ✅ Firebase configuration and authentication
- ✅ TypeScript interfaces and data models
- ✅ PWA configuration with service worker
- ✅ Comprehensive PII validation system
- ✅ Firestore security rules
- ✅ Complete onboarding flow (landing, consent, profile)
- ✅ H1-H6 hint input forms with real-time validation
- ✅ Participant feed infrastructure (partial)

### 🔄 In Progress

- 🔄 Participant feed and card view
- 🔄 Search and filtering functionality

### ⏳ Pending

- ⏳ Admin panel for event management
- ⏳ Round visibility control system
- ⏳ Cloud Functions for enhanced PII validation
- ⏳ Mobile responsive design optimization
- ⏳ Real-time updates with WebSocket
- ⏳ Analytics dashboard
- ⏳ Export functionality

## 🧪 Testing

### Development Testing

1. Create a test event in Firebase console
2. Use event code to test participant flow
3. Test PII validation with various inputs
4. Verify PWA installation on mobile devices

### PII Validation Testing

The system blocks common patterns like:

- `john.doe@email.com` → Email detected
- `@username` → Social handle detected
- `+1-555-123-4567` → Phone number detected
- `John Smith` → Full name pattern detected

## 🔮 Future Enhancements

### Phase 2 Features

- Real-time chat system
- Photo sharing with automatic face blurring
- Location-based features for large venues
- Integration with calendar systems
- Multi-event management

### Analytics & Insights

- Participant interaction heatmaps
- Most effective hint patterns
- Language preference analytics
- Networking success metrics

---

**Next Steps for You:**

1. **Set up Firebase project** with the services mentioned above
2. **Configure environment variables** with your Firebase credentials
3. **Run the development server** to test the onboarding flow
4. **Complete the remaining components** (admin panel, full participant feed)
5. **Deploy to Firebase Hosting** for production use

The core architecture and most complex components (PII validation, authentication, hint forms) are complete. You now have a solid foundation to build upon!
