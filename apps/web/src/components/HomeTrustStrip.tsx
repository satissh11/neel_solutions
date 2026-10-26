"use client";

import { useSiteSettings } from "@/context/SiteSettingsContext";

export function HomeTrustStrip() {
  const { homeContent } = useSiteSettings();

  return (
    <section className="trust-strip border-b border-[#e5d9c2] bg-[#f4f2e9] py-5 md:py-6">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-center md:gap-x-10">
        {homeContent.trustItems.filter(Boolean).map((label) => (
          <span key={label} className="inline-flex items-center gap-2 text-sm text-[#718f77]"><span aria-hidden="true">♧</span>{label}</span>
        ))}
      </div>
    </section>
  );
}
