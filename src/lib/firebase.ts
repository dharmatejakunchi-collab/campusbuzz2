import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, getFirestore as getFirestoreWithDb, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

const env: Record<string, string | undefined> = 
  typeof import.meta !== 'undefined' && (import.meta as any).env 
    ? (import.meta as any).env 
    : (typeof process !== 'undefined' && process.env ? process.env : {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId,
  measurementId: (env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigData.measurementId) || undefined
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const customDbId = env.VITE_FIRESTORE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId;

// Specify custom database ID if available
export const db = (customDbId && customDbId.trim() !== '' && customDbId !== '(default)')
  ? getFirestoreWithDb(app, customDbId)
  : (customDbId && customDbId.trim() !== '' ? getFirestore(app, customDbId) : getFirestore(app));

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Validate connection to Firestore as mandated by the Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

let isSigningIn = false;

export const signInWithGoogle = async () => {
  if (isSigningIn) {
    return null;
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.message?.includes('cancelled-popup-request') ||
      error?.message?.includes('popup-closed-by-user')
    ) {
      // User closed popup or a pending popup request was replaced
      return null;
    }
    console.error("Google sign-in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logoutFirebase = async () => {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
  }
};
