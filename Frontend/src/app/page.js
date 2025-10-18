// Home Page
// Route: /
"use client"
import React, { usestate } from "react";
import styles from "./page.module.css";
import SettingsModal from "@/components/SettingsModal";
import Button from "../components/Button";
import Link from "next/link";

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

        {/* Original Start Button */}
        <div className={styles['logo-container']}>
          <StartButton />
        </div>
        {/* 10 Component Buttons
        <div className={styles['button-grid']}>
          <Button 
            variant="primary" 
            size="medium" 
            onClick={() => console.log('Primary clicked')}
          >
            Primary
          </Button>

          <Button 
            variant="secondary" 
            size="medium" 
            onClick={() => console.log('Secondary clicked')}
          >
            Secondary
          </Button>

          <Button 
            variant="success" 
            size="medium" 
            onClick={() => console.log('Success clicked')}
          >
            Success
          </Button>

          <Button 
            variant="danger" 
            size="medium" 
            onClick={() => console.log('Danger clicked')}
          >
            Danger
          </Button>

          <Button 
            variant="warning" 
            size="medium" 
            onClick={() => console.log('Warning clicked')}
          >
            Warning
          </Button>

          <Button 
            variant="info" 
            size="medium" 
            onClick={() => console.log('Info clicked')}
          >
            Info
          </Button>

          <Button 
            variant="light" 
            size="medium" 
            onClick={() => console.log('Light clicked')}
          >
            Light
          </Button>

          <Button 
            variant="dark" 
            size="medium" 
            onClick={() => console.log('Dark clicked')}
          >
            Dark
          </Button>

          <Button 
            variant="purple" 
            size="medium" 
            onClick={() => console.log('Purple clicked')}
          >
            Purple
          </Button>

          <Button 
            variant="teal" 
            size="medium" 
            onClick={() => console.log('Teal clicked')}
          >
            Teal
          </Button> */}
        {/* </div> */}
      </div>
      <SettingsModal />
    </div>
  );
}