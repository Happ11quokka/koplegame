'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';

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
  const eventCode = params.code as string;

  const [hints, setHints] = useState<Hint[]>([]);
  const [eventId, setEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedHint, setSelectedHint] = useState<Hint | null>(null);
  const [guess, setGuess] = useState('');
  const [myNickname, setMyNickname] = useState('');
  const [myMatches, setMyMatches] = useState<string[]>([]); // 내가 맞춘 사람들

  useEffect(() => {
    const nickname = localStorage.getItem('myNickname') || '';
    setMyNickname(nickname);
    loadHints();
  }, []);

  const loadHints = async () => {
    try {
      // 1. 이벤트 찾기
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('code', '==', eventCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('이벤트를 찾을 수 없습니다');
        return;
      }

      const eventDoc = querySnapshot.docs[0];
      const eventDocId = eventDoc.id;
      setEventId(eventDocId);

      // 2. 모든 힌트 가져오기
      const hintsRef = collection(db, `events/${eventDocId}/hints`);
      const hintsSnapshot = await getDocs(hintsRef);

      const hintsData = hintsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Hint));

      setHints(hintsData);
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
      // 정답!
      alert('🎉 정답입니다!');

      // Firestore 업데이트
      try {
        const hintRef = doc(db, `events/${eventId}/hints`, selectedHint.id);
        await updateDoc(hintRef, {
          matchedBy: arrayUnion(myNickname)
        });

        // 로컬 상태 업데이트
        setMyMatches([...myMatches, selectedHint.nickname]);
        setSelectedHint(null);
        setGuess('');

        // 힌트 목록 새로고침
        loadHints();
      } catch (err) {
        console.error(err);
      }
    } else {
      alert('❌ 틀렸습니다. 다시 시도하세요!');
      setGuess('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>힌트 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const otherHints = hints.filter(h => h.nickname !== myNickname);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">🎮 {eventCode} 매칭 게임</h1>
          <p className="text-gray-600">
            내 닉네임: <strong>{myNickname}</strong> | 맞춘 사람: <strong>{myMatches.length}명</strong>
          </p>
        </div>

        {selectedHint ? (
          // 선택한 힌트 보기 + 추측하기
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">💡 힌트</h2>

            <div className="space-y-3 mb-6">
              <div><strong>H1. 음악 장르:</strong> {selectedHint.h1}</div>
              <div><strong>H2. 스포츠/팀:</strong> {selectedHint.h2}</div>
              <div><strong>H3. 감탄사/이모지:</strong> {selectedHint.h3}</div>
              <div><strong>H4. 상의 색깔:</strong> {selectedHint.h4}</div>
              <div><strong>H5. 폰 케이스:</strong> {selectedHint.h5}</div>
              <div><strong>H6. 이름 이니셜:</strong> {selectedHint.h6}</div>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">
                이 사람이 누구인지 추측해보세요
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  placeholder="닉네임 입력"
                  onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
                />
                <button
                  onClick={handleGuess}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
                >
                  확인
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedHint(null)}
              className="mt-4 text-gray-600 hover:text-gray-800"
            >
              ← 목록으로 돌아가기
            </button>
          </div>
        ) : (
          // 힌트 목록
          <div>
            <h2 className="text-xl font-semibold mb-4">🎯 참가자 힌트 목록</h2>

            {otherHints.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                아직 다른 참가자가 없습니다
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {otherHints.map((hint) => (
                  <div
                    key={hint.id}
                    className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition cursor-pointer"
                    onClick={() => setSelectedHint(hint)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg">참가자</h3>
                      {hint.matchedBy.includes(myNickname) && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          ✓ 맞춤
                        </span>
                      )}
                    </div>

                    <div className="text-sm space-y-1 text-gray-600">
                      <div>🎵 {hint.h1}</div>
                      <div>⚽ {hint.h2}</div>
                      <div>💬 {hint.h3}</div>
                      <div className="text-xs text-gray-400 mt-2">
                        클릭하여 더보기 →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 내 힌트 확인 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">📝 내 힌트</h3>
          <div className="text-sm space-y-1">
            {hints.filter(h => h.nickname === myNickname).map(h => (
              <div key={h.id}>
                <div>H1: {h.h1}</div>
                <div>H2: {h.h2}</div>
                <div>H3: {h.h3}</div>
                <div>H4: {h.h4}</div>
                <div>H5: {h.h5}</div>
                <div>H6: {h.h6}</div>
                <div className="mt-2 text-xs text-gray-600">
                  {h.matchedBy.length}명이 나를 맞췄습니다
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
