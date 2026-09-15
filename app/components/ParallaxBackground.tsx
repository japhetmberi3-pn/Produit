"use client";

import { Parallax } from "react-scroll-parallax";

export default function ParallaxBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">

      {/* GROS GLOW CENTRAL */}
      <Parallax
        translateY={[-120, 280]}
        scale={[0.75, 1.2]}
        opacity={[0.25, 0.75]}
        className="absolute left-1/2 top-[15%] -translate-x-1/2"
      >
        <div className="h-[650px] w-[650px] rounded-full bg-blue-600/20 blur-[150px]" />
      </Parallax>

      {/* GROS CERCLE GAUCHE */}
      <Parallax
        translateY={[-250, 350]}
        translateX={[100, -80]}
        rotate={[-20, 35]}
        className="absolute left-[3%] top-[18%] hidden lg:block"
      >
        <div className="h-72 w-72 rounded-full border border-blue-400/20 bg-blue-500/[0.035] shadow-[0_0_120px_rgba(37,99,235,0.12)]" />
      </Parallax>

      {/* GROS CERCLE DROIT */}
      <Parallax
        translateY={[300, -350]}
        translateX={[-100, 130]}
        rotate={[30, -25]}
        className="absolute right-[3%] top-[25%] hidden lg:block"
      >
        <div className="h-80 w-80 rounded-full border border-cyan-400/20 bg-cyan-400/[0.025] shadow-[0_0_140px_rgba(34,211,238,0.12)]" />
      </Parallax>

      {/* PETIT ÉLÉMENT GAUCHE */}
      <Parallax
        translateY={[-350, 450]}
        translateX={[-100, 160]}
        scale={[0.6, 1.2]}
        className="absolute left-[18%] top-[35%] hidden lg:block"
      >
        <div className="h-16 w-16 rounded-full border-2 border-blue-400/30 bg-blue-500/10 shadow-[0_0_45px_rgba(59,130,246,0.2)]" />
      </Parallax>

      {/* PETIT ÉLÉMENT DROIT */}
      <Parallax
        translateY={[400, -400]}
        translateX={[100, -150]}
        scale={[1.2, 0.6]}
        className="absolute right-[22%] top-[48%] hidden lg:block"
      >
        <div className="h-12 w-12 rounded-full border-2 border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.2)]" />
      </Parallax>

      {/* GRAND ANNEAU */}
      <Parallax
        translateY={[200, -450]}
        translateX={[80, -160]}
        rotate={[-40, 50]}
        scale={[0.7, 1.3]}
        className="absolute right-[15%] top-[55%] hidden lg:block"
      >
        <div className="h-52 w-52 rounded-full border-[3px] border-blue-500/15" />
      </Parallax>

      {/* CARRÉ FLOTTANT */}
      <Parallax
        translateY={[450, -500]}
        translateX={[-100, 200]}
        rotate={[45, -60]}
        scale={[0.7, 1.15]}
        className="absolute bottom-[10%] left-[30%] hidden lg:block"
      >
        <div className="h-24 w-24 rounded-2xl border border-blue-400/30 bg-blue-500/[0.04] shadow-[0_0_70px_rgba(37,99,235,0.12)]" />
      </Parallax>

      {/* LIGNE BLEUE */}
      <Parallax
        translateY={[300, -300]}
        translateX={[-250, 250]}
        rotate={[-10, 10]}
        className="absolute left-[35%] top-[60%] hidden lg:block"
      >
        <div className="h-px w-80 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
      </Parallax>

      {/* DIAMANT */}
      <Parallax
        translateY={[-450, 500]}
        translateX={[150, -200]}
        rotate={[0, 180]}
        scale={[0.5, 1]}
        className="absolute right-[35%] top-[30%] hidden lg:block"
      >
        <div className="h-16 w-16 rotate-45 border border-cyan-400/30 bg-cyan-400/[0.03]" />
      </Parallax>

      {/* GLOW INFÉRIEUR */}
      <Parallax
        translateY={[100, -350]}
        scale={[1.2, 0.7]}
        opacity={[0.2, 0.7]}
        className="absolute bottom-[-20%] left-1/2 -translate-x-1/2"
      >
        <div className="h-[500px] w-[700px] rounded-full bg-blue-700/15 blur-[160px]" />
      </Parallax>

    </div>
  );
}