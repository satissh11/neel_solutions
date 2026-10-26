"use client";

import { useEffect, useState } from 'react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import Link from 'next/link';
import Image from 'next/image';

export function HomeHero() {
  const { heroImages, homeContent } = useSiteSettings();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (heroImages.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveSlide(current => (current + 1) % heroImages.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  const currentSlide = heroImages.length ? activeSlide % heroImages.length : 0;
  const activeImage = heroImages[currentSlide];

  return (
    <section className="home-hero relative isolate flex min-h-[560px] items-center overflow-hidden py-20 md:min-h-[650px] md:py-24">
      <Image key={activeImage || 'nature'} src={activeImage || '/admin-nature.svg'} alt="" aria-hidden="true" fill unoptimized loading="eager" className="hero-slide-enter -z-20 object-cover" />
      <div aria-hidden="true" className="home-hero-wash absolute inset-0 -z-10" />
      <div className="container relative z-10 mx-auto px-6 md:px-10">
        <div className="max-w-3xl">
          <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d7e3c8] [text-shadow:0_1px_8px_rgba(10,32,24,.6)] md:text-sm">
            <span aria-hidden="true">✳</span> {homeContent.heroEyebrow}
          </p>
          <h1 className="mb-6 max-w-3xl text-5xl font-normal leading-[1.04] tracking-[-0.045em] text-[#fffdf0] [text-shadow:0_2px_18px_rgba(8,28,19,.48)] md:text-7xl">
            {homeContent.heroTitle}
          </h1>
          <p className="mb-8 max-w-xl text-base leading-7 text-[#f5f1df] [text-shadow:0_1px_8px_rgba(8,28,19,.72)] md:text-xl md:leading-8">
            {homeContent.heroDescription}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/products" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#789b80] px-8 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#62866b]">
              {homeContent.heroPrimaryLabel}
            </Link>
            <Link href="/about" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-white/55 bg-white/10 px-8 text-sm font-semibold text-white transition-colors hover:bg-white/20">
              {homeContent.heroSecondaryLabel} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        {heroImages.length > 1 && (
          <div className="mt-10 flex gap-2" aria-label="Homepage slides">
            {heroImages.map((image, index) => (
              <button key={`${index}-${image.slice(0, 24)}`} type="button" onClick={() => setActiveSlide(index)} aria-label={`Show slide ${index + 1}`} aria-current={currentSlide === index ? 'true' : undefined} className={`h-2 rounded-full transition-all ${currentSlide === index ? 'w-8 bg-[#718f77]' : 'w-2 bg-[#718f77]/40 hover:bg-[#718f77]/70'}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
