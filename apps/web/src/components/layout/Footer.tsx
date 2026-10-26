import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#e5d9c2] bg-[#f0efe5] py-12 text-[#625f58]">
      <div className="container mx-auto grid grid-cols-1 gap-9 px-4 md:grid-cols-4 md:px-8">
        <div>
          <Image src="/brand-logo.svg" alt="Neel Solutions — Creating Healthy World" width={220} height={56} style={{ width: 'auto' }} className="mb-4 h-12 w-auto max-w-full" />
          <p className="mb-4 max-w-xs text-sm leading-6 text-[#706d64]">
            Creating Healthy World. We provide high-quality products for a healthier and better lifestyle.
          </p>
        </div>
        
        <div>
          <h3 className="mb-4 font-serif text-sm font-normal uppercase tracking-[0.16em] text-[#7b927b]">Quick Links</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/products" className="hover:text-white transition-colors">Shop</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="mb-4 font-serif text-sm font-normal uppercase tracking-[0.16em] text-[#7b927b]">Policies</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/shipping-policy" className="hover:text-white transition-colors">Shipping Policy</Link></li>
            <li><Link href="/returns" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-serif text-sm font-normal uppercase tracking-[0.16em] text-[#7b927b]">Contact</h3>
          <ul className="space-y-2.5 text-sm">
            <li>Email: neelengineering2022@gmail.com</li>
            <li>Follow us on social media for updates.</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto mt-8 border-t border-[#dfd2bb] px-4 pt-6 text-sm text-[#817d72] md:px-8">
        &copy; 2026 Neel Solutions. All rights reserved.
      </div>
    </footer>
  );
}

