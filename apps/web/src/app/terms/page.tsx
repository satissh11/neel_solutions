import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-16 max-w-4xl prose prose-blue">
          <h1>Terms and Conditions</h1>
          
          <h2>1. Introduction</h2>
          <p>Welcome to Neel Solutions. By accessing our website, you agree to be bound by these Terms and Conditions and our Privacy Policy.</p>
          
          <h2>2. Products and Pricing</h2>
          <p>All products listed on the website are subject to availability. We reserve the right to modify prices without prior notice. The price displayed at the time of checkout is the final price.</p>
          
          <h2>3. Intellectual Property</h2>
          <p>All content included on this site, such as text, graphics, logos, and images, is the property of Neel Group and protected by intellectual property laws.</p>
          
          <h2>4. Limitation of Liability</h2>
          <p>Neel Solutions shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our products or website.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
