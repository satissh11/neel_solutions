import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-16 max-w-4xl prose prose-blue">
          <h1>Privacy Policy</h1>
          <p>At Neel Solutions, we take your privacy seriously. This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from neelsolutions.in.</p>
          
          <h2>Information We Collect</h2>
          <p>When you make a purchase or attempt to make a purchase, we collect certain information from you, including your name, billing address, shipping address, and email address. This is referred to as &quot;Order Information&quot;.</p>
          
          <h2>How We Use Your Information</h2>
          <p>We use the Order Information that we collect generally to fulfill any orders placed through the Site (including arranging for shipping and providing you with invoices and/or order confirmations).</p>
          
          <h2>Data Security</h2>
          <p>We implement industry-standard security measures to protect your personal information. Your passwords are securely hashed, and your sessions are protected using JSON Web Tokens (JWT).</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
