"use client";

import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import signInWithGoogle  from "@/components/firebase-config";
import { useState, useRef, useEffect } from "react";

function StartButton() {
  const router = useRouter();

  return (
    <button
      className={styles.startButton}
      onClick={() => router.push("/game")}
    >
      <div className={styles.buttonText}>Start Game!</div>
    </button>
  );
}

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

export default function Lobby() {
  const router = useRouter();
  const handleLoginSuccess = () => router.push("/lobby");

  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(true);
  const videoARef = useRef(null);
  const videoBRef = useRef(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("name");
      if (storedName) setName(storedName);
    }
  }, []);

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
        <header className={styles["App-header"]}>
          <div className={styles.profile}>
            <p className={styles["profile-para"]}>Hi, {name ? name : "Guest"}!</p>
            <button 
              className={styles.profileButton}
              onClick={() => router.push("/profile")}
            >
              <img
                src="/profile-icon.png"
                className={styles.profileImage}
                alt="profile"
              />
            </button>
          </div>
          
          <div className={styles["score"]}>
            <img
              src="/trophy.png"
              className={styles["trophy"]}
              alt="trophy"
            />
            <span>2100</span>
          </div>

          <img
            src="/upscaled_logo.png"
            className={styles["App-logo"]}
            alt="logo"
          />

          <p className={styles["App-para"]}>Game Mode: Outdoor</p>
        </header>
        <div className={styles.logoContainer}>
        <StartButton />
      </div>
      </div>

      
    </div>
  );
}