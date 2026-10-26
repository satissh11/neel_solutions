"use client";

import { useEffect, useState, type ReactNode } from "react";

export function SiteIntro({ children }: { children: ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!showIntro) return children;

  return (
    <div className="site-intro" role="status" aria-label="Neel Solutions">
      <div className="intro-scene" aria-hidden="true">
        <div className="intro-glow" />
        <div className="intro-orbit intro-orbit-one"><span /></div>
        <div className="intro-orbit intro-orbit-two"><span /></div>
        <div className="intro-sun" />
        <svg className="intro-landscape" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice">
          <path d="M0 214 190 94l154 128 206-166 210 169 183-131 179 131 168-102 150 106v131H0Z" fill="#527a61" />
          <path d="m190 94 61 48-58-19-37 29Zm360-38 66 54-67-22-48 28Zm393 68 70 51-76-22-42 24Zm347 4 72 50-78-21-43 25Z" fill="#e4ead1" opacity=".8" />
          <path d="M0 247q230-78 456 8t477-7q266-88 507 1v111H0Z" fill="#315d4a" />
          <path d="M0 292q257-71 506 1t468-1q238-72 466 12v55H0Z" fill="#234a3c" />
        </svg>
        <div className="intro-plant intro-plant-left"><i /><i /><i /></div>
        <div className="intro-plant intro-plant-right"><i /><i /><i /></div>
      </div>
      <div className="intro-content">
        <div className="intro-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M32 49c2-11 2-21 0-32M32 42c-7-6-13-8-20-8 1 10 8 15 19 15m2-17c0-11 6-17 18-18 0 11-6 17-18 18Z" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="intro-eyebrow">A little closer to nature</p>
        <h1>Neel Solutions</h1>
        <p className="intro-tagline">Creating a healthier world</p>
        <div className="intro-progress" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
