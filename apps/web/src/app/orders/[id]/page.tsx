"use client";

import { API_BASE_URL } from '@/lib/api';
import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import type { StoreOrder } from '@/types/store';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Dispatched',
  DISPATCHED: 'Dispatched',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-gray-100 text-gray-700',
};
const TRACKING_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function OrderDetail() {
  const { id } = useParams();
  const { token, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    let active = true;
    const loadOrder = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load this order.');
        if (active) { setOrder(data); setError(''); }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load this order.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadOrder();
    const timer = window.setInterval(() => void loadOrder(), 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [authLoading, id, token]);

  if (authLoading || (Boolean(token) && loading)) return <div className="text-center py-20 text-gray-700">Loading order details...</div>;
  if (!token) return <div className="text-center py-20 text-gray-700">Please <Link href={`/login?returnTo=${encodeURIComponent(`/orders/${id}`)}`} className="font-semibold text-emerald-800 underline">sign in</Link> to track your order.</div>;
  if (error || !order) return <div role="alert" className="text-center py-20 text-gray-700">{error || 'Order not found.'}<div><Link href="/account/orders" className="mt-4 inline-block font-semibold text-emerald-800 underline">Back to My Orders</Link></div></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 text-center shadow-sm">
        <div className="text-4xl mb-3">📦</div>
        <h2 className="text-2xl font-bold text-green-800">Track your order</h2>
        <p className="text-green-700 mt-1">Order status refreshes automatically every 30 seconds.</p>
      </div>

      <div className="motion-card space-y-6 rounded-2xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-emerald-950/5 backdrop-blur-sm md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="font-mono text-sm text-gray-800">{order.id}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>

        <section className="border-t pt-5">
          <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-gray-900">Order progress</h3><span className="text-xs text-gray-500">Refreshes automatically</span></div>
          {['CANCELLED', 'RETURNED'].includes(order.status) ? (
            <p className="mt-3 rounded-lg bg-gray-100 p-3 text-sm font-medium text-gray-800">This order was {order.status.toLowerCase()}.</p>
          ) : (
            <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {TRACKING_STEPS.map((status, index) => {
                const currentIndex = TRACKING_STEPS.indexOf(order.status === 'SHIPPED' ? 'DISPATCHED' : order.status);
                const completed = currentIndex >= index;
                return <li key={status} className={`rounded-xl border p-3 text-center ${completed ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                  <span className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${completed ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-600'}`}>{completed ? '✓' : index + 1}</span>
                  <span className={`text-xs font-semibold ${completed ? 'text-emerald-900' : 'text-gray-500'}`}>{STATUS_LABELS[status]}</span>
                </li>;
              })}
            </ol>
          )}
          <ul className="mt-4 space-y-2">
            {(order.statusUpdates || []).map((update: { id: string; status: string; createdAt: string }) => (
              <li key={update.id} className="flex flex-wrap justify-between gap-2 border-l-2 border-emerald-600 pl-3 text-sm text-gray-700">
                <span className="font-medium">{STATUS_LABELS[update.status] || update.status}</span>
                <time className="text-gray-500">{new Date(update.createdAt).toLocaleString('en-IN')}</time>
              </li>
            ))}
          </ul>
        </section>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-800 mb-3">Items Ordered</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-700">
                <span>{item.productName} × {item.quantity}</span>
                <span className="font-medium">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{Number(order.shippingFee) === 0 ? 'FREE' : `₹${Number(order.shippingFee).toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base">
            <span>Total</span>
            <span>₹{Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-800 mb-1">Delivery Address</h3>
          <p className="text-sm text-gray-600">{order.shippingAddr}</p>
          <p className="text-sm text-gray-600">PIN: {order.shippingPin}</p>
          {order.shippingPhone && <p className="text-sm text-gray-600">Mobile: {order.shippingPhone}</p>}
          {order.whatsappUpdates && <p className="text-xs text-emerald-800">WhatsApp status updates enabled for this order.</p>}
        </div>

        <div className="border-t pt-4">
          <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
            💵 Payment: <strong>Cash on Delivery</strong> — Pay when your order arrives.
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <Link href="/account/orders" className="flex-1 text-center border border-gray-300 rounded-md py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          View All Orders
        </Link>
        <Link href="/products" className="flex-1 rounded-lg bg-emerald-800 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-900">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
            <OrderDetail />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
