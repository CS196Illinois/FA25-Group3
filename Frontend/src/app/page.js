// Home Page
// Route: /
"use client"

import styles from "./page.module.css";
import SettingsModal from "@/components/SettingsModal";
import Button from "../components/Button";
import Link from "next/link";
import React from "react";

function StartButton() {
  return (
    <Link href="/login">
      <button className={styles['start-button']}>
        <div className={styles['button-text']}>Start!</div>
      </button>
    </Link>
  );
}


export default function Home() {
  return (
    <div className={styles['container-with-background']}>
      <div className={styles['text-container1']}>
        <div className={styles['welcome-player-text']}>Welcome Player 1!</div>

        <div className={styles['logo-container']}>
          <div className={styles['logo']}></div>
        </div>

        <div className={styles['text-container2']}>
          <div className={styles['explore-uiuc-text']}>EXPLORE URBANA-CHAMPAIGN!</div>
        </div>
        <div className={styles['logo-container']}>
          <StartButton />
        </div>
      </div>
      <SettingsModal />
    </div>
  );
}