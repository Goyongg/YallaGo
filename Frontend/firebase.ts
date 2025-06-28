import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDl2_V3kRnDaJsfO7ntJa94QduYksIMTOM",
  authDomain: "yallago-app-e3745.firebaseapp.com",
  projectId: "yallago-app-e3745",
  storageBucket: "yallago-app-e3745.firebasestorage.app",
  messagingSenderId: "176562167473",
  appId: "1:176562167473:web:bd43dc0b5b126080004c90",
  measurementId: "G-Z1FPQ4XB1Z"
};

// Initialize app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };