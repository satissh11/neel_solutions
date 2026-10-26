"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { logoUrl } = useSiteSettings();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-100 bg-white/90 shadow-sm shadow-emerald-950/5 backdrop-blur-xl">
      <div className="container mx-auto flex min-h-16 flex-wrap items-center justify-between gap-y-1 px-4 py-2 md:h-16 md:flex-nowrap md:py-0">
        <Link href="/" aria-label="Neel Solutions home" className="brand-logo-frame flex min-w-0 shrink-0 items-center">
          <Image src={logoUrl || '/brand-logo.svg'} alt="Neel Solutions — Creating Healthy World" width={220} height={56} unoptimized className="h-10 w-auto max-w-[180px] object-contain sm:max-w-[220px] md:h-12" />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-800">Home</Link>
          <Link href="/products" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-800">Products</Link>
          <Link href="/about" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-800">About</Link>
          <Link href="/contact" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-800">Contact</Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3 md:ml-0 md:gap-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-emerald-50 md:hidden"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-site-navigation"
            onClick={() => setMobileMenuOpen(open => !open)}
          >
            {mobileMenuOpen ? (
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m18 6-12 12M6 6l12 12" /></svg>
            ) : (
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
          <Link href="/cart" className="relative flex items-center gap-1 text-sm font-medium text-gray-700 transition-colors hover:text-emerald-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-800 text-xs text-white">{totalItems}</span>
            )}
          </Link>
          
          {user ? (
            <div className="hidden items-center gap-3 ml-2 border-l pl-4 md:flex">
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">Hi, {user.name}</span>
              <Link href="/account/orders" className="text-xs font-semibold text-emerald-800 hover:underline">My Orders</Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-xs font-bold text-emerald-800 hover:underline">Admin</Link>
              )}
              <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900">Logout</button>
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-1 text-sm font-medium text-gray-700 transition-colors hover:text-emerald-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span className="hidden sm:inline">Account</span>
            </Link>
          )}
        </div>

        <nav id="mobile-site-navigation" aria-label="Mobile navigation" className={`${mobileMenuOpen ? 'flex' : 'hidden'} basis-full flex-col border-t border-emerald-100 pt-2 md:hidden`}>
          <Link onClick={() => setMobileMenuOpen(false)} href="/" className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-emerald-50">Home</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="/products" className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-emerald-50">Products</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="/about" className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-emerald-50">About</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="/contact" className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-emerald-50">Contact</Link>
          {user && (
            <>
              <Link onClick={() => setMobileMenuOpen(false)} href="/account/orders" className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-emerald-50">My Orders</Link>
              {user.role === 'ADMIN' && <Link onClick={() => setMobileMenuOpen(false)} href="/admin" className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-emerald-50">Admin</Link>}
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-emerald-50">Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
