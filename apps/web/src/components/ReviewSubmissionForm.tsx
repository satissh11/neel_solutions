"use client";

import type { FormEvent } from "react";

export function ReviewSubmissionForm({ title, description }: { title: string; description: string }) {
  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = `Customer review: ${String(form.get("rating"))} stars`;
    const body = [
      `Name: ${String(form.get("name"))}`,
      `Email: ${String(form.get("email"))}`,
      `Product: ${String(form.get("product") || "Not specified")}`,
      `Rating: ${String(form.get("rating"))} / 5`,
      "",
      String(form.get("review")),
    ].join("\n");

    window.location.href = `mailto:neelengineering2022@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="rounded-[1.4rem] border border-[#e4d6bb] bg-[#faf8f2] p-5 md:p-7">
      <h3 className="mb-2 font-serif text-2xl text-[#17151a]">{title}</h3>
      <p className="mb-5 text-sm leading-6 text-[#625f58]">{description}</p>
      <form onSubmit={submitReview} className="grid gap-4 sm:grid-cols-2">
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
        <button type="submit" className="min-h-12 rounded-full bg-[#789b80] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#62866b] sm:col-span-2 sm:justify-self-start">Send your review</button>
      </form>
    </div>
  );
}
