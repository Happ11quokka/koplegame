"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function HomePage() {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"join" | "login">("join");
  const [eventCode, setEventCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [hints, setHints] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [loginError, setLoginError] = useState("");

  const hintLabels = [
    "H1. What's your outfit concept today?",
    "H2. Which part of your appearance are you most confident about?",
    "H3. What color is your top?",
    "H4. Who did you come with? Describe the friend you came with.",
  ];

  const handleHintChange = (index: number, value: string) => {
    const newHints = [...hints];
    newHints[index] = value;
    setHints(newHints);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEventCode = eventCode.trim().toUpperCase();
    const cleanedNickname = nickname.trim();

    try {
      const eventsRef = collection(db, "events");
      const eventQuery = query(
        eventsRef,
        where("code", "==", normalizedEventCode)
      );
      const querySnapshot = await getDocs(eventQuery);

      if (querySnapshot.empty) {
        setError("Event code not found");
        return;
      }

      const eventDoc = querySnapshot.docs[0];
      const eventId = eventDoc.id;
      const hintsRef = collection(db, `events/${eventId}/hints`);

      const existingNickSnapshot = await getDocs(
        query(hintsRef, where("nickname", "==", cleanedNickname))
      );
      if (!existingNickSnapshot.empty) {
        setError(
          'This nickname is already registered. Please use the "Login" tab below.'
        );
        return;
      }

      await addDoc(hintsRef, {
        nickname: cleanedNickname,
        h1: hints[0],
        h2: hints[1],
        h3: hints[2],
        h4: hints[3],
        createdAt: new Date(),
        matchedBy: [],
      });

      localStorage.setItem("myNickname", cleanedNickname);
      router.push(`/event/${normalizedEventCode}`);
    } catch (err) {
      console.error(err);
      setError("Failed to save hints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");

    const normalizedEventCode = eventCode.trim().toUpperCase();
    const cleanedNickname = nickname.trim();

    if (!normalizedEventCode || !cleanedNickname) {
      setLoginError("Please enter both event code and nickname.");
      setLoggingIn(false);
      return;
    }

    try {
      const eventsRef = collection(db, "events");
      const eventQuery = query(
        eventsRef,
        where("code", "==", normalizedEventCode)
      );
      const querySnapshot = await getDocs(eventQuery);

      if (querySnapshot.empty) {
        setLoginError("Event code not found.");
        return;
      }

      const eventDoc = querySnapshot.docs[0];
      const eventId = eventDoc.id;
      const hintsRef = collection(db, `events/${eventId}/hints`);

      const nicknameQuery = query(
        hintsRef,
        where("nickname", "==", cleanedNickname)
      );
      const nicknameSnapshot = await getDocs(nicknameQuery);

      let matchedNickname = cleanedNickname;
      if (nicknameSnapshot.empty) {
        const allHintsSnapshot = await getDocs(hintsRef);
        const fallbackDoc = allHintsSnapshot.docs.find((doc) => {
          const value = (doc.data().nickname as string) || "";
          return value.trim().toLowerCase() === cleanedNickname.toLowerCase();
        });

        if (!fallbackDoc) {
          setLoginError(
            "Nickname not found. Please check spelling and capitalization."
          );
          return;
        }

        matchedNickname = (fallbackDoc.data().nickname as string).trim();
      }

      localStorage.setItem("myNickname", matchedNickname);
      router.push(`/event/${normalizedEventCode}`);
    } catch (err) {
      console.error(err);
      setLoginError("Login failed. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const isJoinMode = formMode === "join";

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="text-center text-white drop-shadow-sm">
          <p className="mx-auto inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-amber-200 backdrop-blur">
            Matching Success!
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-amber-200">
            🎮 Join the Matching Game
          </h1>
          <p className="mt-2 text-sm text-amber-100/80">
            👹 <strong>Find Your Demon Match</strong>
          </p>
          <p className="mt-2 text-sm text-amber-100/80">
            🌙 <strong>The Story</strong>
            <br />
            Somewhere in the crowd, your mystery match awaits — maybe a mischievous Dokkaebi, a charming Gumiho, or a bold Reaper.
          </p>
          <p className="mt-2 text-sm text-amber-100/80">
            You&apos;ll receive short clues throughout the night to help you find them! Clues may sound like:
          </p>
          <ul className="list-disc list-inside mt-1 text-sm text-amber-100/80">
            <li>&ldquo;I&apos;m wearing something red.&rdquo;</li>
            <li>&ldquo;I&apos;m obsessed with K-pop.&rdquo;</li>
            <li>&ldquo;I came from Taiwan.&rdquo;</li>
          </ul>

          <p className="mt-4 text-sm text-amber-100/80">
            🔢 <strong>The Rule</strong>
            <br />
            The person you need to find is your next number! If your card says #1, find #2. If you&apos;re #13, find #14 — and so on.
          </p>
          <p className="mt-2 text-sm text-amber-100/80">
            (If you&apos;re the last number, your match loops back to #1!) 🔁
          </p>

          <p className="mt-4 text-sm text-amber-100/80">
            🔮 <strong>The Mission</strong>
          </p>
          <ol className="list-decimal list-inside mt-1 space-y-1 text-sm text-amber-100/80">
            <li>Find your hidden match before the night ends.</li>
            <li>Take a photo together at the party.</li>
            <li>Send it to the KOPLE team to complete your quest!</li>
          </ol>

          <p className="mt-4 text-sm text-amber-100/80">
            ✨ <strong>Remember</strong>
          </p>
          <ul className="list-disc list-inside mt-1 text-sm text-amber-100/80">
            <li>No winners, no losers — just fun connections.</li>
            <li>Follow the hints, enjoy the music, and let the night spirits guide you.</li>
          </ul>

          <p className="mt-4 text-sm text-amber-100/80">
            👉 By midnight, you might not just find your match — you&apos;ll become part of the K-Demon legend. 👁️‍🔥
          </p>
        </header>

        <div className="rounded-full bg-purple-950/40 p-1 shadow-md ring-1 ring-amber-500/40 backdrop-blur">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                setFormMode("join");
                setError("");
                setLoginError("");
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isJoinMode
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                  : "text-amber-200 hover:bg-amber-500/10"
              }`}
            >
              New Registration
            </button>
            <button
              type="button"
              onClick={() => {
                setFormMode("login");
                setError("");
                setLoginError("");
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                !isJoinMode
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                  : "text-amber-200 hover:bg-amber-500/10"
              }`}
            >
              Login
            </button>
          </div>
        </div>

        <form
          onSubmit={isJoinMode ? handleSubmit : handleLogin}
          className="rounded-3xl bg-purple-950/60 p-6 shadow-xl ring-1 ring-amber-500/30 backdrop-blur"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-amber-100">
                Event Code
              </label>
              <input
                type="text"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                className="mt-2 w-full rounded-xl border border-amber-500/40 bg-gray-900/60 px-4 py-3 text-sm font-medium text-amber-100 shadow-sm outline-none ring-amber-500 transition focus:border-amber-500 focus:ring"
                placeholder="e.g., TEST2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-100">
                Write your name without the surname — that’s the name people
                will guess
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-2 w-full rounded-xl border border-amber-500/40 bg-gray-900/60 px-4 py-3 text-sm font-medium text-amber-100 shadow-sm outline-none ring-amber-500 transition focus:border-amber-500 focus:ring"
                placeholder="e.g., John Doe"
                required
              />
            </div>
          </div>

          {isJoinMode ? (
            <>
              <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

              <div className="space-y-4">
                <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Hints help other participants guess who you are. Make them fun
                  and specific!
                </div>

                <h2 className="text-lg font-bold text-amber-100">
                  💡 Enter Your Hints
                </h2>

                {hintLabels.map((label, index) => (
                  <div key={label}>
                    <label className="block text-sm font-semibold text-amber-100">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={hints[index]}
                      onChange={(e) => handleHintChange(index, e.target.value)}
                      className="mt-2 w-full rounded-xl border border-amber-500/40 bg-gray-900/60 px-4 py-3 text-sm font-medium text-amber-100 shadow-sm outline-none ring-amber-500 transition focus:border-amber-500 focus:ring"
                      placeholder={`Enter hint ${index + 1}`}
                      required
                    />
                  </div>
                ))}

                {error && (
                  <div className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200">
                    {error}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-8 w-full rounded-xl bg-amber-500 px-4 py-3 text-base font-bold text-black shadow-lg shadow-amber-500/30 transition hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : "Submit Hints & Start Game"}
              </button>
            </>
          ) : (
            <>
              {loginError && (
                <div className="mt-6 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="mt-8 w-full rounded-xl bg-amber-500 px-4 py-3 text-base font-bold text-black shadow-lg shadow-amber-500/30 transition hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingIn ? "Verifying..." : "Login & Go to Game"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
