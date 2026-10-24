import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/ProductGrid';
import { HomeHero } from '@/components/HomeHero';

export default function StorefrontHome() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <HomeHero />

        {/* Features */}
        <section className="border-b border-emerald-100 bg-white/85 py-10 backdrop-blur-sm">
          <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: '🚚', label: 'Free Shipping', sub: 'On orders above ₹999' },
              { icon: '✅', label: 'Quality Assured', sub: '100% genuine products' },
              { icon: '🔒', label: 'Secure Payments', sub: 'COD available' },
              { icon: '📞', label: '24/7 Support', sub: 'Always here for you' },
            ].map((f) => (
              <div key={f.label} className="motion-card flex flex-col items-center gap-2 rounded-2xl border border-transparent px-3 py-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl shadow-sm">{f.icon}</span>
                <p className="font-semibold text-gray-900">{f.label}</p>
                <p className="text-xs text-gray-600">{f.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="bg-transparent py-16">
          <div className="container mx-auto px-4">
            <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Our favourites</p>
            <h2 className="mb-2 text-center text-3xl font-bold text-gray-950 md:text-4xl">Featured Products</h2>
            <p className="mb-10 text-center text-gray-600">Handpicked for your healthy lifestyle</p>
            <ProductGrid />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
