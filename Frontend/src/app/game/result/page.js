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
    <div style={styles}>
      <h1>Round #</h1>
      
      <img src="logo.png" alt="logo" />
  
      <div>
        {guess ? (
          <div>
              <h2>{points} points!</h2>
              <ScoreBar /> 
              <p>Your guess was <strong>__</strong> from the correct location!</p>
          </div>
          ) : (
            <div>
              <h2>{points} points</h2>
              <ScoreBar /> 
              <p>You never made a guess</p>
            </div>
          )}
        </div>


      <NextButton />
      
    

    </div>
  );
}

