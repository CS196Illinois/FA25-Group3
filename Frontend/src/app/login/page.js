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
        const userRef = doc(db, "users", user.uid);

        // Define the template data for a new or existing user document.
        const templateUserData = {
          // Essential Auth data, directly from the user object
          email: user.email,
          displayName: user.displayName,
          // profilePicture is already here, pulling from user.photoURL
          profilePicture: user.photoURL,

          // Application-specific fields with default "blank" values
          highScore: 0,
          totalPoints: 0,
          dailyStreak: 0,

          // New fields as requested:
          bio: "", // Initialize bio as an empty string
          recentScores: [0, 0, 0, 0, 0], // Array of 5 individual ints initialized to 0
          userID: user.uid, // Store the user's UID explicitly

          // Timestamps for metadata:
          createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : null,
        };

        try {
          await setDoc(userRef, templateUserData, { merge: true });
          console.log("User document created/updated (template applied) successfully for UID:", user.uid);

          if (router.pathname === '/') {
            router.push("/lobby");
          }
        } catch (error) {
          console.error("Error applying template user document to Firestore:", error);
        }
      } else {
        console.log("No user is signed in.");
      }
    });

    return () => unsubscribe();
  }, [router]);
  
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