"use client";

import { FormEvent, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

const maxHeroImages = 6;
const maxImageSize = 5 * 1024 * 1024;
const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp'];

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error(`Could not read ${file.name}.`));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export default function StoreSettingsPage() {
  const { token } = useAuth();
  const [logoUrl, setLogoUrl] = useState('');
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroImageDraft, setHeroImageDraft] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/v1/admin/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load store branding.');
        setLogoUrl(data.logoUrl || '');
        setHeroImages(Array.isArray(data.heroImages) ? data.heroImages : data.heroImageUrl ? [data.heroImageUrl] : []);
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load store branding.'));
  }, [token]);

  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    if (!acceptedTypes.includes(file.type)) return setError('Logo must be a PNG, JPEG, or WebP image.');
    if (file.size > maxImageSize) return setError('Logo must be 5 MB or smaller.');
    try { setLogoUrl(await readImage(file)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not read the logo.'); }
  };

  const uploadHeroImages = async (files: File[]) => {
    if (!files.length) return;
    setError('');
    if (heroImages.length + files.length > maxHeroImages) return setError(`Choose up to ${maxHeroImages} homepage images in total.`);
    const invalidType = files.find(file => !acceptedTypes.includes(file.type));
    if (invalidType) return setError(`${invalidType.name}: use PNG, JPEG, or WebP.`);
    const oversized = files.find(file => file.size > maxImageSize);
    if (oversized) return setError(`${oversized.name}: each image must be 5 MB or smaller.`);
    try {
      const uploaded = await Promise.all(files.map(readImage));
      setHeroImages(current => [...current, ...uploaded]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not read the selected images.');
    }
  };

  const addHeroImageUrl = () => {
    const url = heroImageDraft.trim();
    if (!url) return;
    if (heroImages.length >= maxHeroImages) return setError(`Homepage supports up to ${maxHeroImages} images.`);
    if (!/^(https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/i.test(url)) return setError('Enter an HTTPS image URL or site-relative path.');
    setHeroImages(current => [...current, url]);
    setHeroImageDraft('');
    setError('');
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ logoUrl, heroImages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save store branding.');
      setMessage('Branding saved. Refresh the storefront to see the updates.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save store branding.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl p-4 md:p-8">
      <p className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">Storefront</p>
      <h1 className="mb-2 text-2xl font-bold text-gray-950 md:text-3xl">Store branding</h1>
      <p className="mb-6 text-sm text-gray-700">Set the animated storefront logo and choose up to six homepage slides. Slides change every three seconds.</p>
      {message && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <form onSubmit={save} className="space-y-8 rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-emerald-950/5 backdrop-blur-sm md:p-7">
        <section className="space-y-3">
          <div>
            <h2 className="font-semibold text-gray-900">Store logo</h2>
            <p className="mt-1 text-sm text-gray-600">PNG, JPEG, or WebP up to 5 MB. The storefront logo has a gentle motion.</p>
          </div>
          <input type="file" accept={acceptedTypes.join(',')} onChange={event => { void uploadLogo(event.target.files?.[0]); event.currentTarget.value = ''; }} className="block w-full text-sm text-gray-800 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-medium file:text-emerald-900 hover:file:bg-emerald-100" />
          <input aria-label="Logo image URL" value={logoUrl.startsWith('data:') ? '' : logoUrl} onChange={event => setLogoUrl(event.target.value)} placeholder="https://example.com/logo.png or /images/logo.png" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder:text-gray-500" />
          <div className="flex min-h-16 items-center rounded-xl border border-gray-200 bg-gray-50 p-3">
            <span className="brand-logo-frame inline-flex"><Image src={logoUrl || '/brand-logo.svg'} alt="Store logo preview" width={220} height={56} unoptimized className="h-12 max-w-full object-contain" /></span>
          </div>
        </section>

        <section className="space-y-3 border-t border-gray-200 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-semibold text-gray-900">Homepage slideshow</h2>
              <p className="mt-1 text-sm text-gray-600">Add up to six images. Each upload can be up to 5 MB; slides rotate every three seconds.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">{heroImages.length}/{maxHeroImages} images</span>
          </div>
          <input type="file" multiple accept={acceptedTypes.join(',')} disabled={heroImages.length >= maxHeroImages} onChange={event => { void uploadHeroImages(Array.from(event.target.files || [])); event.currentTarget.value = ''; }} className="block w-full text-sm text-gray-800 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-medium file:text-emerald-900 hover:file:bg-emerald-100 disabled:opacity-50" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input aria-label="Homepage image URL" value={heroImageDraft} onChange={event => setHeroImageDraft(event.target.value)} placeholder="HTTPS image URL or /images/banner.jpg" className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder:text-gray-500" />
            <button type="button" onClick={addHeroImageUrl} className="rounded-lg border border-emerald-800 px-4 py-2 font-medium text-emerald-900 hover:bg-emerald-50">Add image URL</button>
          </div>
          {heroImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
              {heroImages.map((image, index) => (
                <div key={`${index}-${image.slice(0, 30)}`} className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  <Image src={image} alt={`Homepage slide ${index + 1}`} width={320} height={112} unoptimized className="h-28 w-full object-cover" />
                  <span className="absolute bottom-2 left-2 rounded bg-white/95 px-2 py-1 text-xs font-semibold text-gray-900">Slide {index + 1}</span>
                  <button type="button" aria-label={`Remove slide ${index + 1}`} onClick={() => setHeroImages(current => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-red-700 shadow hover:bg-white">Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-7 text-center text-sm text-gray-600">No slideshow images yet. Upload some to preview them here.</div>
          )}
        </section>

        <button type="submit" disabled={saving} className="rounded-lg bg-emerald-800 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving…' : 'Save branding'}</button>
      </form>
    </div>
  );
}
