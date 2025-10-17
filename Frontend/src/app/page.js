// Home Page
// Route: /
import React, { usestate } from "react";
import styles from "./page.module.css";
import SettingsModal from "@/components/SettingsModal";

function startButton() {
  const handleClick = () => {
    // window.location.href = "/new-page"; // goes to game page to begin or login page
  }
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

        <button className={styles['start-button']}> 
        {/* need to add onClick function here */}
          <div className={styles['button-text']}>Start!</div>
        </button>
      </div>
      <SettingsModal />
    </div>
  );
}