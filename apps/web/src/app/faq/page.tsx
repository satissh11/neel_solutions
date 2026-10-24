import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h1>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">1. How long does delivery take?</h3>
              <p className="text-gray-600 mt-2">Delivery times vary based on your PIN code. Typically, orders are delivered within 2-5 business days.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">2. Do you offer Cash on Delivery (COD)?</h3>
              <p className="text-gray-600 mt-2">Yes, Cash on Delivery is available for most serviceable PIN codes.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">3. How can I track my order?</h3>
              <p className="text-gray-600 mt-2">Once logged in, navigate to &apos;My Account&apos; &gt; &apos;Orders&apos; to view the real-time status of your purchases.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">4. Can I cancel my order?</h3>
              <p className="text-gray-600 mt-2">Orders can be cancelled before they are marked as &apos;Shipped&apos;. Please contact our support team immediately if you wish to cancel.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
