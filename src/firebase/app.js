// Firebase app bootstrap. Config comes from Vite env vars (.env). The web config is public by design;
// access is controlled by firestore.rules and storage.rules. Analytics is intentionally not loaded.
import { initializeApp, getApps, getApp } from 'firebase/app';

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const adminEmail = (env.VITE_ADMIN_EMAIL || '').toLowerCase();

/** True when the env vars are present. The static site still works without Firebase. */
export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = firebaseReady ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
