// Settings Modal
// No Route, works like a pop-up instead
/*
  What:
    - A floating pop-up that opens from a gear button and lets the player
      adjust Music/Effects volume and navigate home.

  How:
    - We track whether the modal is open with `open` (useState).
    - Clicking the dark overlay calls setOpen(false) to close the modal.
    - We pull `musicVolume`, `effectsVolume` and their setters from AudioProvider
      so changes immediately update the global Gain nodes.
    - On open we call `ensureAudio()` and `startMusic()` to initialize audio
      after the user has interacted with the page.
    - The sliders are standard range inputs; we write a gradient background so
      the fill visually reflects the numeric value.
    - The "Exit" label is renamed to "Home" and pushes "/" using next/router.
*/
"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./SettingsModal.module.css"
import { FaVolumeUp } from "react-icons/fa";   // Speaker / effect sound icon
import { FaMusic } from "react-icons/fa";      // Music note icon
import { useRouter, usePathname } from "next/navigation"; // use for navigation + knowing where you are
// Pull in audio helpers: volumes + start audio if needed
import { useAudio, useAudioVolumes } from "./AudioProvider";
import { auth } from "./firebase-config";
import { signOut, onAuthStateChanged } from "firebase/auth";
export default function SettingsModal() {
  // useState allows the variable to be changed (i.e. allows the user to close/open menu)
  // use "open" to read the state and "setOpen" to set the state, false (closed) by default
  const [open, setOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  // Stable audio API (won't rerender game on volume commit)
  const { setMusicGainLive, setEffectsGainLive, startMusic, ensureAudio } = useAudio();
  // Volumes live in a separate context for UI
  const { musicVolume, effectsVolume, setMusicVolume, setEffectsVolume } = useAudioVolumes();

  // Local slider state (0-100) to avoid thrashing global context during drag
  const [musicPct, setMusicPct] = useState(Math.round((musicVolume ?? 0) * 100));
  const [effectsPct, setEffectsPct] = useState(Math.round((effectsVolume ?? 0) * 100));

  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isLoginPage = pathname?.startsWith('/login');
  const isLobbyPage = pathname?.startsWith('/lobby');

  // Go back to the Lobby page
  const handleHome = () => {
    setOpen(false);
    setTimeout(() => {
      router.push("/lobby");
    }, 200);
  };
  // Clicking on the dark area outside the modal closes it (return to game)
  const handleOverlayClick = () => {
    setOpen(false);
  };
  const handleProfile = () => {
    setOpen(false);
    setTimeout(() => router.push("/profile"), 200);
  };
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {}
    // Optional: clear any stored profile data
    try {
      localStorage.removeItem("name");
      localStorage.removeItem("email");
      localStorage.removeItem("profilePic");
    } catch {}
    setOpen(false);
    setTimeout(() => router.push("/login"), 200);
  };
  const handleSignIn = () => {
    setOpen(false);
    setTimeout(() => router.push("/login"), 200);
  };

  // When the modal opens, make sure audio is initialized and start music
  useEffect(() => {
    if (open) {
      ensureAudio();
      startMusic();
      try {
        const mv = Number(localStorage.getItem("musicVolume"));
        const ev = Number(localStorage.getItem("effectsVolume"));
        if (!Number.isNaN(mv)) setMusicPct(Math.round(mv * 100));
        else setMusicPct(Math.round((musicVolume ?? 0) * 100));
        if (!Number.isNaN(ev)) setEffectsPct(Math.round(ev * 100));
        else setEffectsPct(Math.round((effectsVolume ?? 0) * 100));
      } catch {
        setMusicPct(Math.round((musicVolume ?? 0) * 100));
        setEffectsPct(Math.round((effectsVolume ?? 0) * 100));
      }
    }
  }, [open, ensureAudio, startMusic, musicVolume, effectsVolume]);

  // Track auth state to decide whether to show Profile/Sign Out
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsSignedIn(!!user);
    });
    return () => unsub();
  }, []);

  // Commit local slider values to context + persistence
  const commitVolumes = useCallback(() => {
    setMusicVolume((musicPct ?? 0) / 100);
    setEffectsVolume((effectsPct ?? 0) / 100);
  }, [musicPct, effectsPct, setMusicVolume, setEffectsVolume]);
  // change this stuff below, this is just so we have a way to actually open the settings for now
  return (
    <>
      <button className={styles.settingsButton} onClick={() => setOpen(true)}>⚙️</button>
      {open && (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Settings</h2>
              <div className={styles.headerActions}>
                {isSignedIn ? (
                  <>
                    <button className={styles.secondaryButton} onClick={() => { commitVolumes(); handleProfile(); }}>Profile</button>
                    <button className={styles.secondaryButtonDanger} onClick={async () => { commitVolumes(); await handleSignOut(); }}>Sign Out</button>
                  </>
                ) : (
                  <button className={styles.secondaryButton} onClick={handleSignIn}>Sign In</button>
                )}
              </div>
            </div>
            
            {/* Effect Volume Slider */}
            <div className={styles.sliderContainer}>
              <label>
                <FaVolumeUp className={styles.icon} />
                Effects Volume: {effectsPct}%</label>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={effectsPct}
                  onChange={(e) => {
                    const pct = Number(e.target.value); // 0-100
                    setEffectsPct(pct);
                    setEffectsGainLive(pct / 100);      // live gain update only
                  }}
                  onPointerUp={commitVolumes}
                  onMouseUp={commitVolumes}
                  onTouchEnd={commitVolumes}
                style={{
                background: `linear-gradient(to right, #ff7f00 ${effectsPct}%, #ffd7a0 ${effectsPct}%)`,
                }}
              />
              </div>
            {/* Music Volume Slider */}
            <div className={styles.sliderContainer}>
              <label>
                <FaMusic className={styles.icon} />
                Music Volume: {musicPct}%
              </label>
              <input 
                type="range"
                min="0"
                max="100"
                value={musicPct}
                onChange={(e) => {
                  const pct = Number(e.target.value); // 0-100
                  setMusicPct(pct);
                  setMusicGainLive(pct / 100);       // live gain update only
                }}
                onPointerUp={commitVolumes}
                onMouseUp={commitVolumes}
                onTouchEnd={commitVolumes}
                style={{
                background: `linear-gradient(to right, #ff7f00 ${musicPct}%, #ffd7a0 ${musicPct}%)`,
                }}
              />
            
            </div>
             <div className={styles.buttons}>
              {isLobbyPage ? (
                <button onClick={() => { commitVolumes(); setOpen(false); }}>Close</button>
              ) : (isHomePage || isLoginPage ? (
                isSignedIn ? (
                  <>
                    <button onClick={() => { commitVolumes(); setOpen(false); }}>Close</button>
                    <button onClick={() => { commitVolumes(); handleHome(); }}>Lobby</button>
                  </>
                ) : (
                  <button onClick={() => { commitVolumes(); setOpen(false); }}>Close</button>
                )
              ) : (
                <>
                  <button onClick={() => { commitVolumes(); setOpen(false); }}>Resume</button>
                  <button onClick={() => { commitVolumes(); handleHome(); }}>Lobby</button>
                </>
              ))}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
