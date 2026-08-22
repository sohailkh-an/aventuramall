"use client";

import React from "react";

interface TikTokBackgroundProps {
  /** Content to render on top of the background */
  children?: React.ReactNode;
  /** Additional CSS classes for the outer wrapper */
  className?: string;
  /** Whether to show the animated floating triangles overlay */
  animated?: boolean;
  /** Opacity of the SVG pattern (0-1). Default: 1 */
  patternOpacity?: number;
  /** Whether to show the gradient glow effects */
  showGlow?: boolean;
  /** CSS class for the content wrapper (the layer above the bg) */
  contentClassName?: string;
}

/**
 * TikTok-branded background with scattered triangle confetti pattern.
 *
 * Usage:
 *   <TikTokBackground>
 *     <YourContent />
 *   </TikTokBackground>
 *
 *   // Or as a full-page background:
 *   <TikTokBackground className="min-h-screen" animated showGlow>
 *     ...
 *   </TikTokBackground>
 */
export function TikTokBackground({
  children,
  className = "",
  animated = false,
  patternOpacity = 1,
  showGlow = false,
  contentClassName = "",
}: TikTokBackgroundProps) {
  return (
    <div
      className={`tiktok-bg-wrapper ${className}`}
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Base dark background + SVG pattern layer */}
      <div
        className="tiktok-bg-pattern"
        style={{ opacity: patternOpacity }}
        aria-hidden="true"
      />

      {/* Optional glow effects */}
      {showGlow && (
        <>
          <div className="tiktok-bg-glow tiktok-bg-glow--pink" aria-hidden="true" />
          <div className="tiktok-bg-glow tiktok-bg-glow--cyan" aria-hidden="true" />
        </>
      )}

      {/* Optional floating animated triangles */}
      {animated && (
        <div className="tiktok-bg-animated" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className={`tiktok-floating-tri tiktok-floating-tri--${i % 3 === 0 ? "pink" : i % 3 === 1 ? "cyan" : "white"}`}
              style={{
                left: `${(i * 37 + 13) % 100}%`,
                top: `${(i * 53 + 7) % 100}%`,
                animationDelay: `${i * 0.6}s`,
                animationDuration: `${6 + (i % 5) * 2}s`,
                fontSize: `${8 + (i % 4) * 5}px`,
                transform: `rotate(${(i * 47) % 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content layer */}
      <div className={`tiktok-bg-content ${contentClassName}`} style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
