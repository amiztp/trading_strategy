import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseAppletConfig from '../firebase-applet-config.json';

// Use environment variables if available (for Vercel), otherwise fallback to the applet config
const getEnv = (key: string, fallback: string) => {
  const val = import.meta.env[key];
  return (val && val.trim() !== "") ? val : fallback;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', firebaseAppletConfig.apiKey),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', firebaseAppletConfig.authDomain),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', firebaseAppletConfig.projectId),
  appId: getEnv('VITE_FIREBASE_APP_ID', firebaseAppletConfig.appId),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', firebaseAppletConfig.storageBucket),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', firebaseAppletConfig.messagingSenderId),
};

const firestoreDatabaseId = getEnv('VITE_FIREBASE_FIRESTORE_DATABASE_ID', firebaseAppletConfig.firestoreDatabaseId);

console.log("Initializing Firestore with Database ID:", firestoreDatabaseId);

// Initialize Firebase SDK
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
