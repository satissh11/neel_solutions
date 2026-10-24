"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Coupon { id: string; code: string; discountType: 'PERCENTAGE' | 'FIXED'; discountValue: string; minOrderAmount: string | null; maxUses: number | null; usedCount: number; validFrom: string; validUntil: string | null; isActive: boolean }
const initialForm = { code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '', maxUses: '', validFrom: '', validUntil: '', isActive: true };

export default function AdminCoupons() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/coupons`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load discounts.');
    setCoupons(data);
  }, [token]);
  // Fetching remote data after the auth token changes is an intentional effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load discounts.')); }, [load]);

  const beginEdit = (coupon: Coupon) => {
    setEditing(coupon.id);
    setForm({ code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, minOrderAmount: coupon.minOrderAmount || '', maxUses: coupon.maxUses == null ? '' : String(coupon.maxUses), validFrom: coupon.validFrom.slice(0, 16), validUntil: coupon.validUntil?.slice(0, 16) || '', isActive: coupon.isActive });
    setShowForm(true);
    setError(''); setMessage('');
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setError(''); setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/coupons${editing ? `/${editing}` : ''}`, {
        method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, id: editing, discountValue: Number(form.discountValue), minOrderAmount: form.minOrderAmount === '' ? null : Number(form.minOrderAmount), maxUses: form.maxUses === '' ? null : Number(form.maxUses) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save discount.');
      await load(); setShowForm(false); setMessage('Discount saved.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save discount.'); }
  };

  const newCoupon = () => { setEditing(null); setForm(initialForm); setShowForm(true); setError(''); setMessage(''); };
  const change = (key: keyof typeof initialForm, value: string | boolean) => setForm(prev => ({ ...prev, [key]: value }));

  return <div className="p-4 md:p-8">
    <div className="mb-6 flex items-center justify-between gap-3"><h1 className="text-2xl font-bold text-gray-950">Discounts and coupons</h1><button onClick={newCoupon} className="shrink-0 rounded bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800">Add discount</button></div>
    {message && <p role="status" className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">{message}</p>}{error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {showForm && <form onSubmit={save} className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-white/80 bg-white/95 p-5 text-gray-900 shadow-lg shadow-emerald-950/5 backdrop-blur-sm md:grid-cols-2 md:p-6">
      <h2 className="text-lg font-semibold md:col-span-2">{editing ? 'Edit coupon' : 'Create coupon'}</h2>
      <label className="space-y-1"><span className="block text-sm">Coupon code</span><input value={form.code} onChange={e => change('code', e.target.value)} required className="w-full rounded border px-3 py-2" /></label>
      <label className="space-y-1"><span className="block text-sm">Discount type</span><select value={form.discountType} onChange={e => change('discountType', e.target.value)} className="w-full rounded border px-3 py-2"><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount (₹)</option></select></label>
      <label className="space-y-1"><span className="block text-sm">Discount value</span><input type="number" min="0.01" step="0.01" max={form.discountType === 'PERCENTAGE' ? 100 : undefined} value={form.discountValue} onChange={e => change('discountValue', e.target.value)} required className="w-full rounded border px-3 py-2" /></label>
      <label className="space-y-1"><span className="block text-sm">Minimum cart amount (₹)</span><input type="number" min="0" step="0.01" value={form.minOrderAmount} onChange={e => change('minOrderAmount', e.target.value)} className="w-full rounded border px-3 py-2" /></label>
      <label className="space-y-1"><span className="block text-sm">Maximum uses</span><input type="number" min="1" step="1" value={form.maxUses} onChange={e => change('maxUses', e.target.value)} className="w-full rounded border px-3 py-2" /></label>
      <label className="space-y-1"><span className="block text-sm">Starts at</span><input type="datetime-local" value={form.validFrom} onChange={e => change('validFrom', e.target.value)} className="w-full rounded border px-3 py-2" /></label>
      <label className="space-y-1"><span className="block text-sm">Ends at (optional)</span><input type="datetime-local" value={form.validUntil} onChange={e => change('validUntil', e.target.value)} className="w-full rounded border px-3 py-2" /></label>
      {editing && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => change('isActive', e.target.checked)} /> Active</label>}
      <div className="flex gap-3 md:col-span-2"><button className="rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white hover:bg-emerald-900">Save coupon</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50">Cancel</button></div>
    </form>}
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-lg shadow-emerald-950/5 backdrop-blur-sm"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm text-gray-900"><thead className="border-b bg-emerald-50/80"><tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Minimum</th><th className="p-3">Uses</th><th className="p-3">Valid until</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody className="divide-y">{coupons.map(coupon => <tr key={coupon.id}><td className="p-3 font-mono">{coupon.code}</td><td className="p-3">{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td><td className="p-3">{coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : 'None'}</td><td className="p-3">{coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}</td><td className="p-3">{coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'No end date'}</td><td className="p-3">{coupon.isActive ? 'Active' : 'Inactive'}</td><td className="p-3"><button onClick={() => beginEdit(coupon)} className="text-blue-800 font-medium">Edit</button></td></tr>)}</tbody></table></div></div>
  </div>;
}
