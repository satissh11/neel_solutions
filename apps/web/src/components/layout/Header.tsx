"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { logoUrl } = useSiteSettings();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-100 bg-white/90 shadow-sm shadow-emerald-950/5 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Neel Solutions home" className="brand-logo-frame flex min-w-0 items-center">
          <Image src={logoUrl || '/brand-logo.svg'} alt="Neel Solutions — Creating Healthy World" width={220} height={56} unoptimized className="h-12 w-auto max-w-[220px] object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-800">Home</Link>
          <Link href="/products" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-800">Products</Link>
          <Link href="/about" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-800">About</Link>
          <Link href="/contact" className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-800">Contact</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative flex items-center gap-1 text-sm font-medium text-gray-700 transition-colors hover:text-emerald-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-800 text-xs text-white">{totalItems}</span>
            )}
          </Link>
          
          {user ? (
            <div className="flex items-center gap-3 ml-2 border-l pl-4">
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
      </div>
    </header>
  );
}
