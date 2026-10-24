import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ReturnsPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-16 max-w-4xl prose prose-blue">
          <h1>Returns and Refunds Policy</h1>
          
          <h2>Returns</h2>
          <p>We accept returns within 7 days of delivery for items that are unused, unopened, and in their original packaging. Health supplements and personal care items cannot be returned if the seal is broken due to hygiene and safety reasons.</p>
          
          <h2>Refunds</h2>
          <p>Once we receive and inspect your return, we will notify you of the approval or rejection of your refund. Approved refunds will be processed back to the original method of payment (or via bank transfer for COD orders) within 5-7 business days.</p>

          <h2>Damaged or Defective Items</h2>
          <p>If you receive a damaged or defective product, please contact us at neelengineering2022@gmail.com within 48 hours of delivery with photographic evidence.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
