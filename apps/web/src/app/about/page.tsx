import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { AboutImage } from '@/components/AboutImage';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-[#f8f6ef]">
        <section className="border-b border-[#e8ddca] bg-[#f0efe5] py-14 md:py-20">
          <div className="container mx-auto px-4 md:px-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#78977d]">About Neel Solutions</p>
            <h1 className="max-w-3xl text-4xl leading-tight tracking-[-0.035em] md:text-6xl">Creating a healthier world, thoughtfully.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#625f58]">We are part of the Neel Group, guided by a simple idea: everyday choices can bring us closer to a healthier life.</p>
          </div>
        </section>
        <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-2 md:items-center md:gap-14 md:px-8 md:py-20">
          <AboutImage />
          <div className="space-y-7">
            <article className="rounded-[1.4rem] border border-[#e4d6bb] bg-[#fbf8f1] p-6 md:p-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#78977d]">Our mission</p>
              <h2 className="mb-3 text-2xl">Wellness for everyday life</h2>
              <p className="leading-7 text-[#625f58]">We offer health and wellness products and make them available directly to customers through our online store.</p>
            </article>
            <article className="rounded-[1.4rem] border border-[#e4d6bb] bg-[#fbf8f1] p-6 md:p-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#78977d]">Our promise</p>
              <h2 className="mb-3 text-2xl">Clear details, thoughtful service</h2>
              <p className="leading-7 text-[#625f58]">Browse product information, check delivery availability, and reach our team whenever you need help with an order.</p>
            </article>
            <Link href="/products" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#789b80] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#62866b]">Explore products <span className="ml-2" aria-hidden="true">→</span></Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
