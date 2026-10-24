"use client";

import { useEffect, useState } from 'react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import Link from 'next/link';
import Image from 'next/image';

export function HomeHero() {
  const { heroImages } = useSiteSettings();
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
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-50 to-lime-100 py-20 md:py-24">
      {activeImage && <Image key={activeImage} src={activeImage} alt="" aria-hidden="true" fill unoptimized className="hero-slide-enter -z-20 object-cover" />}
      {activeImage && <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-950/60 via-emerald-950/45 to-emerald-950/30" />}
      <div className="container relative z-10 mx-auto px-4 text-center">
        <p className={`mb-4 text-sm font-semibold uppercase tracking-[0.24em] ${activeImage ? 'text-lime-100' : 'text-emerald-800'}`}>Neel Solutions · Creating Healthy World</p>
        <h1 className={`mb-6 text-4xl font-extrabold md:text-6xl ${activeImage ? 'text-white' : 'text-gray-950'}`}>
          Empowering a <span className={activeImage ? 'text-lime-300' : 'text-emerald-700'}>Healthier</span> You
        </h1>
        <p className={`mx-auto mb-8 max-w-2xl text-lg md:text-xl ${activeImage ? 'text-white/95' : 'text-gray-800'}`}>
          Discover our range of premium products dedicated to creating a healthy world. Quality you can trust, straight from Neel Solutions.
        </p>
        <Link href="/products" className="inline-block rounded-lg bg-emerald-800 px-8 py-3 text-lg font-semibold text-white shadow-md transition-colors hover:bg-emerald-900">
          Shop Now
        </Link>
        {heroImages.length > 1 && (
          <div className="mt-8 flex justify-center gap-2" aria-label="Homepage slides">
            {heroImages.map((image, index) => (
              <button key={`${index}-${image.slice(0, 24)}`} type="button" onClick={() => setActiveSlide(index)} aria-label={`Show slide ${index + 1}`} aria-current={currentSlide === index ? 'true' : undefined} className={`h-2.5 rounded-full transition-all ${currentSlide === index ? `w-8 ${activeImage ? 'bg-lime-300' : 'bg-emerald-800'}` : `w-2.5 ${activeImage ? 'bg-white/70 hover:bg-white' : 'bg-emerald-900/40 hover:bg-emerald-900/70'}`}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
