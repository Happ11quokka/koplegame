'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Hint {
  id: string;
  nickname: string;
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;
  matchedBy: string[];
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventCode = (params.code as string)?.toUpperCase();

  const [hints, setHints] = useState<Hint[]>([]);
  const [eventId, setEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedHint, setSelectedHint] = useState<Hint | null>(null);
  const [guess, setGuess] = useState('');
  const [myNickname, setMyNickname] = useState('');
  const [myMatches, setMyMatches] = useState<string[]>([]);

  useEffect(() => {
    const storedNickname = localStorage.getItem('myNickname') || '';
    if (!storedNickname) {
      alert('닉네임 정보가 없습니다. 처음 화면에서 다시 로그인해주세요.');
      router.push('/');
      return;
    }
    setMyNickname(storedNickname);
    loadHints(storedNickname);
  }, []);

  const loadHints = async (nicknameFromStorage?: string) => {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('code', '==', eventCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('이벤트를 찾을 수 없습니다');
        setLoading(false);
        return;
      }

      const eventDoc = querySnapshot.docs[0];
      const eventDocId = eventDoc.id;
      setEventId(eventDocId);

      const hintsRef = collection(db, `events/${eventDocId}/hints`);
      const hintsSnapshot = await getDocs(hintsRef);

      const hintsData = hintsSnapshot.docs.map((hintDoc) => ({
        id: hintDoc.id,
        ...hintDoc.data()
      } as Hint));

      setHints(hintsData);
      const effectiveNickname = nicknameFromStorage || myNickname;
      if (effectiveNickname) {
        const matched = hintsData
          .filter((hint) => hint.matchedBy.includes(effectiveNickname))
          .map((hint) => hint.nickname);
        setMyMatches(matched);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert('힌트 불러오기 실패');
      setLoading(false);
    }
  };

  const handleGuess = async () => {
    if (!selectedHint || !guess.trim()) return;

    if (guess.trim().toLowerCase() === selectedHint.nickname.toLowerCase()) {
      alert('🎉 정답입니다!');

      try {
        const hintRef = doc(db, `events/${eventId}/hints`, selectedHint.id);
        await updateDoc(hintRef, {
          matchedBy: arrayUnion(myNickname)
        });

        setSelectedHint(null);
        setGuess('');
        loadHints();
      } catch (err) {
        console.error(err);
        alert('정답 기록에 실패했습니다. 다시 시도해주세요.');
      }
    } else {
      alert('❌ 틀렸습니다. 다시 시도하세요!');
      setGuess('');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-200 via-orange-100 to-white px-4">
        <div className="text-center text-orange-900">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-300 border-t-transparent"></div>
          <p className="text-sm font-semibold">힌트 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const otherHints = hints.filter((hint) => hint.nickname !== myNickname);
  const myHintEntries = hints.filter((hint) => hint.nickname === myNickname);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-200 via-orange-100 to-white px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-orange-200 backdrop-blur">
          <h1 className="text-2xl font-extrabold text-orange-900 sm:text-3xl">
            🎮 {eventCode} 매칭 게임
          </h1>
          <p className="mt-2 text-sm text-orange-900/80">
            내 닉네임: <strong>{myNickname}</strong> | 맞춘 사람: <strong>{myMatches.length}명</strong>
          </p>
        </header>

        {selectedHint ? (
          <section className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-orange-200 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-orange-900">💡 힌트 상세보기</h2>
              <button
                onClick={() => setSelectedHint(null)}
                className="text-sm font-semibold text-orange-500 transition hover:text-orange-600"
              >
                ← 목록으로 돌아가기
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <DetailRow label="H1. 음악 장르" value={selectedHint.h1} />
              <DetailRow label="H2. 스포츠/팀" value={selectedHint.h2} />
              <DetailRow label="H3. 감탄사/이모지" value={selectedHint.h3} />
              <DetailRow label="H4. 상의 색깔" value={selectedHint.h4} />
              <DetailRow label="H5. 폰 케이스" value={selectedHint.h5} />
              <DetailRow label="H6. 이름 이니셜" value={selectedHint.h6} />
            </div>

            <div className="mt-8 rounded-2xl bg-orange-50 px-4 py-5">
              <label className="block text-sm font-semibold text-orange-900">
                이 사람이 누구인지 추측해보세요
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  className="w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-medium text-orange-900 shadow-sm outline-none ring-orange-400 transition focus:border-orange-400 focus:ring"
                  placeholder="닉네임 입력"
                  onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                />
                <button
                  onClick={handleGuess}
                  className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 sm:w-auto"
                >
                  확인
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-orange-200 backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-orange-900">🎯 참가자 힌트 목록</h2>
                <span className="text-sm font-semibold text-orange-500">
                  내 매칭 {myMatches.length}명
                </span>
              </div>

              {otherHints.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-orange-50 px-4 py-6 text-center text-sm text-orange-900/70">
                  아직 다른 참가자가 없습니다. 친구들에게 링크를 공유해보세요!
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {otherHints.map((hint) => {
                    const matched = hint.matchedBy.includes(myNickname);
                    return (
                      <button
                        key={hint.id}
                        onClick={() => setSelectedHint(hint)}
                        className="rounded-2xl bg-white px-4 py-5 text-left shadow-md ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="text-base font-semibold text-orange-900">참가자</h3>
                          {matched && (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              ✓ 맞춤
                            </span>
                          )}
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-orange-900/80">
                          <div>🎵 {hint.h1}</div>
                          <div>⚽ {hint.h2}</div>
                          <div>💬 {hint.h3}</div>
                        </div>
                        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-orange-400">
                          클릭하여 전체 힌트 보기 →
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-orange-200 backdrop-blur">
          <h3 className="text-lg font-bold text-orange-900">📝 내 힌트</h3>
          {myHintEntries.length === 0 ? (
            <p className="mt-4 text-sm text-orange-900/70">
              내 힌트가 아직 보이지 않나요? 처음 화면에서 입력을 완료했는지 확인해주세요.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {myHintEntries.map((hint) => (
                <div key={hint.id} className="rounded-2xl bg-orange-50 px-4 py-4 text-sm text-orange-900">
                  <p>H1: {hint.h1}</p>
                  <p>H2: {hint.h2}</p>
                  <p>H3: {hint.h3}</p>
                  <p>H4: {hint.h4}</p>
                  <p>H5: {hint.h5}</p>
                  <p>H6: {hint.h6}</p>
                  <p className="mt-2 text-xs text-orange-900/70">
                    {hint.matchedBy.length}명이 나를 맞췄습니다
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-900">
      <span className="font-semibold">{label}</span>
      <div className="mt-1 text-orange-900/80">{value || '정보 없음'}</div>
    </div>
  );
}
