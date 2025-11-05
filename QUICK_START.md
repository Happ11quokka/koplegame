# 🚀 Quick Start Guide

개발자 및 운영자를 위한 빠른 설정 가이드입니다.

## 📋 사전 요구사항

- Node.js 20 이상
- npm 또는 yarn
- Firebase 프로젝트 (무료 Spark 플랜 가능)
- Vercel 계정 (배포 시)

## 🔧 로컬 개발 환경 설정

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd Kople_game
npm install
```

### 2. Firebase 프로젝트 설정

#### Firebase Console에서 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 후 생성

#### Firestore Database 활성화

1. Firebase Console → Firestore Database
2. "데이터베이스 만들기" 클릭
3. 테스트 모드로 시작 (나중에 보안 규칙 설정)
4. 리전 선택: `asia-northeast3` (서울) 권장

#### Firebase 설정 정보 복사

1. Firebase Console → 프로젝트 설정 (⚙️)
2. "내 앱"에서 웹 앱 추가 (`</>` 아이콘)
3. 앱 닉네임 입력 후 등록
4. Firebase SDK 구성 정보 복사

### 3. 환경 변수 설정

`.env.local.example` 파일을 복사하여 `.env.local` 생성:

```bash
cp .env.local.example .env.local
```

`.env.local` 파일에 Firebase 설정 정보 입력:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Firestore 보안 규칙 설정

Firebase Console → Firestore Database → 규칙 탭에 다음 규칙 적용:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      // 이벤트 문서는 모두 읽기 가능
      allow read: if true;
      allow write: if false;  // 콘솔에서만 생성

      // 하위 컬렉션 (hints)
      match /hints/{hintId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow update: if request.auth != null;
        allow delete: if false;
      }
    }
  }
}
```

**⚠️ 주의**: 프로덕션 환경에서는 더 엄격한 보안 규칙을 적용하세요.

### 5. 테스트 이벤트 생성

Firebase Console → Firestore Database → 데이터:

1. 컬렉션 시작: `events`
2. 문서 ID: 자동 생성
3. 필드 추가:
   - `code` (string): `DANGJIN` (대문자)
   - `title` (string): `코플 매칭 게임`
   - `createdAt` (timestamp): 현재 시간

### 6. 로컬 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

#### 모바일에서 테스트

같은 WiFi에 연결 후:
1. 터미널에 표시된 Network URL 확인 (예: `http://192.168.0.100:3000`)
2. 모바일 브라우저에서 해당 URL 접속

## 🌐 프로덕션 배포

### Vercel 배포 (권장)

#### 방법 1: GitHub 연동

1. GitHub에 저장소 푸시
2. [Vercel](https://vercel.com) 접속 및 로그인
3. "New Project" 클릭
4. GitHub 저장소 선택
5. 환경 변수 설정:
   - `.env.local`의 모든 변수 추가
6. "Deploy" 클릭

#### 방법 2: Vercel CLI

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### Firebase Hosting (선택사항)

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# 빌드
npm run build

# 배포
firebase deploy --only hosting
```

## 🎮 새 이벤트 생성하기

### 1. Firestore에서 이벤트 문서 생성

Firebase Console → Firestore Database:

```
컬렉션: events
문서 ID: (자동 생성)
필드:
  - code: "NEWEVENT" (대문자, 고유값)
  - title: "새 이벤트 이름"
  - createdAt: [현재 시간]
```

### 2. 참가자에게 URL 공유

```
🎮 매칭 게임 참여하기
https://your-app.vercel.app

이벤트 코드: NEWEVENT
```

## 🛠 주요 명령어

```bash
# 개발 서버 (Turbopack)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린트 검사
npm run lint
```

## 📊 데이터 구조

```
events (컬렉션)
└── {eventId}
    ├── code: string           # 이벤트 코드 (대문자)
    ├── title: string          # 이벤트 제목
    ├── createdAt: Timestamp
    └── hints (하위 컬렉션)
        └── {hintId}
            ├── nickname: string      # 참가자 닉네임
            ├── h1: string           # 힌트 1
            ├── h2: string           # 힌트 2
            ├── h3: string           # 힌트 3
            ├── h4: string           # 힌트 4
            ├── matchedBy: string[]  # 맞춘 사람 목록
            └── createdAt: Timestamp
```

## 🔍 문제 해결

### Q: "Event not found" 에러

**원인**: Firestore에 해당 이벤트가 없거나 코드가 일치하지 않음

**해결**:
- Firebase Console에서 이벤트 생성 확인
- `code` 필드가 대문자인지 확인
- Firestore 보안 규칙 확인

### Q: 힌트가 저장되지 않음

**원인**: Firestore 보안 규칙 또는 인증 문제

**해결**:
- Firestore 규칙에서 `allow create: if request.auth != null;` 확인
- Firebase Authentication에서 익명 로그인 활성화 확인
- 브라우저 콘솔에서 에러 메시지 확인

### Q: 빌드 실패

**원인**: 환경 변수 누락 또는 타입 에러

**해결**:
```bash
# 환경 변수 확인
cat .env.local

# 타입 체크
npm run build
```

### Q: 모바일에서 느림

**원인**: Firebase 리전 또는 네트워크 이슈

**해결**:
- Firestore 리전을 `asia-northeast3` (서울)로 설정
- 이미지 최적화 확인
- 네트워크 탭에서 느린 요청 확인

## 📚 추가 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Firebase 문서](https://firebase.google.com/docs)
- [Vercel 문서](https://vercel.com/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

## 🤝 기여하기

이슈 또는 PR을 환영합니다!

## 📝 체크리스트

프로덕션 배포 전 확인사항:

- [ ] Firebase 프로젝트 생성 완료
- [ ] Firestore 보안 규칙 설정
- [ ] `.env.local` 환경 변수 설정
- [ ] 테스트 이벤트 생성 및 테스트
- [ ] 로컬 빌드 성공 (`npm run build`)
- [ ] 모바일에서 테스트 완료
- [ ] Vercel 배포 완료
- [ ] 프로덕션 환경 변수 설정
- [ ] 실제 이벤트 생성 및 URL 공유
