// Gameplay Result Page
// Route: /game/result

import React from "react";
import styles from "./page.module.css";
import ScoreBar from "./ScoreBar";
import NextButton from "@/app/game/result/NextButton";

export default function GameplayResult({}) {
  const guess = false;
  const points = 0


  return (
    <>
      <img src="/geouiuc_logo.png" alt="logo" className={styles.logo} />

      <div className={styles.resultContainer}>
      
        <h1>Round #</h1>
        <img src="/tempmap.png" alt="tempmap" className={styles.tempmap} />
    
        <div>
          {guess ? (
            <div>
              <h4>{points} points!</h4>
              <ScoreBar />  
             <b>Your guess was <strong>20</strong> from the correct location!</b>
            </div>
          ) : (
            <div>
              <h2>{points} points</h2>
              <ScoreBar />  
              <b>You never made a guess</b>
            </div>
          )}
        </div>
      <NextButton />

      </div>
    </>
  );
}

