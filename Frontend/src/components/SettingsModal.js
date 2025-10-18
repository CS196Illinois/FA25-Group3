// Settings Modal
// No Route, works like a pop-up instead
"use client";
import { useState } from "react";
import styles from "./SettingsModal.module.css"
import { FaVolumeUp } from "react-icons/fa";   // Speaker / effect sound icon
import { FaMusic } from "react-icons/fa";      // Music note icon
import { useRouter, usePathname } from "next/navigation"; // use for navigation + knowing where you are
export default function SettingsModal() {
  // useState allows the variable to be changed (i.e. allows the user to close/open menu)
  // use "open" to read the state and "setOpen" to set the state, false (closed) by default
  const [open, setOpen] = useState(false);
  const [effectVolume, setEffectVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(50);

  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const handleExit = () => {
    setOpen(false);
    setTimeout(() => {
      router.push("/");
    }, 200);
  };
  // change this stuff below, this is just so we have a way to actually open the settings for now
  return (
    <>
      <button className={styles.settingsButton} onClick={() => setOpen(true)}>⚙️</button>
      {open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Settings</h2>
            
            {/* Effect Volume Slider */}
            <div className={styles.sliderContainer}>
              <label>
                <FaVolumeUp className={styles.icon} />
                Effect Volume: {effectVolume}%</label>
              <input 
                type="range"
                min="0"
                max="100"
                value={effectVolume}
                onChange={(e) => {
                  setEffectVolume(e.target.value)
                  const val = e.target.value;  
                  e.target.style.background = `linear-gradient(to right, #ff7f00 ${val}%, #ffd7a0 ${val}%)`;
                }}
                style={{
                background: `linear-gradient(to right, #ff7f00 ${effectVolume}%, #ffd7a0 ${effectVolume}%)`,
                }}
              />
              </div>
            {/* Music Volume Slider */}
            <div className={styles.sliderContainer}>
              <label>
                <FaMusic className={styles.icon} />
                Music Volume: {musicVolume}%
              </label>
              <input 
                type="range"
                min="0"
                max="100"
                value={musicVolume} 
                onChange={(e) => {
                  setMusicVolume(e.target.value)
                  const val = e.target.value;  
                  e.target.style.background = `linear-gradient(to right, #ff7f00 ${val}%, #ffd7a0 ${val}%)`;
                }}
                style={{
                background: `linear-gradient(to right, #ff7f00 ${musicVolume}%, #ffd7a0 ${musicVolume}%)`,
                }}
              />
            
            </div>
             <div className={styles.buttons}>
              {isHomePage ? (
                <button onClick={handleExit}>Exit</button>
              ) : (
                <>
                  <button onClick={() => setOpen(false)}>Resume</button>
                  <button onClick={handleExit}>Exit</button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
