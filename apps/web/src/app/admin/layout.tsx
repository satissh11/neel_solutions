"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const { logoUrl } = useSiteSettings();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect after auth state has been fully loaded from localStorage
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Show loading state while auth restores from localStorage
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Not an admin — redirect will fire via useEffect, render nothing
  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-gray-100 md:flex md:h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 bg-gradient-to-b from-[#173f34] via-[#12382f] to-[#0b2e28] text-white shadow-2xl md:flex md:flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link href="/" aria-label="Neel Solutions home" className="brand-logo-frame inline-flex rounded-lg bg-white p-1">
            <Image src={logoUrl || '/brand-logo.svg'} alt="Neel Solutions" width={200} height={52} unoptimized className="h-10 w-auto max-w-[200px] object-contain" />
          </Link>
          <p className="text-xs text-gray-400 mt-1">Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className={`block rounded-lg px-4 py-2.5 transition-colors ${pathname === '/admin' ? 'bg-emerald-700 shadow-sm' : 'hover:bg-white/10'}`}>
            Overview
          </Link>
          <Link href="/admin/orders" className={`block rounded-lg px-4 py-2.5 transition-colors ${pathname === '/admin/orders' ? 'bg-emerald-700 shadow-sm' : 'hover:bg-white/10'}`}>
            Orders
          </Link>
          <Link href="/admin/reviews" className={`block rounded-lg px-4 py-2.5 transition-colors ${pathname === '/admin/reviews' ? 'bg-emerald-700 shadow-sm' : 'hover:bg-white/10'}`}>
            Reviews
          </Link>
          <Link href="/admin/products" className={`block rounded-lg px-4 py-2.5 transition-colors ${pathname === '/admin/products' ? 'bg-emerald-700 shadow-sm' : 'hover:bg-white/10'}`}>
            Products
          </Link>
          <Link href="/admin/coupons" className={`block rounded-lg px-4 py-2.5 transition-colors ${pathname === '/admin/coupons' ? 'bg-emerald-700 shadow-sm' : 'hover:bg-white/10'}`}>
            Discounts
          </Link>
          <Link href="/admin/settings" className={`block rounded-lg px-4 py-2.5 transition-colors ${pathname === '/admin/settings' ? 'bg-emerald-700 shadow-sm' : 'hover:bg-white/10'}`}>
            Store branding
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <p className="text-sm text-gray-400 mb-2">{user.name}</p>
          <button onClick={() => { logout(); router.push('/'); }} className="w-full text-left text-sm text-red-400 hover:text-red-300">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav aria-label="Admin navigation" className="sticky top-0 z-20 flex gap-1 overflow-x-auto border-b border-emerald-950 bg-[#12382f] px-2 py-2 text-sm text-white shadow-md md:hidden">
          {[
            ['/admin', 'Overview'], ['/admin/orders', 'Orders'], ['/admin/reviews', 'Reviews'], ['/admin/products', 'Products'],
            ['/admin/coupons', 'Discounts'], ['/admin/settings', 'Branding'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className={`whitespace-nowrap rounded-md px-3 py-2 ${pathname === href ? 'bg-emerald-700 font-semibold' : 'text-gray-200 hover:bg-white/10'}`}>
              {label}
            </Link>
          ))}
          <button onClick={() => { logout(); router.push('/'); }} className="ml-auto whitespace-nowrap rounded-md px-3 py-2 text-red-200 hover:bg-gray-800">Sign out</button>
        </nav>
        {/* Main Content */}
        <main
          className="min-h-0 min-w-0 flex-1 overflow-auto bg-cover bg-center bg-fixed text-gray-900"
          style={{ backgroundImage: 'radial-gradient(ellipse at 14% 8%, rgba(255,255,255,.55), transparent 34%), radial-gradient(ellipse at 88% 30%, rgba(211,231,198,.35), transparent 38%), linear-gradient(rgba(244,249,242,.72), rgba(244,249,242,.72)), url("/admin-nature.svg")' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
