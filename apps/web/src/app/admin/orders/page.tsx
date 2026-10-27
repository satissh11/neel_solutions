"use client";

import { API_BASE_URL } from '@/lib/api';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AdminOrder {
  id: string;
  status: string;
  createdAt: string;
  totalAmount: string | number;
  shippingFee: string | number;
  taxAmount: string | number;
  shippingAddr: string;
  shippingPin: string;
  shippingPhone: string | null;
  whatsappUpdates: boolean;
  whatsappMessages: { id: string; templateName: string; state: string; attempts: number; lastErrorCode: string | null; lastErrorMessage: string | null; createdAt: string; sentAt: string | null; deliveredAt: string | null; readAt: string | null }[];
  returnRequest: { id: string; reason: string; details: string | null; status: 'REQUESTED' | 'APPROVED' | 'REJECTED'; adminNote: string | null; createdAt: string } | null;
  user: { name: string; email: string };
  items: { id: string; productName: string; price: string | number; quantity: number }[];
}

const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'];
const statusLabels: Record<string, string> = { SHIPPED: 'Shipped (legacy)', DISPATCHED: 'Dispatched', OUT_FOR_DELIVERY: 'Out for Delivery' };

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/orders`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load orders.');
      setOrders(Array.isArray(data) ? data : []);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load orders.');
    }
  }, [token]);

  // Load server state when the admin session becomes available.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  const updateReturn = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!token) return;
    const adminNote = window.prompt(status === 'APPROVED' ? 'Optional note for the customer (pickup/refund details):' : 'Optional reason for rejecting this return:') ?? '';
    setUpdatingOrder(id);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/orders/${id}/return`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, adminNote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update the return request.');
      setNotice(`Return ${status === 'APPROVED' ? 'approved' : 'rejected'}. After the parcel comes back, set the order status to Returned.`);
      await fetchOrders();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update the return request.');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (!token) return;
    setUpdatingOrder(id);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update order status.');
      setNotice(data.whatsapp?.queued
        ? 'Order status updated. WhatsApp notification queued.'
        : `Order status updated. ${data.whatsapp?.reason || 'In-app tracking is updated.'}`);
      await fetchOrders();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update order status.');
    } finally {
      setUpdatingOrder(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-7">
        <p className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">Fulfilment</p>
        <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">Order Management</h1>
        <p className="mt-2 text-sm text-gray-700">Review customer details, delivery addresses, items, and update order status.</p>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
      <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-lg shadow-emerald-950/5 backdrop-blur-sm">
        {orders.length === 0 ? (
          <div className="p-10 text-center text-gray-700">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm text-gray-900">
              <thead className="border-b bg-emerald-50/80">
                <tr>
                  <th className="px-4 py-4 font-semibold text-gray-700">Details</th>
                  <th className="px-4 py-4 font-semibold text-gray-700">Order ID</th>
                  <th className="px-4 py-4 font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-4 font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-4 font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-4 font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-4 font-semibold text-gray-700">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => (
                  <Fragment key={order.id}>
                    <tr className="transition-colors hover:bg-emerald-50/40">
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => setExpandedOrder(current => current === order.id ? null : order.id)} className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50">
                          {expandedOrder === order.id ? 'Hide' : 'View'}
                        </button>
                      </td>
                      <td className="max-w-32 break-all px-4 py-4 font-mono text-xs text-gray-700">{order.id.slice(0, 12)}…</td>
                      <td className="px-4 py-4"><p className="font-semibold">{order.user.name}</p><p className="text-xs text-gray-600">{order.user.email}</p></td>
                      <td className="whitespace-nowrap px-4 py-4 text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold">₹{Number(order.totalAmount).toFixed(2)}</td>
                      <td className="px-4 py-4"><span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">{statusLabels[order.status] || order.status}</span>{order.returnRequest && <span className={`mt-1 flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${order.returnRequest.status === 'REQUESTED' ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-800'}`}>Return {order.returnRequest.status.toLowerCase()}</span>}</td>
                      <td className="px-4 py-4">
                        <select aria-label={`Update order ${order.id} status`} value={order.status} disabled={updatingOrder === order.id} onChange={event => updateStatus(order.id, event.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 disabled:opacity-60">
                          {statuses.map(status => <option key={status} value={status}>{statusLabels[status] || status}</option>)}
                        </select>
                      </td>
                    </tr>
                    {expandedOrder === order.id && (
                      <tr key={`${order.id}-details`} className="bg-emerald-50/50">
                        <td colSpan={7} className="px-5 py-5">
                          <div className="grid gap-5 md:grid-cols-2">
                            <section>
                              <h2 className="mb-2 text-sm font-bold text-gray-900">Delivery address</h2>
                              <p className="whitespace-pre-line text-sm text-gray-800">{order.shippingAddr}</p>
                              <p className="mt-1 text-sm font-medium text-gray-800">PIN: {order.shippingPin}</p>
                              <p className="mt-1 text-sm text-gray-800">Mobile: {order.shippingPhone || 'Not provided for this order'}</p>
                              <p className="text-sm text-gray-800">WhatsApp updates: {order.whatsappUpdates ? 'Opted in' : 'Not opted in'}</p>
                              {order.whatsappUpdates && <div className="mt-3"><h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-600">WhatsApp delivery log</h3>{order.whatsappMessages.length ? <ul className="space-y-1 text-xs text-gray-700">{order.whatsappMessages.map(message => <li key={message.id} className="rounded-md bg-white/80 p-2"><span className="font-semibold">{message.templateName}</span> · {message.state} · {message.attempts} attempt(s){message.lastErrorCode && <span className="block text-red-700">{message.lastErrorCode}: {message.lastErrorMessage}</span>}</li>)}</ul> : <p className="text-xs text-gray-600">No eligible status notification queued yet.</p>}</div>}
                              {order.returnRequest && (
                                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                  <h3 className="text-xs font-bold uppercase tracking-wide text-amber-900">Return request · {order.returnRequest.status.toLowerCase()}</h3>
                                  <p className="mt-1 text-sm text-gray-900">Reason: {order.returnRequest.reason}</p>
                                  {order.returnRequest.details && <p className="mt-1 whitespace-pre-line text-sm text-gray-800">{order.returnRequest.details}</p>}
                                  {order.returnRequest.adminNote && <p className="mt-1 text-xs text-gray-700">Your note: {order.returnRequest.adminNote}</p>}
                                  {order.returnRequest.status === 'REQUESTED' && (
                                    <div className="mt-3 flex gap-2">
                                      <button type="button" disabled={updatingOrder === order.id} onClick={() => updateReturn(order.id, 'APPROVED')} className="rounded-md bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">Approve return</button>
                                      <button type="button" disabled={updatingOrder === order.id} onClick={() => updateReturn(order.id, 'REJECTED')} className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60">Reject</button>
                                    </div>
                                  )}
                                </div>
                              )}
                              <p className="mt-3 text-xs text-gray-600">Shipping ₹{Number(order.shippingFee).toFixed(2)} · Tax ₹{Number(order.taxAmount).toFixed(2)}</p>
                            </section>
                            <section>
                              <h2 className="mb-2 text-sm font-bold text-gray-900">Items ({order.items.length})</h2>
                              <ul className="space-y-2">
                                {order.items.map(item => <li key={item.id} className="flex justify-between gap-4 text-sm text-gray-800"><span>{item.productName} × {item.quantity}</span><span className="whitespace-nowrap font-medium">₹{(Number(item.price) * item.quantity).toFixed(2)}</span></li>)}
                              </ul>
                            </section>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
