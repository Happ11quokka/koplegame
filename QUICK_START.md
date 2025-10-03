# 🚀 빠른 시작 가이드 (24명 모바일 게임용)

## 1️⃣ Firebase 규칙 설정 (필수)

Firebase Console → Firestore Database → 규칙 탭에 다음 규칙 붙여넣기:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read, write: if true;

      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
}
```

**⚠️ 주의: 이건 테스트용입니다. 나중에 보안 규칙 적용 필요**

---

## 2️⃣ 테스트 이벤트 만들기

Firebase Console → Firestore Database → 데이터 추가:

**컬렉션**: `events`
**문서 ID**: (자동 생성 버튼 클릭)
**필드 추가**:
- `code` (string): `KOPLE2025`
- `title` (string): `코플 매칭 게임`
- `createdAt` (timestamp): 현재 시간

저장하면 끝!

---

## 3️⃣ Vercel 배포 (핸드폰으로 접속용)

### 방법 1: Vercel CLI 사용
```bash
# Vercel CLI 설치 (처음만)
npm install -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 방법 2: GitHub 연동 (추천)
1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com) 접속
3. "New Project" → GitHub 저장소 선택
4. 환경 변수 설정 **없이** 바로 Deploy
5. 생성된 URL 복사 (예: `https://your-app.vercel.app`)

---

## 4️⃣ 24명에게 URL 공유

배포된 URL을 카카오톡/문자로 공유:

```
🎮 매칭 게임 참여하기
https://your-app.vercel.app

이벤트 코드: KOPLE2025
```

---

## 5️⃣ 게임 진행 방법

### 참가자 (각자 핸드폰에서):
1. 링크 접속
2. 이벤트 코드 입력: `KOPLE2025`
3. 닉네임 입력 (예: `홍길동`)
4. 힌트 6개 입력
   - H1. 가장 좋아하는 음악 장르
   - H2. 가장 좋아하는 스포츠/팀
   - H3. 즐겨 쓰는 감탄사/이모지
   - H4. 오늘 상의 색깔
   - H5. 폰 케이스 색/패턴
   - H6. 이름 이니셜
5. 제출 후 다른 사람 힌트 보기
6. 힌트 보고 누군지 맞추기!

---

## 6️⃣ 모바일 최적화

✅ 반응형 디자인 적용
✅ 터치 최적화
✅ 모바일 브라우저에서 바로 사용
✅ 별도 앱 설치 불필요

---

## 7️⃣ 로컬 테스트 (배포 전)

```bash
npm run build
npm run dev
```

브라우저에서: `http://localhost:3000`

핸드폰에서 테스트하려면:
1. 같은 WiFi에 연결
2. 터미널에 표시된 Network URL 접속 (예: `http://172.30.1.37:3000`)

---

## ✅ 체크리스트

- [ ] Firebase 규칙 설정
- [ ] 테스트 이벤트 생성 (`KOPLE2025`)
- [ ] 로컬 빌드 성공 확인
- [ ] Vercel 배포
- [ ] 핸드폰에서 테스트 (2명 이상)
- [ ] 24명에게 URL 공유

---

## 🔧 문제 해결

### Q: 힌트가 안 보여요
A: Firebase 규칙이 제대로 설정되었는지 확인

### Q: 이벤트 코드를 찾을 수 없다고 나와요
A: Firebase에서 이벤트가 생성되었는지, `code` 필드가 정확한지 확인

### Q: 핸드폰에서 느려요
A: WiFi 연결 확인, Firebase 리전 확인 (아시아-northeast3 권장)
