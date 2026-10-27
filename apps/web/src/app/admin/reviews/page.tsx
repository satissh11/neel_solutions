"use client";

import { API_BASE_URL } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AdminReview {
  id: string;
  name: string;
  email: string;
  product: string | null;
  rating: number;
  text: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-900',
  APPROVED: 'bg-emerald-100 text-emerald-900',
  REJECTED: 'bg-gray-100 text-gray-700',
};

export default function AdminReviews() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/reviews`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load reviews.');
      setReviews(Array.isArray(data) ? data : []);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load reviews.');
    }
  }, [token]);

  // Load server state when the admin session becomes available.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadReviews(); }, [loadReviews]);

  const setStatus = async (id: string, status: AdminReview['status']) => {
    if (!token) return;
    setBusyId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update the review.');
      await loadReviews();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update the review.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!token || !window.confirm('Delete this review permanently?')) return;
    setBusyId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/reviews/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete the review.');
      await loadReviews();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not delete the review.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-7">
        <p className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">Customers</p>
        <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">Reviews</h1>
        <p className="mt-2 text-sm text-gray-700">Approved reviews are shown on the homepage. New reviews stay hidden until you approve them.</p>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-white/80 bg-white/95 p-10 text-center text-gray-700 shadow-lg shadow-emerald-950/5">No reviews yet.</div>
      ) : (
        <ul className="space-y-4">
          {reviews.map(review => (
            <li key={review.id} className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-emerald-950/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{review.name} <span className="font-normal text-gray-600">· {review.email}</span></p>
                  <p className="text-sm text-amber-600" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                  {review.product && <p className="text-xs text-gray-600">Product: {review.product}</p>}
                </div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[review.status]}`}>{review.status.toLowerCase()}</span>
                  <p className="mt-1 text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-gray-800">{review.text}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {review.status !== 'APPROVED' && <button type="button" disabled={busyId === review.id} onClick={() => setStatus(review.id, 'APPROVED')} className="rounded-md bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">Approve (show on site)</button>}
                {review.status === 'APPROVED' && <button type="button" disabled={busyId === review.id} onClick={() => setStatus(review.id, 'REJECTED')} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60">Hide from site</button>}
                {review.status === 'PENDING' && <button type="button" disabled={busyId === review.id} onClick={() => setStatus(review.id, 'REJECTED')} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60">Reject</button>}
                <button type="button" disabled={busyId === review.id} onClick={() => remove(review.id)} className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
