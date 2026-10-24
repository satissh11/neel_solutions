"use client";

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-8 rounded-xl shadow-sm">
            
            {/* Contact Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h1>
              <p className="text-gray-600 mb-8">
                Have a question about our products or your order? We&apos;re here to help. Reach out to us using the details below or fill out the form.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Email Support</h3>
                  <a href="mailto:neelengineering2022@gmail.com" className="text-blue-600 hover:underline">
                    neelengineering2022@gmail.com
                  </a>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Business Name</h3>
                  <p className="text-gray-600">Neel Solutions (Neel Group)</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Input required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <Input type="email" required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <textarea 
                  required 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 min-h-[120px]"
                ></textarea>
              </div>
              <Button type="submit" className="w-full">Send Message</Button>
            </form>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
