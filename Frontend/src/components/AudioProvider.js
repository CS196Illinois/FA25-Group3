"use client";
// AudioProvider: central place to control game audio in a simple way.
// - Background music volume
// - Effects volume (clicks/beeps)
// - Starts/stops background music
// - Plays tiny effects for gameplay events
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation"; // know which page we're on

const AudioCtx = createContext({
  musicVolume: 0.5,
  effectsVolume: 0.5,
  setMusicVolume: () => {},
  setEffectsVolume: () => {},
  startMusic: () => {},
  stopMusic: () => {},
  playEffect: () => {},
  ensureAudio: () => {},
});

export function useAudio() {
  return useContext(AudioCtx);
}

export default function AudioProvider({ children }) {
  const [musicVolume, setMusicVolumeState] = useState(() => {
    const v = typeof window !== "undefined" ? window.localStorage.getItem("musicVolume") : null;
    return v != null ? Number(v) : 0.5;
  });
  const [effectsVolume, setEffectsVolumeState] = useState(() => {
    const v = typeof window !== "undefined" ? window.localStorage.getItem("effectsVolume") : null;
    return v != null ? Number(v) : 0.5;
  });

  const audioCtxRef = useRef(null);
  const musicGainRef = useRef(null);
  const effectsGainRef = useRef(null);
  const musicOscRef = useRef(null); // fallback synth if file isn't available
  const musicElRef = useRef(null);  // <audio> element for MP3 playback
  const musicSourceRef = useRef(null); // Web Audio node for <audio>
  // Default/fallback track (e.g., in-game)
  // Put this file at Frontend/public/audio/bgm.mp3
  const MUSIC_URL = "/audio/bgm.mp3";

  // Detect the current route so we can pick different music per page
  const pathname = usePathname();
  // Map routes to different tracks (add files in Frontend/public/audio)
  const currentMusicUrl = useMemo(() => {
    if (!pathname) return MUSIC_URL;
    if (pathname === "/" || pathname.startsWith("/home")) return "/audio/home.mp3";
    if (pathname.startsWith("/login")) return "/audio/login.mp3";
    if (pathname.startsWith("/lobby")) return "/audio/lobby.mp3";
    if (pathname.startsWith("/profile")) return "/audio/profile.mp3";
    // default for game and everything else
    return MUSIC_URL;
  }, [pathname]);

  // Make sure the Web Audio context + volume nodes exist
  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
        const musicGain = ctx.createGain();
        const effectsGain = ctx.createGain();
        musicGain.gain.value = musicVolume;
        effectsGain.gain.value = effectsVolume;
        musicGain.connect(ctx.destination);
        effectsGain.connect(ctx.destination);
        musicGainRef.current = musicGain;
        effectsGainRef.current = effectsGain;
      } catch (e) {
        // Audio may be blocked until user interaction; will retry on next call
      }
    } else if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, [musicVolume, effectsVolume]);

  // (moved below startMusic to avoid TDZ for startMusic)

  // Update music volume (0.0 - 1.0) and remember it
  const setMusicVolume = useCallback((v) => {
    const vol = Math.max(0, Math.min(1, v));
    setMusicVolumeState(vol);
    if (typeof window !== "undefined") window.localStorage.setItem("musicVolume", String(vol));
    if (musicGainRef.current) musicGainRef.current.gain.value = vol;
  }, []);

  // Update effects volume (0.0 - 1.0) and remember it
  const setEffectsVolume = useCallback((v) => {
    const vol = Math.max(0, Math.min(1, v));
    setEffectsVolumeState(vol);
    if (typeof window !== "undefined") window.localStorage.setItem("effectsVolume", String(vol));
    if (effectsGainRef.current) effectsGainRef.current.gain.value = vol;
  }, []);

  const startMusic = useCallback(() => {
    // Try to play your MP3 first; if that fails, use a soft synth tone
    ensureAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    try {
      // Create <audio> element once
      if (!musicElRef.current) {
        const el = new Audio();
        // Use route-specific music; falls back to default
        el.src = currentMusicUrl; // e.g., /audio/home.mp3 or /audio/bgm.mp3
        el.loop = true;
        el.preload = "auto";
        el.crossOrigin = "anonymous";
        musicElRef.current = el;
      }
      // Connect <audio> into Web Audio so our volume Gain works
      if (!musicSourceRef.current && musicElRef.current) {
        musicSourceRef.current = ctx.createMediaElementSource(musicElRef.current);
        musicSourceRef.current.connect(musicGainRef.current || ctx.destination);
      }
      // Keep element volume at 1.0; our Gain node handles volume
      musicElRef.current.volume = 1.0;
      musicElRef.current.play().catch(() => {
        // If autoplay is blocked, this will succeed after the first user click
      });
      return; // MP3 path handled, no need for synth
    } catch (e) {
      // If MediaElement path failed, continue to synth fallback
    }

    // Fallback: gentle sine wave with slow wobble
    if (musicOscRef.current) return; // already running
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = musicVolume * 0.15; // keep background subtle
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.25;
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(musicGainRef.current || ctx.destination);
    osc.start();
    lfo.start();
    musicOscRef.current = { osc, lfo, gain };
  }, [ensureAudio, musicVolume]);

  const stopMusic = useCallback(() => {
    // Stop MP3 if it is playing
    if (musicElRef.current) {
      try { musicElRef.current.pause(); } catch {}
    }
    // Stop synth fallback if it is running
    if (musicOscRef.current) {
      try {
        musicOscRef.current.osc.stop();
        musicOscRef.current.lfo.stop();
      } catch {}
      musicOscRef.current = null;
    }
  }, []);

  // If the route changes (home/login/lobby/game), switch the track
  useEffect(() => {
    const el = musicElRef.current;
    const ctx = audioCtxRef.current;
    if (!el || !ctx) return; // not started yet; startMusic will pick up currentMusicUrl later
    try {
      if (el.src.endsWith(currentMusicUrl)) return; // already on this track
      el.pause();
      el.src = currentMusicUrl;
      // Make sure it's still connected to our gain
      if (!musicSourceRef.current) {
        musicSourceRef.current = ctx.createMediaElementSource(el);
        musicSourceRef.current.connect(musicGainRef.current || ctx.destination);
      }
      // Try to play the new track
      el.play().catch(() => {});
    } catch {}
  }, [currentMusicUrl]);

  // Initialize audio on first click/tap and start music right away
  // Note: This effect lives AFTER startMusic is defined to avoid
  // "Cannot access uninitialized variable" (temporal dead zone) errors.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onFirstInteract = () => {
      ensureAudio();
      startMusic();
    };
    window.addEventListener("pointerdown", onFirstInteract, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstInteract);
  }, [ensureAudio, startMusic]);

  // Quick beep sound for actions. Different types = different pitch.
  const playEffect = useCallback((type = "click") => {
    ensureAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    let freq = 660;
    if (type === "submit") freq = 880;
    else if (type === "score") freq = 523.25;
    else if (type === "place") freq = 700;
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(Math.max(0.001, effectsVolume), ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(effectsGainRef.current || ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, [effectsVolume, ensureAudio]);

  const value = useMemo(
    () => ({
      musicVolume,
      effectsVolume,
      setMusicVolume,
      setEffectsVolume,
      startMusic,
      stopMusic,
      playEffect,
      ensureAudio,
    }),
    [musicVolume, effectsVolume, setMusicVolume, setEffectsVolume, startMusic, stopMusic, playEffect, ensureAudio]
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}
