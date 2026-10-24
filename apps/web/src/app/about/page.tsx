import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About Us</h1>
          <div className="prose prose-blue max-w-none">
            <p className="text-xl text-gray-600 mb-8">
              Welcome to <strong>Neel Solutions</strong>. We are a part of the Neel Group, dedicated to our tagline: <em>&quot;Creating Healthy World&quot;</em>.
            </p>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
            <p className="mb-4">
              Our mission is to provide high-quality health and wellness products that empower individuals to lead better, healthier lives. We believe that a healthy world starts with healthy individuals, and we are committed to sourcing and delivering the best products directly to your doorstep.
            </p>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Quality Assurance</h2>
            <p className="mb-4">
              Every product available on Neel Solutions undergoes rigorous quality checks. We stand by the authenticity and efficacy of our inventory, ensuring that you receive exactly what you need to support your health journey.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
