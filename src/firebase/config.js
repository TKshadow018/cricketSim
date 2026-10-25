import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { isDebugAuthBypassEnabled } from '../utils/runtimeFlags';

const readConfig = (key, fallback) => (process.env[key] || '').trim() || fallback;

const firebaseConfig = {
  apiKey: readConfig('REACT_APP_FIREBASE_API_KEY', ''), // HIDDEN FOR SECURITY REASON
  authDomain: readConfig('REACT_APP_FIREBASE_AUTH_DOMAIN', 'cricketsim-6b8de.firebaseapp.com'),
  projectId: readConfig('REACT_APP_FIREBASE_PROJECT_ID', 'cricketsim-6b8de'),
  storageBucket: readConfig('REACT_APP_FIREBASE_STORAGE_BUCKET', 'cricketsim-6b8de.firebasestorage.app'),
  messagingSenderId: readConfig('REACT_APP_FIREBASE_MESSAGING_SENDER_ID', '992325580149'),
  appId: readConfig('REACT_APP_FIREBASE_APP_ID', '1:992325580149:web:1413ba6281dbed12d3cf3c'),
  measurementId: readConfig('REACT_APP_FIREBASE_MEASUREMENT_ID', ''), // HIDDEN FOR SECURITY REASON
};

const missingFirebaseConfig = ['apiKey', 'projectId', 'appId'].filter((key) => !firebaseConfig[key]);

if (!isDebugAuthBypassEnabled && missingFirebaseConfig.length > 0) {
  throw new Error(
    `Firebase configuration is missing ${missingFirebaseConfig.join(', ')}. ` +
    'Set the corresponding REACT_APP_FIREBASE_* values in .env, or enable REACT_APP_DEBUG=true for local development.'
  );
}

const app = isDebugAuthBypassEnabled ? null : initializeApp(firebaseConfig);

let analytics = null;

if (app && typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export { analytics };
