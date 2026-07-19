import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// Server-only. Never import this from a Client Component — it holds a
// privileged service-account credential that bypasses firestore.rules.
function buildAdminApp(): App | null {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) return null;

  return getApps().length === 0
    ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
    : getApps()[0];
}

const adminApp = buildAdminApp();

export function getAdminAuth(): Auth {
  if (!adminApp) throw new Error('Firebase Admin is not configured. Check FIREBASE_ADMIN_* env vars.');
  return getAuth(adminApp);
}

export function getAdminDb(): Firestore {
  if (!adminApp) throw new Error('Firebase Admin is not configured. Check FIREBASE_ADMIN_* env vars.');
  return getFirestore(adminApp);
}
