"use client";

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { FormEvent } from 'react';

export default function ContactPage() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = `Website enquiry from ${String(form.get('name'))}`;
    const body = `Name: ${String(form.get('name'))}\nEmail: ${String(form.get('email'))}\n\n${String(form.get('message'))}`;
    window.location.href = `mailto:neelengineering2022@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-[#f8f6ef]">
        <section className="border-b border-[#e8ddca] bg-[#f0efe5] py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#78977d]">We’re here to help</p>
            <h1 className="text-4xl leading-tight tracking-[-0.035em] md:text-5xl">Contact Neel Solutions</h1>
            <p className="mt-4 max-w-2xl leading-7 text-[#625f58]">Questions about a product or order? Send a note to our team.</p>
          </div>
        </section>
        <div className="container mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[.8fr_1.2fr] md:px-8 md:py-16">
          <div className="rounded-[1.4rem] border border-[#e4d6bb] bg-[#f0efe5] p-6 md:p-8">
            {/* Contact Info */}
            <div>
              <h2 className="mb-6 text-2xl">Get in touch</h2>
              <div className="space-y-5">
                <div>
                  <h3 className="mb-1 font-semibold text-[#17151a]">Email support</h3>
                  <a href="mailto:neelengineering2022@gmail.com" className="text-sm text-[#587960] hover:underline">
                    neelengineering2022@gmail.com
                  </a>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-[#17151a]">Business</h3>
                  <p className="text-sm text-[#625f58]">Neel Solutions (Neel Group)</p>
                </div>
              </div>
            </div>
          </div>
          <form className="space-y-4 rounded-[1.4rem] border border-[#e4d6bb] bg-[#fbf8f1] p-6 md:p-8" onSubmit={handleSubmit}>
              <h2 className="mb-2 text-2xl">Send us a message</h2>
              <div>
                <label htmlFor="contact-name" className="text-sm font-medium text-gray-700">Name</label>
                <Input id="contact-name" name="name" required className="mt-1" />
              </div>
              <div>
                <label htmlFor="contact-email" className="text-sm font-medium text-gray-700">Email Address</label>
                <Input id="contact-email" name="email" type="email" required className="mt-1" />
              </div>
              <div>
                <label htmlFor="contact-message" className="text-sm font-medium text-gray-700">Message</label>
                <textarea 
                  id="contact-message" name="message" required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 min-h-[120px]"
                ></textarea>
              </div>
              <Button type="submit" className="w-full sm:w-auto">Continue in email</Button>
              <p className="text-xs leading-5 text-[#79766d]">Your email app will open with your message addressed to our support team.</p>
          </form>
          </div>
      </main>
      <Footer />
    </div>
  );
}
