"use client";

import styles from "../lobby/page.module.css";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function Lobby() {
    return (
    
    <div className={styles.App}>
      <div className={styles.videoBackground}>
        <iframe
        src="https://www.youtube.com/embed/GlwWQ8KoEbg?autoplay=1&mute=1&loop=1&playlist=GlwWQ8KoEbg&controls=0&modestbranding=1&showinfo=0&rel=0&enablejsapi=1"
        title="Background Video"
        frameBorder="0"
        allow="autoplay; fullscreen"
        allowFullScreen
        playsInline
      ></iframe>

      </div>
      <div className={styles.logoContainer}>
          <StartButton />
        </div>
    </div>
    );
}