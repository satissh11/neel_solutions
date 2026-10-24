"use client";

import { API_BASE_URL } from '@/lib/api';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import type { StoreProduct } from '@/types/store';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState('');
  const { addItem } = useCart();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/products/${id}`)
      .then(res => res.json())
      .then(data => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: qty,
      image: product.images?.[0]?.url,
    });
    setMessage('Added to cart! ✅');
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div className="flex items-center justify-center py-20">Loading product...</div>;

  if (!product) return (
    <div className="flex items-center justify-center py-20 flex-col gap-4">
      <p className="text-gray-500">Product not found.</p>
      <Link href="/products" className="text-blue-600 hover:underline">← Back to Products</Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/products" className="mb-6 inline-block text-sm font-medium text-emerald-800 hover:underline">← Back to Products</Link>
      <div className="motion-card grid grid-cols-1 gap-8 rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-emerald-950/5 backdrop-blur-sm md:grid-cols-2 md:gap-10 md:p-8">
        {/* Product Image */}
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50">
          {product.images?.[0] ? (
            <Image src={product.images[0].url} alt={product.name} width={720} height={720} unoptimized className="object-cover w-full h-full" />
          ) : (
            <span className="text-gray-400">No Image Available</span>
          )}
        </div>
        {/* Product Info */}
        <div className="flex flex-col gap-4">
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-900">
            {product.category?.name}
          </span>
          <h1 className="text-3xl font-bold text-gray-950 md:text-4xl">{product.name}</h1>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
          <div className="mt-2 text-4xl font-extrabold text-emerald-950">
            ₹{Number(product.price).toFixed(2)}
          </div>
          <p className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.stock > 0 ? `✅ In Stock (${product.stock} available)` : '❌ Out of Stock'}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center border rounded-md overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">-</button>
              <span className="px-4 py-2 font-medium">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">+</button>
            </div>
            <Button onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1">
              Add to Cart
            </Button>
          </div>
          {message && <p className="text-green-600 text-sm font-medium mt-1">{message}</p>}
          <div className="border-t pt-4 mt-2 text-sm text-gray-500">
            <p>SKU: <span className="font-medium text-gray-700">{product.sku}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">
        <Suspense fallback={<div className="flex items-center justify-center py-20">Loading...</div>}>
          <ProductDetail />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
