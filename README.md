# 🎮 매칭 게임 - 초경량 MVP

24명이 핸드폰으로 힌트를 보고 서로를 찾는 매칭 게임

## 🚀 빠른 시작

**[QUICK_START.md](./QUICK_START.md)를 참고하세요!**

## ✨ 주요 기능

### 1. 힌트 입력 (`/`)
- 이벤트 코드 입력
- 닉네임 입력
- 6개 힌트 입력 (H1~H6)

### 2. 참가자 피드 (`/event/[code]`)
- 다른 참가자 힌트 카드 보기
- 힌트 상세 보기
- 닉네임 추측하기
- 맞춘 사람 수 확인

### 3. 내 힌트 확인
- 내가 입력한 힌트 확인
- 누가 나를 맞췄는지 확인

## 🎯 힌트 구조

```
H1. 가장 좋아하는 음악 장르 (취향)
H2. 가장 좋아하는 스포츠/팀 (관심사)
H3. 즐겨 쓰는 감탄사/이모지 (말투)
H4. 오늘 상의 색깔 (외형)
H5. 폰 케이스 색/패턴 (소지품)
H6. 이름 이니셜 (키 포인트)
```

## 📱 모바일 최적화

- ✅ 반응형 디자인
- ✅ 터치 최적화
- ✅ 모바일 브라우저 지원
- ✅ PWA 불필요

## 🛠 기술 스택

- **Frontend**: Next.js 15 (App Router)
- **Database**: Firebase Firestore
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📦 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 서버
npm start
```

## 🔥 Firebase 설정

1. Firebase Console에서 프로젝트 생성
2. Firestore Database 활성화
3. `QUICK_START.md`의 보안 규칙 적용
4. 테스트 이벤트 생성

## 🌐 배포

### Vercel (추천)
```bash
vercel --prod
```

또는 GitHub 연동으로 자동 배포

## 📝 사용 방법

1. Firebase에서 이벤트 생성 (코드: `KOPLE2025`)
2. Vercel에 배포
3. 생성된 URL을 24명에게 공유
4. 각자 핸드폰에서 접속
5. 힌트 입력 → 다른 사람 힌트 보기 → 맞추기!

## 🔒 보안 참고

현재는 테스트용 보안 규칙을 사용합니다.
프로덕션에서는 적절한 Firebase Security Rules 적용 필요.

## 📄 라이선스

MIT

---

**내일 바로 사용 가능한 초경량 MVP입니다! 🚀**
