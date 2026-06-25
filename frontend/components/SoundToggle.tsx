"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundOn, setSoundOn, celebrate } from "@/lib/celebrate";

export function SoundToggle() {
  const [mounted, setMounted] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    setMounted(true);
    setOn(isSoundOn());
  }, []);
  if (!mounted) return null;
  return (
    <button
      onClick={() => {
        const next = !on;
        setOn(next);
        setSoundOn(next);
        if (next) celebrate();
      }}
      aria-label="Toggle sound"
      title={on ? "Sound on" : "Sound off"}
      className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/70 backdrop-blur transition hover:text-brand-400"
    >
      {on ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
    </button>
  );
}
