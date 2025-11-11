"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";
import LoginButton from "../../components/LoginButton.js";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase-config";

// Move videos array outside component so it doesn't recreate on every render
const videos = [
  "/BGvideo1.mp4",
  "/BGvideo2.mp4",
  "/BGvideo3.mp4",
  "/BGvideo4.mp4",
  "/BGvideo5.mp4",
  "/BGvideo6.mp4",
  "/BGvideo7.mp4",
  "/BGvideo8.mp4",
  "/BGvideo9.mp4",
];

export default function Login() {
  useEffect(() => {
    // Set up the authentication state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in.
        // Get a reference to the user's document in the 'users' collection, using their UID as the document ID.
        const userRef = doc(db, "users", user.uid);

        // Define the template data for a new or existing user document.
        // Fields here will be either set (if document is new) or merged (if document exists).
        const templateUserData = {
          email: user.email,        // Essential Auth data, directly from the user object
          displayName: user.displayName,
          profilePicture: user.photoURL,

          // Application-specific fields with default "blank" values
          highScore: 0,
          totalPoints: 0,
          dailyStreak: 0,

          // Timestamps for metadata:
          // createdAt from Auth metadata, converted to Date object if available.
          createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : null,
          // lastSignInTime from Auth metadata, converted to Date object if available.
          lastSignInTime: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null,
          // lastActivity uses Firestore's serverTimestamp for an accurate, server-generated timestamp.
          lastActivity: serverTimestamp(),
        };

        try {
          // Use setDoc with { merge: true } to create the document if it doesn't exist,
          // or add/update only the specified fields if it does. This prevents overwriting existing data.
          await setDoc(userRef, templateUserData, { merge: true });
          console.log("User document created/updated (template applied) successfully for UID:", user.uid);

          // After successfully creating/updating the document, redirect the user.
          // This check prevents redirecting if they're already on /lobby (e.g., from a refresh).
          if (router.pathname === '/') {
            router.push("/lobby");
          }
        } catch (error) {
          console.error("Error applying template user document to Firestore:", error);
          // You might want to display an error message to the user here.
        }
      } else {
        // User is signed out.
        console.log("No user is signed in.");
        // If a user logs out, you might choose to redirect them to the login page here.
        // For example: if (router.pathname !== '/') router.push('/');
      }
    });

    // Clean up the listener when the component unmounts to prevent memory leaks.
    return () => unsubscribe();
  }, [router]); // The effect depends on the 'router' object.
  
  const router = useRouter();
  const handleLoginSuccess = () => {
      // This function is still called after signInWithGoogle,
      // but the actual redirection and Firestore update are now handled by the useEffect.
      // You can keep this console.log for debugging or remove the function if no other action is needed here.
      console.log("LoginButton clicked, authentication process initiated.");
    };
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(true);
  const videoARef = useRef(null);
  const videoBRef = useRef(null);

  useEffect(() => {
    const currentVideo = active ? videoARef.current : videoBRef.current;
    const nextVideo = active ? videoBRef.current : videoARef.current;
    
    if (!currentVideo || !nextVideo) return;
    
    let preloaded = false;

    const handleTimeUpdate = () => {
      // Preload next video 2 seconds before current ends
      if (!preloaded && currentVideo.duration - currentVideo.currentTime < 2) {
        const nextIndex = (index + 1) % videos.length;
        nextVideo.src = videos[nextIndex];
        nextVideo.load(); // starts prebuffering
        preloaded = true;
      }
    };

    const handleEnded = async () => {
      try {
        await nextVideo.play(); // should already be buffered
        setActive((prev) => !prev);
        setIndex((prev) => (prev + 1) % videos.length);
      } catch (err) {
        console.error("Playback failed:", err);
      }
    };

    currentVideo.addEventListener("timeupdate", handleTimeUpdate);
    currentVideo.addEventListener("ended", handleEnded);

    return () => {
      currentVideo.removeEventListener("timeupdate", handleTimeUpdate);
      currentVideo.removeEventListener("ended", handleEnded);
    };
  }, [index, active]); // Only index and active - NOT videos

  return (
    <div className={styles.App}>
      <div className={styles.videoBackground}>
        <video
          ref={videoARef}
          src={videos[0]}
          autoPlay
          muted
          playsInline
          style={{ display: active ? "block" : "none" }}
        />
        <video
          ref={videoBRef}
          muted
          playsInline
          style={{ display: active ? "none" : "block" }}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.rectangleWrapper}>
          <header className={styles["App-header"]}>
            <p className={styles["App-para"]}>Welcome to</p>
            <img
              src="/geouiuc_logo.png"
              className={styles["App-logo"]}
              alt="logo"
            />
            <LoginButton onLoginSuccess={handleLoginSuccess} />
          </header>
        </div>
      </div>
    </div>
  );
}