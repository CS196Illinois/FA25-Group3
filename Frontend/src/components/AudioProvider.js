"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

// Ultra-minimal provider: single beep effect, simple gains, no state.
const AudioCtx = createContext({
  musicVolume: 0.5,
  effectsVolume: 0.5,
  setMusicVolume: () => {},
  setEffectsVolume: () => {},
  setMusicGainLive: () => {},
  setEffectsGainLive: () => {},
  playEffect: () => {},
  ensureAudio: () => {},
  startMusic: () => {},
});

export function useAudio() {
  return useContext(AudioCtx);
}
export function useAudioVolumes() {
  const ctx = useContext(AudioCtx);
  const { musicVolume, effectsVolume, setMusicVolume, setEffectsVolume } = ctx;
  return { musicVolume, effectsVolume, setMusicVolume, setEffectsVolume };
}

export default function AudioProvider({ children }) {
  const audioCtxRef = useRef(null);
  const musicGainRef = useRef(null);
  const effectsGainRef = useRef(null);
  const volsRef = useRef({ music: 0.5, effects: 0.5 });
  const musicElRef = useRef(null);
  const musicSourceRef = useRef(null);
  const scoreAddTimerRef = useRef(null);
  const scoreAddPitchRef = useRef(480);
  const pathname = usePathname();
  const currentMusicUrl = useMemo(() => {
    if (!pathname) return "/audio/bgm.mp3";
    if (pathname === "/" || pathname.startsWith("/home")) return "/audio/home.mp3";
    if (pathname.startsWith("/login")) return "/audio/login.mp3";
    if (pathname.startsWith("/lobby")) return "/audio/lobby.mp3";
    if (pathname.startsWith("/profile")) return "/audio/profile.mp3";
    if (pathname.startsWith("/game")) return "/audio/bgm.mp3";
    return "/audio/bgm.mp3";
  }, [pathname]);

  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
        const musicGain = ctx.createGain();
        const effectsGain = ctx.createGain();
        musicGain.gain.value = volsRef.current.music;
        effectsGain.gain.value = volsRef.current.effects;
        musicGain.connect(ctx.destination);
        effectsGain.connect(ctx.destination);
        musicGainRef.current = musicGain;
        effectsGainRef.current = effectsGain;
      } catch {}
    } else if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, []);

  const setMusicVolume = useCallback((v) => {
    volsRef.current.music = Math.max(0, Math.min(1, v));
    if (musicGainRef.current) musicGainRef.current.gain.value = volsRef.current.music;
    try { if (typeof window !== 'undefined') localStorage.setItem("musicVolume", String(volsRef.current.music)); } catch {}
  }, []);
  const setEffectsVolume = useCallback((v) => {
    volsRef.current.effects = Math.max(0, Math.min(1, v));
    if (effectsGainRef.current) effectsGainRef.current.gain.value = volsRef.current.effects;
    try { if (typeof window !== 'undefined') localStorage.setItem("effectsVolume", String(volsRef.current.effects)); } catch {}
  }, []);
  const setMusicGainLive = useCallback((v) => {
    if (musicGainRef.current) musicGainRef.current.gain.value = Math.max(0, Math.min(1, v));
  }, []);
  const setEffectsGainLive = useCallback((v) => {
    if (effectsGainRef.current) effectsGainRef.current.gain.value = Math.max(0, Math.min(1, v));
  }, []);

  const playEffect = useCallback(() => {
    ensureAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const out = effectsGainRef.current || ctx.destination;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(600, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(Math.max(0.001, volsRef.current.effects), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
    o.connect(g); g.connect(out);
    o.start(t0); o.stop(t0 + 0.16);
  }, [ensureAudio]);

  const startMusic = useCallback(() => {
    ensureAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      if (!musicElRef.current) {
        const el = new Audio();
        el.src = currentMusicUrl; // files in Frontend/public/audio
        el.loop = true;
        el.preload = "auto";
        el.crossOrigin = "anonymous";
        musicElRef.current = el;
      }
      if (!musicSourceRef.current) {
        musicSourceRef.current = ctx.createMediaElementSource(musicElRef.current);
        musicSourceRef.current.connect(musicGainRef.current || ctx.destination);
      }
      musicElRef.current.volume = 1.0;
      musicElRef.current.play().catch(() => {});
    } catch {}
  }, [ensureAudio, currentMusicUrl]);

  // Score fill sound: short repeating blips that stop when caller requests
  const startScoreAdd = useCallback(() => {
    ensureAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (scoreAddTimerRef.current) return;
    scoreAddPitchRef.current = 480;
    scoreAddTimerRef.current = setInterval(() => {
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const base = Math.min(900, (scoreAddPitchRef.current += 6));
        o.type = "square";
        o.frequency.value = base;
        g.gain.setValueAtTime(0, ctx.currentTime);
        const peak = Math.max(0.001, effectsGainRef.current?.gain?.value ?? volsRef.current.effects) * 0.35;
        g.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        o.connect(g);
        g.connect(effectsGainRef.current || ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.09);
      } catch {}
    }, 90);
  }, [ensureAudio]);

  const stopScoreAdd = useCallback(() => {
    if (scoreAddTimerRef.current) {
      clearInterval(scoreAddTimerRef.current);
      scoreAddTimerRef.current = null;
    }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onFirst = () => { try { ensureAudio(); startMusic(); } catch {} };
    window.addEventListener('pointerdown', onFirst, { once: true });
    return () => window.removeEventListener('pointerdown', onFirst);
  }, [ensureAudio, startMusic]);

  useEffect(() => {
    const el = musicElRef.current;
    const ctx = audioCtxRef.current;
    if (!el || !ctx) return;
    try {
      if (el.src && el.src.endsWith(currentMusicUrl)) return;
      el.pause();
      el.src = currentMusicUrl;
      if (!musicSourceRef.current) {
        musicSourceRef.current = ctx.createMediaElementSource(el);
        musicSourceRef.current.connect(musicGainRef.current || ctx.destination);
      }
      el.play().catch(() => {});
    } catch {}
  }, [currentMusicUrl]);

  const value = useMemo(() => ({
    musicVolume: volsRef.current.music,
    effectsVolume: volsRef.current.effects,
    setMusicVolume,
    setEffectsVolume,
    setMusicGainLive,
    setEffectsGainLive,
    playEffect,
    ensureAudio,
    startMusic,
    startScoreAdd,
    stopScoreAdd,
  }), [setMusicVolume, setEffectsVolume, setMusicGainLive, setEffectsGainLive, playEffect, ensureAudio, startMusic]);

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}
