"use client";

import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { StoreProduct } from '@/types/store';

export function ProductGrid() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading products...</div>;
  }

  if (products.length === 0) {
    return <div className="text-center py-12 text-gray-500">No products available at the moment.</div>;
  }

  return (
    <div className="stagger-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <div key={product.id} className="motion-card group flex flex-col rounded-2xl border border-white/80 bg-white/95 p-4 shadow-md shadow-emerald-950/5 backdrop-blur-sm">
          <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-lime-50 text-gray-500">
            {product.images?.[0] ? (
              <Image src={product.images[0].url} alt={product.name} width={500} height={500} unoptimized className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              'No Image'
            )}
          </div>
          <h3 className="font-semibold text-gray-950 transition-colors group-hover:text-emerald-800">
            <Link href={`/products/${product.id}`}>
              {product.name}
            </Link>
          </h3>
          <p className="text-gray-500 text-sm mt-1 mb-2 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between mt-auto pt-4 border-t">
            <span className="font-bold text-gray-950">₹{Number(product.price).toFixed(2)}</span>
            <Link href={`/products/${product.id}`} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100">
              View
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
