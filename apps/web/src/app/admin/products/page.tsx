"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface Product {
  id: string; name: string; description: string; price: string | number; stock: number;
  sku: string; categoryId: string; isActive: boolean; images: { url: string }[];
}
interface Category { id: string; name: string }
const emptyForm = { name: '', description: '', price: '', stock: '0', sku: '', categoryId: '', imageUrl: '', isActive: true };

export default function AdminProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/products`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load products.');
    setProducts(data.products);
    setCategories(data.categories);
  }, [token]);

  // Load server state when the admin session becomes available.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProducts().catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load products.')); }, [fetchProducts]);

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id || '' });
    setShowForm(true);
    setMessage('');
    setError('');
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name, description: product.description, price: String(product.price),
      stock: String(product.stock), sku: product.sku, categoryId: product.categoryId,
      imageUrl: product.images[0]?.url || '', isActive: product.isActive,
    });
    setShowForm(true);
    setMessage('');
    setError('');
  };

  const uploadProductImage = (file: File | undefined) => {
    if (!file) return;
    setError('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Choose a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Product images must be 5 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setForm(prev => ({ ...prev, imageUrl: reader.result as string }));
      else setError('Could not read the selected image.');
    };
    reader.onerror = () => setError('Could not read the selected image.');
    reader.readAsDataURL(file);
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/products${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save product.');
      await fetchProducts();
      setShowForm(false);
      setMessage(editingId ? 'Product updated.' : 'Product created.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save product.');
    }
  };

  const hideProduct = async (product: Product) => {
    if (!token || !window.confirm(`Hide ${product.name} from the storefront? Existing order history will be retained.`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/products/${product.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not hide product.');
      await fetchProducts();
      setMessage('Product hidden from the storefront.');
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not hide product.');
    }
  };

  const field = (label: string, key: keyof typeof emptyForm, type = 'text') => (
    <label className="block space-y-1" key={key}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input type={type} value={String(form[key])} onChange={event => setForm(prev => ({ ...prev, [key]: type === 'checkbox' ? event.target.checked : event.target.value }))} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500" required={key !== 'imageUrl'} />
    </label>
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <button onClick={startCreate} className="rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-emerald-900">Add Product</button>
      </div>
      {message && <p role="status" className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {showForm && (
        <form onSubmit={saveProduct} className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-white/80 bg-white/95 p-5 text-gray-900 shadow-lg shadow-emerald-950/5 backdrop-blur-sm md:grid-cols-2 md:p-6">
          <h2 className="md:col-span-2 text-lg font-semibold">{editingId ? 'Edit product' : 'Add product'}</h2>
          {field('Name', 'name')}
          {field('SKU', 'sku')}
          {field('Price (₹)', 'price', 'number')}
          {field('Stock quantity', 'stock', 'number')}
          <label className="block space-y-1"><span className="text-sm font-medium text-gray-700">Category</span>
            <select value={form.categoryId} onChange={event => setForm(prev => ({ ...prev, categoryId: event.target.value }))} required className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900">
              <option value="">Select category</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">Product image</span>
            <span className="block text-sm text-gray-600">Upload PNG, JPEG, or WebP up to 2 MB, or use an HTTPS image URL.</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => uploadProductImage(event.target.files?.[0])} className="block w-full text-sm text-gray-800 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-gray-800" />
            <input type="url" value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl} onChange={event => setForm(prev => ({ ...prev, imageUrl: event.target.value }))} placeholder="https://example.com/product.png" className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500" />
            {form.imageUrl && <Image src={form.imageUrl} alt="Product preview" width={96} height={96} unoptimized className="h-24 w-24 rounded border object-cover" />}
          </label>
          <label className="block space-y-1 md:col-span-2"><span className="text-sm font-medium text-gray-700">Description</span>
            <textarea value={form.description} onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))} required rows={3} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500" />
          </label>
          {editingId && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={event => setForm(prev => ({ ...prev, isActive: event.target.checked }))} /> Visible in storefront</label>}
          <div className="flex gap-3 md:col-span-2"><button type="submit" className="rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white hover:bg-emerald-900">Save product</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50">Cancel</button></div>
        </form>
      )}
      <div className="overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-lg shadow-emerald-950/5 backdrop-blur-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm text-gray-900">
          <thead className="border-b bg-gray-50"><tr><th className="px-4 py-3">Image</th><th className="px-4 py-3">Name / SKU</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Store status</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody className="divide-y">{products.map(product => <tr key={product.id}>
            <td className="px-4 py-3">{product.images[0]?.url ? <Image src={product.images[0].url} alt={product.name} width={48} height={48} unoptimized className="h-12 w-12 rounded object-cover" /> : 'No image'}</td>
            <td className="px-4 py-3"><p className="font-medium">{product.name}</p><p className="text-xs text-gray-500">{product.sku}</p><p className="text-xs text-gray-500">{product.description}</p></td>
            <td className="px-4 py-3">₹{Number(product.price).toFixed(2)}</td><td className="px-4 py-3">{product.stock}</td>
            <td className="px-4 py-3">{product.isActive ? 'Active' : 'Hidden'}</td>
            <td className="space-x-3 px-4 py-3"><button onClick={() => startEdit(product)} className="font-medium text-emerald-800 hover:underline">Edit</button>{product.isActive && <button onClick={() => hideProduct(product)} className="font-medium text-red-700 hover:underline">Hide</button>}</td>
          </tr>)}</tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
