"use client";

import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const { token } = useAuth();
  interface DashboardStats { totalRevenue: number | string; totalOrders: number; totalProducts: number; recentOrders: { id: string; user: { name: string }; createdAt: string; totalAmount: number | string; status: string }[] }
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setStats(data));
    }
  }, [token]);

  if (!stats) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-7">
        <p className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">Neel Solutions · Admin</p>
        <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-gray-700">Store performance and your latest orders at a glance.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-lg shadow-emerald-950/5 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹{Number(stats.totalRevenue).toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-lg shadow-emerald-950/5 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
        </div>
        <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-lg shadow-emerald-950/5 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-500">Products</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-emerald-950/5 backdrop-blur-sm md:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm text-gray-800">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-3 font-medium">Order ID</th>
              <th className="pb-3 font-medium">Customer</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stats.recentOrders.map((order) => (
              <tr key={order.id}>
                <td className="py-3 font-mono text-xs">{order.id}</td>
                <td className="py-3">{order.user.name}</td>
                <td className="py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="py-3 font-medium">₹{Number(order.totalAmount).toFixed(2)}</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">{order.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
