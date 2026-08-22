"use client";

import React from "react";

interface TikTokHeroBgProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * TikTok-branded hero background.
 *
 * Layout (matches reference image):
 *   ┌──[note]────────────────────────[note]──┐
 *   │   neon lines converging from sides     │
 *   │              [children]                │
 *   │                                        │
 *   └──[bag]─────────────────────────[bag]──┘
 *
 * Each corner icon is an absolutely-positioned SVG so it
 * never collides with the center content.
 */
export function TikTokHeroBg({ children, className = "" }: TikTokHeroBgProps) {
  return (
    <div
      className={`tiktok-hero-bg ${className}`}
      style={{ position: "relative", overflow: "hidden", background: "#08080C" }}
    >
      {/* ── 1. Full-bleed lines SVG (stays behind everything) ── */}
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        preserveAspectRatio="none"
        viewBox="0 0 1200 500"
      >
        <defs>
          <filter id="gpink" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="gcyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Line gradients — fade from edge → center */}
          <linearGradient id="lpl" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FE2C55" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FE2C55" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="lpr" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FE2C55" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FE2C55" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="lcl" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#25F4EE" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#25F4EE" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="lcr" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#25F4EE" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#25F4EE" stopOpacity="0.05" />
          </linearGradient>

          <radialGradient id="centerglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FE2C55" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#25F4EE" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient center bloom */}
        <ellipse cx="600" cy="250" rx="500" ry="280" fill="url(#centerglow)" />

        {/* ── Left-side rays (all converge to center 600,250) ── */}
        {/* Pink */}
        <line x1="0" y1="20"  x2="600" y2="250" stroke="url(#lpl)" strokeWidth="2"   filter="url(#gpink)" opacity="0.9"  className="ttl" />
        <line x1="0" y1="60"  x2="600" y2="250" stroke="url(#lpl)" strokeWidth="1.5" filter="url(#gpink)" opacity="0.75" className="ttl" style={{animationDelay:"0.3s"}} />
        <line x1="0" y1="110" x2="600" y2="250" stroke="url(#lpl)" strokeWidth="1"   filter="url(#gpink)" opacity="0.55" className="ttl" style={{animationDelay:"0.6s"}} />
        <line x1="0" y1="170" x2="600" y2="250" stroke="url(#lpl)" strokeWidth="0.8" filter="url(#gpink)" opacity="0.4"  className="ttl" style={{animationDelay:"0.9s"}} />
        <line x1="0" y1="230" x2="600" y2="250" stroke="url(#lpl)" strokeWidth="0.6" filter="url(#gpink)" opacity="0.3"  className="ttl" style={{animationDelay:"1.2s"}} />
        <line x1="0" y1="290" x2="600" y2="250" stroke="url(#lpl)" strokeWidth="0.6" filter="url(#gpink)" opacity="0.3"  className="ttl" style={{animationDelay:"1.1s"}} />
        <line x1="0" y1="350" x2="600" y2="250" stroke="url(#lpl)" strokeWidth="0.8" filter="url(#gpink)" opacity="0.4"  className="ttl" style={{animationDelay:"0.8s"}} />
        <line x1="0" y1="400" x2="600" y2="250" stroke="url(#lpl)" strokeWidth="1"   filter="url(#gpink)" opacity="0.55" className="ttl" style={{animationDelay:"0.5s"}} />
        <line x1="0" y1="445" x2="600" y2="250" stroke="url(#lpl)" strokeWidth="1.5" filter="url(#gpink)" opacity="0.7"  className="ttl" style={{animationDelay:"0.2s"}} />
        <line x1="0" y1="490" x2="600" y2="250" stroke="url(#lpl)" strokeWidth="2"   filter="url(#gpink)" opacity="0.85" className="ttl" style={{animationDelay:"0.1s"}} />
        {/* Cyan */}
        <line x1="0" y1="40"  x2="600" y2="250" stroke="url(#lcl)" strokeWidth="1.5" filter="url(#gcyan)" opacity="0.8"  className="ttl" style={{animationDelay:"0.45s"}} />
        <line x1="0" y1="85"  x2="600" y2="250" stroke="url(#lcl)" strokeWidth="1"   filter="url(#gcyan)" opacity="0.6"  className="ttl" style={{animationDelay:"0.7s"}} />
        <line x1="0" y1="145" x2="600" y2="250" stroke="url(#lcl)" strokeWidth="0.7" filter="url(#gcyan)" opacity="0.4"  className="ttl" style={{animationDelay:"1.0s"}} />
        <line x1="0" y1="310" x2="600" y2="250" stroke="url(#lcl)" strokeWidth="0.7" filter="url(#gcyan)" opacity="0.4"  className="ttl" style={{animationDelay:"0.95s"}} />
        <line x1="0" y1="375" x2="600" y2="250" stroke="url(#lcl)" strokeWidth="1"   filter="url(#gcyan)" opacity="0.6"  className="ttl" style={{animationDelay:"0.5s"}} />
        <line x1="0" y1="470" x2="600" y2="250" stroke="url(#lcl)" strokeWidth="1.5" filter="url(#gcyan)" opacity="0.75" className="ttl" style={{animationDelay:"0.25s"}} />

        {/* ── Right-side rays (mirror) ── */}
        {/* Pink */}
        <line x1="1200" y1="20"  x2="600" y2="250" stroke="url(#lpr)" strokeWidth="2"   filter="url(#gpink)" opacity="0.9"  className="ttl" />
        <line x1="1200" y1="60"  x2="600" y2="250" stroke="url(#lpr)" strokeWidth="1.5" filter="url(#gpink)" opacity="0.75" className="ttl" style={{animationDelay:"0.3s"}} />
        <line x1="1200" y1="110" x2="600" y2="250" stroke="url(#lpr)" strokeWidth="1"   filter="url(#gpink)" opacity="0.55" className="ttl" style={{animationDelay:"0.6s"}} />
        <line x1="1200" y1="170" x2="600" y2="250" stroke="url(#lpr)" strokeWidth="0.8" filter="url(#gpink)" opacity="0.4"  className="ttl" style={{animationDelay:"0.9s"}} />
        <line x1="1200" y1="230" x2="600" y2="250" stroke="url(#lpr)" strokeWidth="0.6" filter="url(#gpink)" opacity="0.3"  className="ttl" style={{animationDelay:"1.2s"}} />
        <line x1="1200" y1="290" x2="600" y2="250" stroke="url(#lpr)" strokeWidth="0.6" filter="url(#gpink)" opacity="0.3"  className="ttl" style={{animationDelay:"1.1s"}} />
        <line x1="1200" y1="350" x2="600" y2="250" stroke="url(#lpr)" strokeWidth="0.8" filter="url(#gpink)" opacity="0.4"  className="ttl" style={{animationDelay:"0.8s"}} />
        <line x1="1200" y1="400" x2="600" y2="250" stroke="url(#lpr)" strokeWidth="1"   filter="url(#gpink)" opacity="0.55" className="ttl" style={{animationDelay:"0.5s"}} />
        <line x1="1200" y1="445" x2="600" y2="250" stroke="url(#lpr)" strokeWidth="1.5" filter="url(#gpink)" opacity="0.7"  className="ttl" style={{animationDelay:"0.2s"}} />
        <line x1="1200" y1="490" x2="600" y2="250" stroke="url(#lpr)" strokeWidth="2"   filter="url(#gpink)" opacity="0.85" className="ttl" style={{animationDelay:"0.1s"}} />
        {/* Cyan */}
        <line x1="1200" y1="40"  x2="600" y2="250" stroke="url(#lcr)" strokeWidth="1.5" filter="url(#gcyan)" opacity="0.8"  className="ttl" style={{animationDelay:"0.45s"}} />
        <line x1="1200" y1="85"  x2="600" y2="250" stroke="url(#lcr)" strokeWidth="1"   filter="url(#gcyan)" opacity="0.6"  className="ttl" style={{animationDelay:"0.7s"}} />
        <line x1="1200" y1="145" x2="600" y2="250" stroke="url(#lcr)" strokeWidth="0.7" filter="url(#gcyan)" opacity="0.4"  className="ttl" style={{animationDelay:"1.0s"}} />
        <line x1="1200" y1="310" x2="600" y2="250" stroke="url(#lcr)" strokeWidth="0.7" filter="url(#gcyan)" opacity="0.4"  className="ttl" style={{animationDelay:"0.95s"}} />
        <line x1="1200" y1="375" x2="600" y2="250" stroke="url(#lcr)" strokeWidth="1"   filter="url(#gcyan)" opacity="0.6"  className="ttl" style={{animationDelay:"0.5s"}} />
        <line x1="1200" y1="470" x2="600" y2="250" stroke="url(#lcr)" strokeWidth="1.5" filter="url(#gcyan)" opacity="0.75" className="ttl" style={{animationDelay:"0.25s"}} />

        {/* Diagonal accent streaks */}
        <line x1="100" y1="0" x2="280" y2="500" stroke="#FE2C55" strokeWidth="0.8" filter="url(#gpink)" opacity="0.2" className="ttstreak" />
        <line x1="200" y1="0" x2="170" y2="500" stroke="#25F4EE" strokeWidth="0.6" filter="url(#gcyan)" opacity="0.18" className="ttstreak" style={{animationDelay:"0.9s"}} />
        <line x1="1100" y1="0" x2="920" y2="500" stroke="#FE2C55" strokeWidth="0.8" filter="url(#gpink)" opacity="0.2" className="ttstreak" style={{animationDelay:"0.5s"}} />
        <line x1="1000" y1="0" x2="1030" y2="500" stroke="#25F4EE" strokeWidth="0.6" filter="url(#gcyan)" opacity="0.18" className="ttstreak" style={{animationDelay:"1.3s"}} />
      </svg>

      {/* ── 2. Corner icons — absolutely positioned ─────────── */}

      {/* TOP-LEFT: TikTok note */}
      <TikTokNote
        style={{ position: "absolute", top: 24, left: 32, width: 72, height: 80 }}
        className="tticon"
        strokeCyan="#25F4EE"
        strokePink="#FE2C55"
      />

      {/* TOP-RIGHT: TikTok note */}
      <TikTokNote
        style={{ position: "absolute", top: 24, right: 32, width: 72, height: 80 }}
        className="tticon"
        strokeCyan="#25F4EE"
        strokePink="#FE2C55"
        style2={{ animationDelay: "0.8s" }}
      />

      {/* BOTTOM-LEFT: Shopping bag */}
      <ShoppingBag
        style={{ position: "absolute", bottom: 24, left: 24, width: 88, height: 96 }}
        className="tticon"
        strokeCyan="#25F4EE"
        strokePink="#FE2C55"
        style2={{ animationDelay: "0.4s" }}
      />

      {/* BOTTOM-RIGHT: Shopping bag */}
      <ShoppingBag
        style={{ position: "absolute", bottom: 24, right: 24, width: 88, height: 96 }}
        className="tticon"
        strokeCyan="#25F4EE"
        strokePink="#FE2C55"
        style2={{ animationDelay: "1.2s" }}
      />

      {/* ── 3. Content layer ─────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>

      <style>{`
        /* Neon line pulse */
        .ttl {
          animation: ttpulse 3s ease-in-out infinite alternate;
        }
        @keyframes ttpulse {
          0%   { opacity: var(--op, 0.6); }
          50%  { opacity: 1; }
          100% { opacity: calc(var(--op, 0.6) * 0.4); }
        }

        /* Streak shimmer */
        .ttstreak {
          animation: ttshimmer 4s ease-in-out infinite alternate;
        }
        @keyframes ttshimmer {
          0%   { opacity: 0.1; }
          50%  { opacity: 0.35; }
          100% { opacity: 0.08; }
        }

        /* Icon float */
        .tticon {
          animation: ttfloat 5s ease-in-out infinite alternate;
          z-index: 0;
        }
        @keyframes ttfloat {
          0%   { transform: translateY(0px); filter: brightness(1); }
          50%  { transform: translateY(-7px); filter: brightness(1.5); }
          100% { transform: translateY(3px); filter: brightness(0.85); }
        }
      `}</style>
    </div>
  );
}

/* ─── Standalone TikTok musical note SVG ─────────────────── */
function TikTokNote({
  style,
  style2,
  className,
  strokeCyan,
  strokePink,
}: {
  style?: React.CSSProperties;
  style2?: React.CSSProperties;
  className?: string;
  strokeCyan: string;
  strokePink: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 90"
      fill="none"
      style={{ ...style, ...style2 }}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <filter id="note-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Pink shadow offset (TikTok double-exposure effect) */}
      <g transform="translate(3,3)" opacity="0.6" filter="url(#note-glow)">
        {/* Vertical stem */}
        <rect x="52" y="2" width="12" height="48" rx="6" fill={strokePink} />
        {/* Top flag */}
        <path d="M52 2 Q68 0 74 16 L62 20 Q60 8 52 10 Z" fill={strokePink} />
        {/* Note head ring */}
        <circle cx="22" cy="66" r="20" fill="none" stroke={strokePink} strokeWidth="12" />
      </g>
      {/* Cyan main icon */}
      <g filter="url(#note-glow)">
        <rect x="52" y="2" width="12" height="48" rx="6" fill={strokeCyan} />
        <path d="M52 2 Q68 0 74 16 L62 20 Q60 8 52 10 Z" fill={strokeCyan} />
        <circle cx="22" cy="66" r="20" fill="none" stroke={strokeCyan} strokeWidth="12" />
        {/* Inner cutout */}
        <circle cx="22" cy="66" r="8" fill="#08080C" />
      </g>
    </svg>
  );
}

/* ─── Standalone shopping bag SVG ────────────────────────── */
function ShoppingBag({
  style,
  style2,
  className,
  strokeCyan,
  strokePink,
}: {
  style?: React.CSSProperties;
  style2?: React.CSSProperties;
  className?: string;
  strokeCyan: string;
  strokePink: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 110"
      fill="none"
      style={{ ...style, ...style2 }}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <filter id="bag-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Pink shadow offset */}
      <g transform="translate(3,3)" opacity="0.55" filter="url(#bag-glow)">
        <path
          d="M14 36 Q8 36 6 44 L1 94 Q-1 106 10 106 L90 106 Q101 106 99 94 L94 44 Q92 36 86 36 Z"
          stroke={strokePink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
        />
        <path d="M34 36 Q34 10 50 10 Q66 10 66 36" stroke={strokePink} strokeWidth="7" strokeLinecap="round" />
      </g>

      {/* Cyan main bag */}
      <g filter="url(#bag-glow)">
        <path
          d="M14 36 Q8 36 6 44 L1 94 Q-1 106 10 106 L90 106 Q101 106 99 94 L94 44 Q92 36 86 36 Z"
          stroke={strokePink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
        />
        <path d="M34 36 Q34 10 50 10 Q66 10 66 36" stroke={strokePink} strokeWidth="7" strokeLinecap="round" />

        {/* TikTok note inside bag — cyan */}
        <rect x="57" y="56" width="7" height="26" rx="3.5" fill={strokeCyan} />
        <path d="M57 56 Q65 55 68 63 L61 65 Q60 59 57 60 Z" fill={strokeCyan} />
        <circle cx="40" cy="80" r="12" fill="none" stroke={strokeCyan} strokeWidth="7" />
        <circle cx="40" cy="80" r="5" fill="#08080C" />
      </g>
    </svg>
  );
}
