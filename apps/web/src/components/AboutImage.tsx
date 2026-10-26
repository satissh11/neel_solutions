"use client";

import Image from "next/image";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export function AboutImage() {
  const { homeContent } = useSiteSettings();

  return (
    <div className="relative aspect-[1.2] overflow-hidden rounded-[1.6rem] border border-[#e4d6bb]">
      {homeContent.aboutImageUrl && <Image src={homeContent.aboutImageUrl} alt="Illustration of a calm green landscape" fill unoptimized className="object-cover" />}
    </div>
  );
}
