// Settings Modal
// No Route, works like a pop-up instead
"use client";
import { useState } from "react";
import styles from "./SettingsModal.module.css"
export default function SettingsModal() {
  // useState allows the variable to be changed (i.e. allows the user to close/open menu)
  // use "open" to read the state and "setOpen" to set the state, false (closed) by default
  const [open, setOpen] = useState(false);
  const [effectVolume, setEffectVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(50);
  // change this stuff below, this is just so we have a way to actually open the settings for now
  return (
    <>
      <button onClick={() => setOpen(true)}>⚙️ Settings</button>
      {open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Settings</h2>
            <button onClick={() => setOpen(false)}>Close</button>
            {/* Effect Volume Slider */}
            <div className={styles.sliderContainer}>
              <label>Effect Volume: {effectVolume}%</label>
              <input 
                type="range"
                min="0"
                max="100"
                value={effectVolume}
                onChange={(e) => setEffectVolume(e.target.value)}
              />
              </div>
            {/* Music Volume Slider */}
            <div className={styles.sliderContainer}>
              <label>Music Volume: {musicVolume}%</label>
              <input 
                type="range"
                min="0"
                max="100"
                value={musicVolume}
                onChange={(e) => setMusicVolume(e.target.value)}
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
}
