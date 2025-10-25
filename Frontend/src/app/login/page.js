"use client";

import styles from "./page.module.css";
import LoginButton from "../../components/LoginButton.js";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push("/lobby"); 
  };

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
      <div className={styles.content}>
    <div className={styles.rectangleWrapper}>
      <header className={styles["App-header"]}>
        <p className={styles["App-para"]}>Welcome to</p>
        <img src="/geouiuc_logo.png" className={styles["App-logo"]} alt="logo" /> 
        <LoginButton onLoginSuccess={handleLoginSuccess} />
      </header>
    </div>
    </div>
    </div>
  );
}
