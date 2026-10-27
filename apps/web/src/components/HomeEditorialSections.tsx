"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { ReviewSubmissionForm } from "@/components/ReviewSubmissionForm";

const FORMSPREE_URL = "https://formspree.io/f/xoeeebvk";

interface PublicReview { id: string; name: string; product: string | null; rating: number; text: string; createdAt: string }

function ApprovedReviews() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/v1/reviews`)
      .then(response => (response.ok ? response.json() : []))
      .then(data => { if (active && Array.isArray(data)) setReviews(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!reviews.length) return null;

  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-[1.4rem] border border-[#e4d6bb] bg-[#faf8f2] p-5">
          <p className="mb-2 text-[#c9a227]" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}<span className="text-[#d9d2bf]">{"★".repeat(5 - review.rating)}</span></p>
          <p className="mb-4 whitespace-pre-line text-sm leading-6 text-[#49463f]">{review.text}</p>
          <p className="text-sm font-semibold text-[#17151a]">{review.name}</p>
          {review.product && <p className="text-xs text-[#78977d]">{review.product}</p>}
        </article>
      ))}
    </div>
  );
}

function NewsletterForm({ buttonLabel }: { buttonLabel: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setStatus("sending");

    try {
      const response = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: form,
      });

      if (response.ok) {
        formElement.reset();
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="scroll-reveal w-full max-w-xl md:min-w-[440px]">
      <form onSubmit={subscribe} className="flex w-full flex-col gap-3 sm:flex-row">
        <input type="hidden" name="_subject" value="New newsletter subscriber - Neel Solutions" />
        <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" style={{ display: "none" }} />
        <label className="sr-only" htmlFor="newsletter-email">Email address</label>
        <input id="newsletter-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required className="min-h-12 min-w-0 flex-1 rounded-full border border-[#ddd3bf] bg-white px-5 text-sm text-[#29272d] outline-none focus:border-[#91a993]" />
        <button type="submit" disabled={status === "sending"} className="min-h-12 rounded-full bg-[#789b80] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#62866b] disabled:opacity-60">
          {status === "sending" ? "Sending..." : buttonLabel}
        </button>
      </form>
      <div aria-live="polite" className="mt-3 text-sm">
        {status === "success" && <p className="text-[#3f6b4a]">Thank you! You are subscribed.</p>}
        {status === "error" && <p className="text-[#a23b3b]">Sorry, something went wrong. Please try again in a moment.</p>}
      </div>
    </div>
  );
}

export function HomeEditorialSections() {
  const { homeContent } = useSiteSettings();

  return (
    <>
      <section className="home-reviews border-y border-[#e8ddca] bg-[#f0efe5] py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#78977d]">{homeContent.reviewEyebrow}</p>
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div className="scroll-reveal">
              <h2 className="mb-4 max-w-2xl text-4xl font-normal leading-tight tracking-[-0.035em] text-[#17151a] md:text-5xl">{homeContent.reviewTitle}</h2>
              <p className="max-w-2xl leading-7 text-[#625f58]">{homeContent.reviewDescription}</p>
            </div>
            <div className="scroll-reveal"><ReviewSubmissionForm title={homeContent.reviewFormTitle} description={homeContent.reviewFormDescription} /></div>
          </div>
          <ApprovedReviews />
        </div>
      </section>

      <section className="home-standards border-t border-[#e8ddca] bg-[#f8f6ef] py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <p className="scroll-reveal mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#78977d]">{homeContent.standardsEyebrow}</p>
          <h2 className="scroll-reveal mb-10 max-w-2xl text-4xl font-normal leading-tight tracking-[-0.035em] text-[#17151a] md:mb-14 md:text-5xl">{homeContent.standardsTitle}</h2>
          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {homeContent.standards.map((item, index) => (
              <article key={`${index}-${item.title}`} className="scroll-reveal home-standard-card rounded-[1.4rem] border border-[#e4d6bb] bg-[#f4f2e9] p-6 md:p-8">
                <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7eadf] font-serif text-sm text-[#78977d]">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mb-3 text-2xl font-normal text-[#17151a]">{item.title}</h3>
                <p className="leading-6 text-[#625f58]">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-story border-t border-[#e8ddca] bg-[#f0efe5] py-16 md:py-24">
        <div className="container mx-auto grid items-center gap-9 px-4 md:grid-cols-2 md:gap-16 md:px-8">
          <div className="home-story-image relative aspect-[1.25] overflow-hidden rounded-[1.6rem] border border-[#e4d6bb]">
            {homeContent.storyImageUrl && <Image src={homeContent.storyImageUrl} alt="Neel Solutions nature story" fill unoptimized className="scroll-reveal object-cover" />}
          </div>
          <div className="scroll-reveal max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#78977d]">{homeContent.storyEyebrow}</p>
            <h2 className="mb-5 text-4xl font-normal leading-tight tracking-[-0.035em] text-[#17151a] md:text-5xl">{homeContent.storyTitle}</h2>
            <p className="mb-7 leading-7 text-[#625f58]">{homeContent.storyDescription}</p>
            <Link href="/about" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-[#b8b4a8] px-7 text-sm font-semibold text-[#29272d] transition-colors hover:bg-white/60">{homeContent.storyLinkLabel} <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="home-newsletter border-t border-[#e8ddca] bg-[#faf8f2] py-14 md:py-16">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-[1fr_auto] md:items-center md:px-8">
          <div className="scroll-reveal">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#78977d]">{homeContent.newsletterEyebrow}</p>
            <h2 className="mb-2 text-3xl font-normal tracking-[-0.025em] text-[#17151a] md:text-4xl">{homeContent.newsletterTitle}</h2>
            <p className="max-w-xl leading-6 text-[#625f58]">{homeContent.newsletterDescription}</p>
          </div>
          <NewsletterForm buttonLabel={homeContent.newsletterButtonLabel} />
        </div>
      </section>
    </>
  );
}
