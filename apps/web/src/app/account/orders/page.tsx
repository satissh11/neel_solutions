"use client";

import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import type { StoreOrder } from '@/types/store';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DISPATCHED: 'bg-indigo-100 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function MyOrdersPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    fetch(`${API_BASE_URL}/api/v1/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load your orders.');
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load your orders.'))
      .finally(() => setLoading(false));
  }, [authLoading, token]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-500 mb-8">Track and manage all your orders</p>

          {authLoading || (Boolean(token) && loading) ? (
            <div className="text-center py-16">Loading orders...</div>
          ) : !token ? (
            <div className="rounded-xl bg-white p-8 text-center shadow"><p className="mb-4 text-gray-700">Sign in to see and track your orders.</p><Link href="/login?returnTo=%2Faccount%2Forders" className="inline-flex rounded-lg bg-emerald-800 px-5 py-2.5 font-semibold text-white">Sign in</Link></div>
          ) : error ? (
            <div role="alert" className="rounded-xl bg-red-50 p-5 text-center text-red-800">{error}<div><Button className="mt-4" onClick={() => window.location.reload()}>Try again</Button></div></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow">
              <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet.</p>
              <Link href="/products" className="text-blue-600 hover:underline">Start Shopping →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
              <div key={order.id} className="motion-card rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-emerald-950/5 backdrop-blur-sm md:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-xs text-gray-400 mb-1"># {order.id}</p>
                      <p className="font-semibold text-gray-800">{order.items?.length || 0} item(s)</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-lg">₹{Number(order.totalAmount).toFixed(2)}</p>
                      <span className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status === 'SHIPPED' || order.status === 'DISPATCHED' ? 'Dispatched' : order.status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : order.status}
                      </span>
                    </div>
                  </div>
                <Link href={`/orders/${order.id}`} className="mt-4 inline-flex rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900">Track your order →</Link>
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
