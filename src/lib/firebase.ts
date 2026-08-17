import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCoRcNPSkQVi3x5vASXt18EjrVzAoG0mps",
  authDomain: "time-chi-4ba8d.firebaseapp.com",
  projectId: "time-chi-4ba8d",
  storageBucket: "time-chi-4ba8d.firebasestorage.app",
  messagingSenderId: "69492706736",
  appId: "1:69492706736:web:682f6e1d27896a7bb21a75",
  measurementId: "G-1980RVK8LN"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    db = getFirestore(app);
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

export { app, db };
export const isFirebaseInitialized = () => !!db;
