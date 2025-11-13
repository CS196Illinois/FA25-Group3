// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// src/firebase.js (or utils/firebase.js)

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // If you need RTDB
import { getAuth } from "firebase/auth"; // <-- ADD THIS
import { getFunctions } from "firebase/functions"; // <-- ADD THIS

// import { getAuth } from "firebase/auth"; // If you need Auth


const firebaseConfig = {
  apiKey: "AIzaSyBcRa1cVjqOW3volcaz3hXtaa6QGfe6aSk",
  authDomain: "tester-d6c79.firebaseapp.com",
  databaseURL: "https://tester-d6c79-default-rtdb.firebaseio.com",
  projectId: "tester-d6c79",
  storageBucket: "tester-d6c79.firebasestorage.app",
  messagingSenderId: "580009478973",
  appId: "1:580009478973:web:3e48b6706b7e9558a21354",
  measurementId: "G-V7BL73R2RB"
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);

// Export the initialized app instance and any services you need globally
// export const auth = getAuth(app); // Export auth if needed
// Get service instances
export const database = getDatabase(app);
export const auth = getAuth(app); // <-- EXPORT AUTH
export const functions = getFunctions(app); // <-- EXPORT FUNCTIONS
// You can also export the 'app' itself if you need to initialize other services later
export { app };