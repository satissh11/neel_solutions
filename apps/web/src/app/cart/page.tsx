"use client";

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import Image from 'next/image';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCart();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Almost yours</p>
          <h1 className="mb-8 text-3xl font-bold text-gray-950 md:text-4xl">Your Cart</h1>

          {items.length === 0 ? (
            <div className="motion-card rounded-3xl border border-white/80 bg-white/90 py-20 text-center shadow-xl shadow-emerald-950/5 backdrop-blur-sm">
              <p className="text-gray-500 text-lg mb-4">Your cart is empty.</p>
              <Link href="/products">
                <Button>Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="motion-card flex gap-4 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-md shadow-emerald-950/5 backdrop-blur-sm">
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-lime-50">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={96} height={96} unoptimized className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-xs text-gray-400">No Img</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="mt-1 font-bold text-emerald-900">₹{item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border rounded-md overflow-hidden">
                          <button onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 font-bold">-</button>
                          <span className="px-3 py-1">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 font-bold">+</button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-sm text-red-500 hover:text-red-700">Remove</button>
                      </div>
                    </div>
                    <div className="text-right font-bold text-gray-800">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
                <button onClick={clearCart} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                  Clear cart
                </button>
              </div>

              {/* Order Summary */}
              <div className="motion-card h-fit rounded-2xl border border-white/80 bg-white/95 p-6 shadow-lg shadow-emerald-950/5 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-800">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-gray-900 text-base">
                    <span>Total</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                <Link href="/checkout">
                  <Button className="w-full mt-6">Proceed to Checkout</Button>
                </Link>
                <Link href="/products" className="block text-center text-sm text-blue-600 hover:underline mt-3">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
