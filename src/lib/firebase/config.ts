import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB7mM1msf7OWIDnDuQwIGAAiBjOpA5XF80",
  authDomain: "kople-game-web.firebaseapp.com",
  projectId: "kople-game-web",
  storageBucket: "kople-game-web.firebasestorage.app",
  messagingSenderId: "377186444737",
  appId: "1:377186444737:web:000d6e3b5d0950d31afb40",
  measurementId: "G-GCXKGYRC7D",
};

// Initialize Firebase only once
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Initialize Analytics (only in browser and production)
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

// Connect to emulators in development (commented out for production use)
// if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
//   try {
//     // Only connect if not already connected
//     if (!auth.emulatorURL) {
//       connectAuthEmulator(auth, 'http://localhost:9099');
//     }
//     if (!db._delegate._databaseId?.projectId?.includes('demo-')) {
//       connectFirestoreEmulator(db, 'localhost', 8080);
//     }
//     if (!functions.emulator) {
//       connectFunctionsEmulator(functions, 'localhost', 5001);
//     }
//   } catch (error) {
//     // Emulators might already be connected
//     console.log('Firebase emulators connection status:', error);
//   }
// }

export default app;
