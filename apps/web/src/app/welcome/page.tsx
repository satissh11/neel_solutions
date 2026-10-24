"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

export default function WelcomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.from('.stagger-item', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="stagger-item">
          {/* Logo Placeholder */}
          <div className="mx-auto w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">NS</span>
          </div>
          <h1 className="mt-8 text-5xl font-extrabold text-gray-900 tracking-tight">
            Neel Solutions
          </h1>
          <p className="mt-4 text-2xl font-medium text-blue-600">
            &quot;Creating Healthy World&quot;
          </p>
        </div>
        
        <p className="stagger-item text-lg text-gray-600 max-w-xl mx-auto">
          Welcome to our brand new e-commerce platform. We are dedicated to providing the best quality products for a healthier lifestyle.
        </p>
        
        <div className="stagger-item">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Explore Products
          </button>
        </div>
      </div>
    </div>
  );
}
