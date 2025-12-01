import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBcRa1cVjqOW3volcaz3hXtaa6QGfe6aSk",
  authDomain: "tester-d6c79.firebaseapp.com",
  projectId: "tester-d6c79",
  storageBucket: "tester-d6c79.firebasestorage.app",
  messagingSenderId: "580009478973",
  appId: "1:580009478973:web:e1c492b1e2a81ad8a21354",
  measurementId: "G-58ZM2DG2XE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
        const result = await signInWithPopup(auth, provider);
        const name = result.user.displayName;
        const email = result.user.email;
        const profilePic = result.user.photoURL;

        localStorage.setItem("name", name);
        localStorage.setItem("email", email);
        localStorage.setItem("profilePic", profilePic);
    } catch (error) {
        console.log(error);
    }
};
