import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseAppletConfig from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  appId: firebaseAppletConfig.appId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
};

// Use the specific database ID from the config
const firestoreDatabaseId = firebaseAppletConfig.firestoreDatabaseId;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
