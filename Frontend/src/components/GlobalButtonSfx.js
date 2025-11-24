"use client";
import { useEffect, useRef } from "react";
import { useAudio } from "./AudioProvider";

// Globally plays a subtle click sound for any button press without causing rerenders.
// - Listens at the document level (capture) for pointerdown on real/ARIA buttons
// - Skips elements with data-sfx="none" if you need to opt out
export default function GlobalButtonSfx() {
  const { ensureAudio, playEffect } = useAudio();
  const playRef = useRef(playEffect);
  const ensureRef = useRef(ensureAudio);

  // Keep refs in sync but don't reattach listeners
  useEffect(() => { playRef.current = playEffect; }, [playEffect]);
  useEffect(() => { ensureRef.current = ensureAudio; }, [ensureAudio]);

  useEffect(() => {
    const onPointerDown = (e) => {
      // Find nearest actionable element
      const el = e.target && e.target.closest && e.target.closest("button, [role=button]");
      if (!el) return;
      if (el.dataset && el.dataset.sfx === "none") return; // opt-out
      try { ensureRef.current?.(); } catch {}
      try { playRef.current?.("click"); } catch {}
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return null;
}

