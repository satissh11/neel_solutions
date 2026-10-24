import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ShippingPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-16 max-w-4xl prose prose-blue">
          <h1>Shipping Policy</h1>
          <p>Effective Date: October 10, 2026</p>
          
          <h2>Processing Time</h2>
          <p>All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or public holidays.</p>
          
          <h2>Shipping Rates & Delivery Estimates</h2>
          <p>Shipping charges for your order will be calculated and displayed at checkout.</p>
          <ul>
            <li><strong>Standard Delivery:</strong> ₹60 (Free on orders above ₹999)</li>
            <li><strong>Delivery Time:</strong> 2-5 business days depending on the destination PIN code.</li>
          </ul>

          <h2>Serviceable Areas</h2>
          <p>We currently ship to select PIN codes across India. You can verify if we deliver to your area by entering your PIN code on the checkout page.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
