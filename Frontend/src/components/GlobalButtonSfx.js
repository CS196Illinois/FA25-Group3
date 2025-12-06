"use client";
import { useEffect } from "react";
import { useAudio } from "./AudioProvider";

export default function GlobalButtonSfx() {
  const { ensureAudio, playEffect } = useAudio();
  useEffect(() => {
    const onDown = (e) => {
      const el = e.target?.closest?.("button,[role=button]");
      if (!el || el.dataset?.sfx === "none") return;
      try { ensureAudio(); } catch {}
      try { playEffect(); } catch {}
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [ensureAudio, playEffect]);
  return null;
}

