"use client";

import { API_BASE_URL } from '@/lib/api';
import { readApiResponse } from '@/lib/api-response';
import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import Image from 'next/image';
import type { StoreProduct } from '@/types/store';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/products`)
      .then(res => readApiResponse<StoreProduct[]>(res))
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(reason => {
        setError(reason instanceof Error ? reason.message : 'Could not load products.');
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? products.filter(product => product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)) : products;
  }, [search, products]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Shop wellness</p>
          <h1 className="mb-2 text-3xl font-bold text-gray-950 md:text-4xl">All Products</h1>
          <p className="mb-8 text-gray-600">Browse our full range of health products</p>

          {/* Search Bar */}
          <div className="mb-8 max-w-lg rounded-2xl border border-white/80 bg-white/75 p-2 shadow-sm backdrop-blur-sm">
            <Input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500">Loading products...</div>
          ) : error ? (
            <div role="alert" className="text-center py-16 text-red-700">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No products found for your search.</div>
          ) : (
            <div className="stagger-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((product) => (
                <div key={product.id} className="motion-card group flex flex-col rounded-2xl border border-white/80 bg-white/95 p-4 shadow-md shadow-emerald-950/5 backdrop-blur-sm">
                  <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-lime-50 text-gray-500">
                    {product.images?.[0] ? (
                      <Image src={product.images[0].url} alt={product.name} width={500} height={500} unoptimized className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : 'No Image'}
                  </div>
                  <span className="mb-1 text-xs font-semibold text-emerald-800">{product.category?.name}</span>
                  <h3 className="font-semibold text-gray-950 transition-colors group-hover:text-emerald-800">
                    <Link href={`/products/${product.id}`}>{product.name}</Link>
                  </h3>
                  <p className="mb-2 mt-1 line-clamp-2 text-sm text-gray-600">{product.description}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="font-bold text-gray-950">₹{Number(product.price).toFixed(2)}</span>
                    <Link href={`/products/${product.id}`} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
