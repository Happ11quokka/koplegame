'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

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
      // 1. 이벤트 코드 확인
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

      // 2. 힌트 저장
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
        matchedBy: [] // 누가 나를 맞췄는지
      });

      // 3. 피드 페이지로 이동
      localStorage.setItem('myNickname', nickname);
      router.push(`/event/${eventCode.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      setError('힌트 저장 실패. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          🎮 매칭 게임
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              이벤트 코드
            </label>
            <input
              type="text"
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="예: TEST2024"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              닉네임 (다른 사람이 볼 이름)
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="예: 홍길동"
              required
            />
          </div>

          <hr className="my-6" />

          <h2 className="text-lg font-semibold">💡 나의 힌트 입력</h2>

          {hintLabels.map((label, index) => (
            <div key={index}>
              <label className="block text-sm font-medium mb-2">
                {label}
              </label>
              <input
                type="text"
                value={hints[index]}
                onChange={(e) => handleHintChange(index, e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder={`힌트 ${index + 1} 입력`}
                required
              />
            </div>
          ))}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '저장 중...' : '힌트 제출하고 게임 시작'}
          </button>
        </form>
      </div>
    </div>
  );
}
