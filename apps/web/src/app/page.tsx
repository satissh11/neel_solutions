import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomeHero } from '@/components/HomeHero';
import { HomeProductHighlights } from '@/components/HomeProductHighlights';
import { HomeEditorialSections } from '@/components/HomeEditorialSections';
import { HomeTrustStrip } from '@/components/HomeTrustStrip';

export default function StorefrontHome() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <HomeHero />

        <HomeTrustStrip />

        <HomeProductHighlights />
        <HomeEditorialSections />
      </main>
      <Footer />
    </div>
  );
}
