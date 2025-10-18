# 🔥 Firebase 설정 가이드 (단계별)

## ✅ 완료해야 할 단계들

### 1. Firebase Console에서 복사한 설정 정보를 다음 파일에 넣기

**파일**: `src/lib/firebase/config.ts`

```typescript
const firebaseConfig = {
  apiKey: "여기에-복사한-API-KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

### 2. Firestore 보안 규칙 설정

Firebase Console → Firestore Database → 규칙 탭에서 다음 내용 붙여넣기:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Events collection - admins can read/write, others can read
    match /events/{eventId} {
      allow read: if true; // Anyone can read events for validation
      allow write: if isAdmin();

      // Participants subcollection
      match /participants/{participantId} {
        allow read: if true; // Anyone can read participant list
        allow write: if isAuthenticated();
      }

      // Hints subcollection
      match /hints/{hintId} {
        allow read: if true; // Anyone can read hints (round filtering done in app)
        allow write: if isAuthenticated();
      }

      // Rounds subcollection
      match /rounds/{roundId} {
        allow read: if true;
        allow write: if isAdmin();
      }

      // Matches subcollection
      match /matches/{matchId} {
        allow read: if isAdmin();
        allow write: if isAdmin();
      }

      // Assignments subcollection
      match /assignments/{assignmentId} {
        allow read: if isAuthenticated();
        allow write: if isAuthenticated();
      }

      // Participant Accounts subcollection
      match /participantAccounts/{accountId} {
        allow read: if isAdmin();
        allow write: if isAdmin();
      }
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && resource.id == userId;
    }

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roleClaims.admin == true;
    }
  }
}
```

### 3. 테스트 이벤트 생성

Firebase Console → Firestore Database → 데이터 탭에서:

1. **컬렉션 ID**: `events`
2. **문서 ID**: 자동 생성
3. **필드 추가**:
   ```
   code: "TEST2024" (string)
   title: "Test Event" (string)
   status: "draft" (string)
   langs: ["en", "ko"] (array)
   matchingCreated: false (boolean)
   createdAt: [현재 시간] (timestamp)
   updatedAt: [현재 시간] (timestamp)
   createdBy: "admin" (string)
   ```

## 🚀 Firebase 설정 정보 입력하는 방법

**Firebase Console에서 복사한 설정을 알려주시면, 바로 코드에 넣어드리겠습니다!**

예를 들어:
```
apiKey: "AIzaSyABC123..."
authDomain: "my-project.firebaseapp.com"
projectId: "my-project-123"
...
```

이렇게 알려주시면 즉시 설정해드릴게요! 📝
