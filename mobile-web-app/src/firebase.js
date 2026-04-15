// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxa02bZ0KPPRwdoFqvUaCX5pmFAthXi0g",
  authDomain: "bulk-meter.firebaseapp.com",
  projectId: "bulk-meter",
  storageBucket: "bulk-meter.firebasestorage.app",
  messagingSenderId: "619042314409",
  appId: "1:619042314409:web:d0332127b05f4b7c7c31b8",
  measurementId: "G-ERZWM58022"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db, analytics };