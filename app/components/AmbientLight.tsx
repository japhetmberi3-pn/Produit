"use client";

import { useTheme } from "@/app/context/ThemeContext";

export default function AmbientLight() {
  const { lightOn } = useTheme();

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[1] overflow-hidden transition-opacity duration-1000 ${
        lightOn ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute left-1/2 top-0 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[150px]" />
      <div className="absolute -left-40 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-[140px]" />
      <div className="absolute -right-40 top-1/2 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[140px]" />
      <div className="absolute bottom-[-250px] left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[160px]" />
    </div>
  );
}
