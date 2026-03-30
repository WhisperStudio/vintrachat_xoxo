import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACOy6kYZk53gDkbTO9oqxDIAw7DU8mBi8",
  authDomain: "vintrasolutions-f58a7.firebaseapp.com",
  projectId: "vintrasolutions-f58a7",
  storageBucket: "vintrasolutions-f58a7.firebasestorage.app",
  messagingSenderId: "474220063641",
  appId: "1:474220063641:web:c3a00a9b2912254b360108",
  measurementId: "G-130FHQ5Y4E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics - only initialize on client side
let analytics: any = null;
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  });
}

export { app, auth, db, analytics };
