"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";
import LoginButton from "../../components/LoginButton.js";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../components/firebase-config";

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
  const router = useRouter();
  useEffect(() => {
    // Set up the authentication state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in.
        const userRef = doc(db, "users", user.uid);
        let dataToUpdate = {}; // This object will store what we eventually write

        try {
          // --- 1. Fetch current user data from Firestore ---
          const docSnap = await getDoc(userRef);
          const existingData = docSnap.exists() ? docSnap.data() : {};

          // --- 2. Prepare base user data and ensure defaults for non-streak fields ---
          // Essential Auth data (always update/set)
          dataToUpdate = {
            email: user.email,
            displayName: user.displayName,
            profilePicture: user.photoURL,
            userID: user.uid,
            createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : null,
          };

          // Application-specific fields: preserve if they exist, otherwise set default.
          // Using nullish coalescing operator (??) for this.
          dataToUpdate.highScore = existingData.highScore ?? 0;
          dataToUpdate.totalPoints = existingData.totalPoints ?? 0;
          dataToUpdate.recentScores = existingData.recentScores ?? [0, 0, 0, 0, 0];
          // *** The 'bio' field is intentionally omitted here as requested ***

          // --- 3. Implement Daily Streak Logic (Client-Side) ---
          let newDailyStreak = existingData.dailyStreak ?? 0; // Initialize with existing streak or 0
          // existingData.lastLoginDate will be a Firestore Timestamp object if it exists
          let currentLastLoginDateTimestamp = existingData.lastLoginDate;
          let newLastLoginDate = serverTimestamp(); // Mark the current login time with a server-generated timestamp

          // Convert the stored Firestore Timestamp to a JavaScript Date object for client-side comparison
          const lastLoginDateAsDate = currentLastLoginDateTimestamp ? currentLastLoginDateTimestamp.toDate() : null;

          // Normalize dates to the start of the day for accurate comparison (using local time zone)
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const yesterdayStart = new Date(todayStart);
          yesterdayStart.setDate(todayStart.getDate() - 1); // Subtract 1 day
          const twoDaysAgoStart = new Date(todayStart);
          twoDaysAgoStart.setDate(todayStart.getDate() - 2); // Subtract 2 days

          if (!lastLoginDateAsDate) {
            // First ever login for this user, or 'lastLoginDate' was never set. Start streak at 1.
            newDailyStreak = 1;
          } else if (lastLoginDateAsDate.getTime() >= todayStart.getTime()) {
            // User has already logged in today (or performed the streak-eligible action today).
            // Do not increment streak. Keep current streak and the original lastLoginDate timestamp.
            newDailyStreak = existingData.dailyStreak; // Preserve the current streak count
            newLastLoginDate = currentLastLoginDateTimestamp; // Preserve original timestamp for today's login
          } else if (lastLoginDateAsDate.getTime() >= yesterdayStart.getTime()) {
            // User logged in yesterday. Streak continues! Increment streak by 1.
            newDailyStreak += 1;
          } else {
            // User did not log in yesterday (last login was 2 or more days ago). Streak broken, reset to 1.
            newDailyStreak = 1;
          }

          // Add the calculated streak and lastLoginDate to the data to be updated
          dataToUpdate.dailyStreak = newDailyStreak;
          dataToUpdate.lastLoginDate = newLastLoginDate;

          // --- 4. Write/Update User Document to Firestore ---
          // The { merge: true } option is crucial here. It will:
          // - Add new fields (like lastLoginDate if it doesn't exist).
          // - Update existing fields with the new values provided (like dailyStreak).
          // - Leave other existing fields untouched if not specified in dataToUpdate.
          await setDoc(userRef, dataToUpdate, { merge: true });
          console.log("User document updated (defaults + streak applied) successfully for UID:", user.uid);

          // Redirect to lobby after successful login and data update
          if (router.pathname === "/") {
            router.push("/lobby");
          }
        } catch (error) {
          console.error("Error updating user document with streak logic:", error);
        }
      } else {
        console.log("No user is signed in.");
      }
    });

    return () => unsubscribe();
  }, [router]); // router is a dependency because it's used inside useEffect

  const handleLoginSuccess = () => {
    // This function is still called after signInWithGoogle,
    // but the actual redirection and Firestore update are now handled by the useEffect.
    // You can keep this console.log for debugging or remove the function if no other action is needed here.
    console.log("LoginButton clicked, authentication process initiated.");
    router.push("/lobby");
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
