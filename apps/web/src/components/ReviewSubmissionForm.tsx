"use client";

import { useState } from "react";
import type { FormEvent } from "react";

const FORMSPREE_URL = "https://formspree.io/f/xoeeebvk";

export function ReviewSubmissionForm({ title, description }: { title: string; description: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function submitReview(event: FormEvent<HTMLFormElement>) {
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
    <div className="rounded-[1.4rem] border border-[#e4d6bb] bg-[#faf8f2] p-5 md:p-7">
      <h3 className="mb-2 font-serif text-2xl text-[#17151a]">{title}</h3>
      <p className="mb-5 text-sm leading-6 text-[#625f58]">{description}</p>
      <form onSubmit={submitReview} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="_subject" value="New customer review - Neel Solutions" />
        <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" style={{ display: "none" }} />
        <div>
          <label htmlFor="review-name" className="mb-1.5 block text-sm text-[#49463f]">Your name</label>
          <input id="review-name" name="name" autoComplete="name" required className="min-h-11 w-full rounded-xl border border-[#ddd3bf] bg-white px-3 text-sm text-[#29272d] outline-none focus:border-[#91a993]" />
        </div>
        <div>
          <label htmlFor="review-email" className="mb-1.5 block text-sm text-[#49463f]">Email address</label>
          <input id="review-email" name="email" type="email" autoComplete="email" required className="min-h-11 w-full rounded-xl border border-[#ddd3bf] bg-white px-3 text-sm text-[#29272d] outline-none focus:border-[#91a993]" />
        </div>
        <div>
          <label htmlFor="review-product" className="mb-1.5 block text-sm text-[#49463f]">Product (optional)</label>
          <input id="review-product" name="product" className="min-h-11 w-full rounded-xl border border-[#ddd3bf] bg-white px-3 text-sm text-[#29272d] outline-none focus:border-[#91a993]" />
        </div>
        <div>
          <label htmlFor="review-rating" className="mb-1.5 block text-sm text-[#49463f]">Your rating</label>
          <select id="review-rating" name="rating" defaultValue="5" className="min-h-11 w-full rounded-xl border border-[#ddd3bf] bg-white px-3 text-sm text-[#29272d] outline-none focus:border-[#91a993]">
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} {rating === 1 ? "star" : "stars"}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="review-text" className="mb-1.5 block text-sm text-[#49463f]">Your review</label>
          <textarea id="review-text" name="review" required rows={4} className="w-full rounded-xl border border-[#ddd3bf] bg-white px-3 py-2.5 text-sm text-[#29272d] outline-none focus:border-[#91a993]" />
        </div>
        <button type="submit" disabled={status === "sending"} className="min-h-12 rounded-full bg-[#789b80] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#62866b] disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
          {status === "sending" ? "Sending..." : "Send your review"}
        </button>
        <div aria-live="polite" className="text-sm sm:col-span-2">
          {status === "success" && <p className="text-[#3f6b4a]">Thank you! Your review has been sent.</p>}
          {status === "error" && <p className="text-[#a23b3b]">Sorry, something went wrong. Please try again in a moment.</p>}
        </div>
      </form>
    </div>
  );
}
