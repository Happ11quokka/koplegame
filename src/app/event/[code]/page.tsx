'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
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
  h7: string;
  h8: string;
  matchedBy: string[];
  createdAt?: Timestamp;
  order?: number;
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
      alert('No nickname found. Please login again from the home screen.');
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
        alert('Event not found');
        setLoading(false);
        return;
      }

      const eventDoc = querySnapshot.docs[0];
      const eventDocId = eventDoc.id;
      setEventId(eventDocId);

      const hintsRef = collection(db, `events/${eventDocId}/hints`);
      const hintsSnapshot = await getDocs(query(hintsRef, orderBy('createdAt', 'asc')));

      const hintsData = hintsSnapshot.docs.map((hintDoc, index) => {
        const data = hintDoc.data();
        return {
          id: hintDoc.id,
          order: index + 1,
          createdAt: data.createdAt as Timestamp | undefined,
          nickname: data.nickname as string,
          h1: data.h1 as string,
          h2: data.h2 as string,
          h3: data.h3 as string,
          h4: data.h4 as string,
          h5: data.h5 as string,
          h6: data.h6 as string,
          h7: data.h7 as string,
          h8: data.h8 as string,
          matchedBy: (data.matchedBy as string[]) || []
        } satisfies Hint;
      });

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
      alert('Failed to load hints');
      setLoading(false);
    }
  };

  const handleGuess = async () => {
    if (!selectedHint || !guess.trim()) return;

    if (guess.trim().toLowerCase() === selectedHint.nickname.toLowerCase()) {
      alert('🎉 Correct!');

      try {
        const hintRef = doc(db, `events/${eventId}/hints`, selectedHint.id);
        await updateDoc(hintRef, {
          matchedBy: arrayUnion(myNickname)
        });

        setSelectedHint(null);
        setGuess('');
        loadHints(myNickname);
      } catch (err) {
        console.error(err);
        alert('Failed to record correct answer. Please try again.');
      }
    } else {
      alert('❌ Incorrect. Try again!');
      setGuess('');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-200 via-orange-100 to-white px-4">
        <div className="text-center text-orange-900">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-300 border-t-transparent"></div>
          <p className="text-sm font-semibold">Loading hints...</p>
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
            🎮 {eventCode} Matching Game
          </h1>
          <p className="mt-2 text-sm text-orange-900/80">
            My Nickname: <strong>{myNickname}</strong> | Matched: <strong>{myMatches.length} people</strong>
          </p>
        </header>

        {selectedHint ? (
          <section className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-orange-200 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-orange-900">
                💡 Hint Details #{selectedHint.order}
              </h2>
              <button
                onClick={() => setSelectedHint(null)}
                className="text-sm font-semibold text-orange-500 transition hover:text-orange-600"
              >
                ← Back to List
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <DetailRow
                label="H1. Did you have breakfast? What did you eat?"
                value={selectedHint.h1}
              />
              <DetailRow
                label="H2. Are you an introvert or an extrovert?"
                value={selectedHint.h2}
              />
              <DetailRow
                label="H3. Who's your celebrity crush?"
                value={selectedHint.h3}
              />
              <DetailRow
                label="H4. How many KOPLE trips have you joined?"
                value={selectedHint.h4}
              />
              <DetailRow
                label="H5. What color am I not wearing today?"
                value={selectedHint.h5}
              />
              <DetailRow
                label="H6. What's your second language (not your mother tongue)?"
                value={selectedHint.h6}
              />
              <DetailRow
                label="H7. What's the place in Korea you want to visit the most?"
                value={selectedHint.h7}
              />
              <DetailRow
                label="H8. Coffee person or matcha person?"
                value={selectedHint.h8}
              />
            </div>

            <div className="mt-8 rounded-2xl bg-orange-50 px-4 py-5">
              <label className="block text-sm font-semibold text-orange-900">
                Guess who this person is
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  className="w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-medium text-orange-900 shadow-sm outline-none ring-orange-400 transition focus:border-orange-400 focus:ring"
                  placeholder="Enter nickname"
                  onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                />
                <button
                  onClick={handleGuess}
                  className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 sm:w-auto"
                >
                  Confirm
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-orange-200 backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-orange-900">🎯 Participant Hint List</h2>
                <span className="text-sm font-semibold text-orange-500">
                  My Matches: {myMatches.length}
                </span>
              </div>

              {otherHints.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-orange-50 px-4 py-6 text-center text-sm text-orange-900/70">
                  No other participants yet. Share the link with your friends!
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
                          <h3 className="text-base font-semibold text-orange-900">
                            Participant #{hint.order}
                          </h3>
                          {matched && (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              ✓ Matched
                            </span>
                          )}
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-orange-900/80">
                          <div>🍳 {hint.h1}</div>
                          <div>🧭 {hint.h2}</div>
                          <div>🎬 {hint.h3}</div>
                        </div>
                        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-orange-400">
                          Click to view all hints →
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
          <h3 className="text-lg font-bold text-orange-900">📝 My Hints</h3>
          {myHintEntries.length === 0 ? (
            <p className="mt-4 text-sm text-orange-900/70">
              Don't see your hints? Please check if you completed the input on the home screen.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {myHintEntries.map((hint) => (
                <div key={hint.id} className="rounded-2xl bg-orange-50 px-4 py-4 text-sm text-orange-900">
                  <p className="text-xs font-semibold text-orange-500">Participant #{hint.order}</p>
                  <p>H1: {hint.h1}</p>
                  <p>H2: {hint.h2}</p>
                  <p>H3: {hint.h3}</p>
                  <p>H4: {hint.h4}</p>
                  <p>H5: {hint.h5}</p>
                  <p>H6: {hint.h6}</p>
                  <p>H7: {hint.h7}</p>
                  <p>H8: {hint.h8}</p>
                  <p className="mt-2 text-xs text-orange-900/70">
                    {hint.matchedBy.length} people matched me
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
      <div className="mt-1 text-orange-900/80">{value || 'No information'}</div>
    </div>
  );
}
