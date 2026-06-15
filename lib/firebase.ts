import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize Firebase when the API key is present.
// During `next build` without .env.local the keys are undefined — all Firebase
// usage happens inside useEffect (browser-only), so the null cast is safe.
function buildApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey) return null;
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

const app = buildApp();

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

export function getSafeDb(): Firestore {
  if (!db) throw new Error("Firestore not initialized. Check your environment variables.");
  return db;
}

export function getSafeAuth(): Auth {
  if (!auth) throw new Error("Auth not initialized. Check your environment variables.");
  return auth;
}

export function getSafeDb(): Firestore {
  if (!db) throw new Error("Firestore is not initialized. Check your environment variables.");
  return db;
}
