# Firebase Setup Guide for Kople Game

## 1. Firebase Project Configuration

Your project is already configured with these credentials:
- **Project ID**: `koplegame`
- **Domain**: `koplegame.firebaseapp.com`
- **Analytics**: Enabled with measurement ID `G-ZWLK0CFYLE`

## 2. Enable Required Services

### Authentication
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable the following providers:
   - **Email/Password** (for both admins and participants)

**Important**: Anonymous authentication is no longer used. All users (admins and participants) now use email/password authentication for better tracking and result management.

### Firestore Database
1. Go to Firebase Console → Firestore Database
2. Create database in **production mode**
3. Choose your preferred region (recommended: asia-northeast1 for Korean users)

### Optional: Cloud Functions
1. Go to Firebase Console → Functions
2. Upgrade to Blaze plan if you want server-side PII validation

## 3. Deploy Security Rules

Copy the content from `firestore.rules` and paste it into Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // [Paste the full content from firestore.rules file]
  }
}
```

## 4. Create Initial Data

### Create a Test Event
1. Go to Firestore Database → Data
2. Create a collection called `events`
3. Add a document with auto-generated ID and these fields:

```json
{
  "code": "TEST2024",
  "title": "Test International Student Meetup",
  "description": "A test event for Kople Game",
  "status": "live",
  "langs": ["en", "ko"],
  "h6CommonQuestion": "What location in this city are you most excited to visit?",
  "location": "Seoul Campus",
  "createdAt": [current timestamp],
  "updatedAt": [current timestamp],
  "createdBy": "admin"
}
```

### Create a Test Round
1. Under the event document, create a subcollection called `rounds`
2. Add a document with auto-generated ID:

```json
{
  "name": "Round 1: Getting to Know Each Other",
  "visibleLevels": ["H1", "H2"],
  "isActive": true,
  "order": 1,
  "eventId": "[your-event-id]",
  "createdAt": [current timestamp],
  "updatedAt": [current timestamp]
}
```

### Create Admin Account
The admin account is automatically created when you first attempt to login:

1. Go to your app's admin login page: `/admin/login`
2. Use the credentials:
   - **Username**: `admin`
   - **Password**: `admin`
3. The system will automatically:
   - Create the Firebase user `admin@kople.com` with password `admin123`
   - Set up the admin role in Firestore

**Note**: The admin login page uses simple username/password (admin/admin) but internally converts this to email authentication for Firebase compatibility.

### Create Participant Accounts
Participant accounts are now pre-created by admins:

1. After creating an event, go to event management
2. In the "Participant Accounts" section, create accounts (e.g., 10 accounts)
3. This will create accounts like:
   - `kople1@kople.com` with password `kolple`
   - `kople2@kople.com` with password `kolple`
   - etc.
4. Share these simple IDs (kople1, kople2) with participants
5. Participants login at `/participant/login` with:
   - **Participant ID**: `kople1` (not the full email)
   - **Password**: `kolple`

## 5. Test the Application

### Development Testing
1. Run `npm run dev`
2. Go to `http://localhost:3000`
3. Enter the test event code: `TEST2024`
4. Complete the onboarding flow
5. Create hints and test the PII validation

### Test Cases for PII Validation
Try entering these to verify the validation works:
- Email: `test@example.com` (should be blocked)
- Phone: `+82-10-1234-5678` (should be blocked)
- Social handle: `@myusername` (should be blocked)
- Full name: `John Smith` (should be flagged)

## 6. Analytics Setup

Analytics is already configured and will automatically track:
- Page views
- User events (hint creation, PII violations)
- Error tracking
- PWA installation events

View analytics data in Firebase Console → Analytics.

## 7. Hosting Setup (Optional)

For production deployment:
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize hosting: `firebase init hosting`
4. Build the app: `npm run build`
5. Deploy: `firebase deploy --only hosting`

## 8. Mobile Testing

### PWA Testing
1. Open the app on a mobile device
2. Look for "Add to Home Screen" prompt
3. Test offline functionality
4. Verify responsive design

### QR Code Testing
1. Generate a QR code with content: `https://your-domain.com/?code=TEST2024`
2. Test scanning with the built-in QR scanner

## 9. Production Checklist

Before going live:
- [ ] Update event codes and remove test data
- [ ] Configure proper admin users
- [ ] Test all user flows on mobile devices
- [ ] Verify PII validation is working correctly
- [ ] Set up monitoring and alerts
- [ ] Configure backup policies for Firestore
- [ ] Test PWA installation on various devices

## 10. Monitoring & Maintenance

### Regular Tasks
- Monitor PII violation logs
- Review user feedback and error reports
- Update hint validation rules as needed
- Clean up expired event data
- Monitor Firebase usage and costs

### Analytics to Monitor
- Participant completion rates
- Time spent on hint creation
- PII violation frequency
- PWA installation rates
- Mobile vs desktop usage

---

Your Kople Game app is now ready to use! The configuration includes your actual Firebase project credentials, so you can start testing immediately.