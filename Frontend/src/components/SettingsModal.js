// Settings Modal
// No Route, works like a pop-up instead
"use client";
import { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css"
import { FaVolumeUp } from "react-icons/fa";   // Speaker / effect sound icon
import { FaMusic } from "react-icons/fa";      // Music note icon
import { useRouter, usePathname } from "next/navigation"; // use for navigation + knowing where you are
// Pull in audio helpers: volumes + start audio if needed
import { useAudio } from "./AudioProvider";
export default function SettingsModal() {
  // useState allows the variable to be changed (i.e. allows the user to close/open menu)
  // use "open" to read the state and "setOpen" to set the state, false (closed) by default
  const [open, setOpen] = useState(false);
  // Use audio context values for sliders and starting music
  const { musicVolume, effectsVolume, setMusicVolume, setEffectsVolume, startMusic, ensureAudio } = useAudio();

  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  // Go back to the Home page
  const handleHome = () => {
    setOpen(false);
    setTimeout(() => {
      router.push("/");
    }, 200);
  };
  // Clicking on the dark area outside the modal closes it (return to game)
  const handleOverlayClick = () => {
    setOpen(false);
  };

  // When the modal opens, make sure audio is initialized and start music
  useEffect(() => {
    if (open) {
      ensureAudio();
      startMusic();
    }
  }, [open, ensureAudio, startMusic]);
  // change this stuff below, this is just so we have a way to actually open the settings for now
  return (
    <>
      <button className={styles.settingsButton} onClick={() => setOpen(true)}>⚙️</button>
      {open && (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            
            {/* Effect Volume Slider */}
            <div className={styles.sliderContainer}>
              <label>
                <FaVolumeUp className={styles.icon} />
                Effects Volume: {Math.round((effectsVolume ?? 0) * 100)}%</label>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((effectsVolume ?? 0) * 100)}
                  onChange={(e) => {
                  const pct = Number(e.target.value); // 0-100
                  setEffectsVolume(pct / 100);        // store 0-1
                  const val = pct;                    // for pretty slider color fill
                  e.target.style.background = `linear-gradient(to right, #ff7f00 ${val}%, #ffd7a0 ${val}%)`;
                }}
                style={{
                background: `linear-gradient(to right, #ff7f00 ${Math.round((effectsVolume ?? 0) * 100)}%, #ffd7a0 ${Math.round((effectsVolume ?? 0) * 100)}%)`,
                }}
              />
              </div>
            {/* Music Volume Slider */}
            <div className={styles.sliderContainer}>
              <label>
                <FaMusic className={styles.icon} />
                Music Volume: {Math.round((musicVolume ?? 0) * 100)}%
              </label>
              <input 
                type="range"
                min="0"
                max="100"
                value={Math.round((musicVolume ?? 0) * 100)} 
                onChange={(e) => {
                  const pct = Number(e.target.value); // 0-100
                  setMusicVolume(pct / 100)          // store 0-1
                  const val = pct;                   // for pretty slider color fill
                  e.target.style.background = `linear-gradient(to right, #ff7f00 ${val}%, #ffd7a0 ${val}%)`;
                }}
                style={{
                background: `linear-gradient(to right, #ff7f00 ${Math.round((musicVolume ?? 0) * 100)}%, #ffd7a0 ${Math.round((musicVolume ?? 0) * 100)}%)`,
                }}
              />
            
            </div>
             <div className={styles.buttons}>
              {isHomePage ? (
                <button onClick={() => setOpen(false)}>Close</button>
              ) : (
                <>
                  <button onClick={() => setOpen(false)}>Resume</button>
                  {/* renamed Exit to Home to be clearer */}
                  <button onClick={handleHome}>Home</button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
