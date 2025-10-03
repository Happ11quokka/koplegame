'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function HomePage() {
  const router = useRouter();
  const [eventCode, setEventCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [hints, setHints] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hintLabels = [
    'H1. 가장 좋아하는 음악 장르',
    'H2. 가장 좋아하는 스포츠/팀',
    'H3. 즐겨 쓰는 감탄사/이모지',
    'H4. 오늘 상의 색깔',
    'H5. 폰 케이스 색/패턴',
    'H6. 이름 이니셜'
  ];

  const handleHintChange = (index: number, value: string) => {
    const newHints = [...hints];
    newHints[index] = value;
    setHints(newHints);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('code', '==', eventCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('이벤트 코드를 찾을 수 없습니다');
        setLoading(false);
        return;
      }

      const eventDoc = querySnapshot.docs[0];
      const eventId = eventDoc.id;

      const hintsRef = collection(db, `events/${eventId}/hints`);
      await addDoc(hintsRef, {
        nickname,
        h1: hints[0],
        h2: hints[1],
        h3: hints[2],
        h4: hints[3],
        h5: hints[4],
        h6: hints[5],
        createdAt: new Date(),
        matchedBy: []
      });

      localStorage.setItem('myNickname', nickname);
      router.push(`/event/${eventCode.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      setError('힌트 저장 실패. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-200 via-orange-100 to-white px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="text-center text-white drop-shadow-sm">
          <p className="mx-auto inline-flex items-center rounded-full bg-white/30 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-orange-900 backdrop-blur">
            오늘도 매칭 성공!
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-orange-900">
            🎮 매칭 게임에 참여해보세요
          </h1>
          <p className="mt-2 text-sm text-orange-900/80">
            이벤트 코드를 입력하고 힌트를 남기면 친구들이 나를 맞출 수 있어요.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-orange-200 backdrop-blur"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-orange-900">
                이벤트 코드
              </label>
              <input
                type="text"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-medium text-orange-900 shadow-sm outline-none ring-orange-400 transition focus:border-orange-400 focus:ring"
                placeholder="예: TEST2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-orange-900">
                닉네임 (다른 사람이 볼 이름)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-medium text-orange-900 shadow-sm outline-none ring-orange-400 transition focus:border-orange-400 focus:ring"
                placeholder="예: 홍길동"
                required
              />
            </div>
          </div>

          <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-orange-200 to-transparent" />

          <div className="space-y-4">
            <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-900">
              힌트는 다른 참가자들이 나를 맞출 때 큰 도움이 돼요. 재미있고 구체적으로 작성해 볼까요?
            </div>

            <h2 className="text-lg font-bold text-orange-900">💡 나의 힌트 입력</h2>

            {hintLabels.map((label, index) => (
              <div key={label}>
                <label className="block text-sm font-semibold text-orange-900">
                  {label}
                </label>
                <input
                  type="text"
                  value={hints[index]}
                  onChange={(e) => handleHintChange(index, e.target.value)}
                  className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-medium text-orange-900 shadow-sm outline-none ring-orange-400 transition focus:border-orange-400 focus:ring"
                  placeholder={`힌트 ${index + 1} 입력`}
                  required
                />
              </div>
            ))}

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-orange-500 px-4 py-3 text-base font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '저장 중...' : '힌트 제출하고 게임 시작'}
          </button>
        </form>
      </div>
    </div>
  );
}
