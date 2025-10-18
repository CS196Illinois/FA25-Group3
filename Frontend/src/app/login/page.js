"use client";

import styles from "./page.module.css";
import LoginButton from "../../components/LoginButton.js";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push("/game"); // redirect to /game after login
  };

  return (
    <div className={styles.App}>
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
  );
}
