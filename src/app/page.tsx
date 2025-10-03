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
  const [hints, setHints] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [loginError, setLoginError] = useState("");

  const hintLabels = [
    "H1. Favorite music genre",
    "H2. Favorite sport/team",
    "H3. Favorite exclamation/emoji",
    "H4. Color NOT in my outfit today",
    "H5. Phone case color/pattern",
    "H6. Name initials",
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
        h5: hints[4],
        h6: hints[5],
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
    <div className="min-h-screen bg-gradient-to-b from-orange-200 via-orange-100 to-white px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="text-center text-white drop-shadow-sm">
          <p className="mx-auto inline-flex items-center rounded-full bg-white/30 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-orange-900 backdrop-blur">
            Matching Success!
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-orange-900">
            🎮 Join the Matching Game
          </h1>
          <p className="mt-2 text-sm text-orange-900/80">
            Enter the event code and leave hints so your friends can guess who you are.
          </p>
        </header>

        <div className="rounded-full bg-white/60 p-1 shadow-md ring-1 ring-orange-200 backdrop-blur">
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
                  ? "bg-orange-500 text-white shadow"
                  : "text-orange-500 hover:bg-white"
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
                  ? "bg-orange-500 text-white shadow"
                  : "text-orange-500 hover:bg-white"
              }`}
            >
              Login
            </button>
          </div>
        </div>

        <form
          onSubmit={isJoinMode ? handleSubmit : handleLogin}
          className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-orange-200 backdrop-blur"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-orange-900">
                Event Code
              </label>
              <input
                type="text"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-medium text-orange-900 shadow-sm outline-none ring-orange-400 transition focus:border-orange-400 focus:ring"
                placeholder="e.g., TEST2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-orange-900">
                Nickname (visible to others)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-medium text-orange-900 shadow-sm outline-none ring-orange-400 transition focus:border-orange-400 focus:ring"
                placeholder="e.g., John Doe"
                required
              />
            </div>
          </div>

          {isJoinMode ? (
            <>
              <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-orange-200 to-transparent" />

              <div className="space-y-4">
                <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-900">
                  Hints help other participants guess who you are. Make them fun
                  and specific!
                </div>

                <h2 className="text-lg font-bold text-orange-900">
                  💡 Enter Your Hints
                </h2>

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
                      placeholder={`Enter hint ${index + 1}`}
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
                {loading ? "Saving..." : "Submit Hints & Start Game"}
              </button>
            </>
          ) : (
            <>
              {loginError && (
                <div className="mt-6 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="mt-8 w-full rounded-xl bg-orange-500 px-4 py-3 text-base font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
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
