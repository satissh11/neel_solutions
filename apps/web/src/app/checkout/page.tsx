"use client";

import { API_BASE_URL } from '@/lib/api';
import { Suspense, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { displayProductName } from '@/types/store';

function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCart();
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: user?.name || '', street: '', city: '', state: '', pinCode: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [whatsappUpdates, setWhatsappUpdates] = useState(false);
  
  // Dynamic Shipping and Coupon
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [pinValidating, setPinValidating] = useState(false);
  const [pinMessage, setPinMessage] = useState('');
  const [codAllowed, setCodAllowed] = useState(true);
  const pinRequestId = useRef(0);

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  
  const finalTotal = totalPrice + (shippingFee || 0) - discount;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'pinCode') {
      const requestId = ++pinRequestId.current;
      setShippingFee(null);
      setPinMessage('');
      setPinValidating(false);
      setCodAllowed(true);
      if (/^\d{6}$/.test(value)) validatePin(value, requestId);
    }
  };

  const validatePin = async (pin: string, requestId: number) => {
    setPinValidating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/checkout/pin/${pin}`);
      const data = await res.json();
      if (requestId !== pinRequestId.current) return;
      if (res.ok && data.serviceable) {
        setPinMessage(`Delivery in ${data.deliveryDays} days. COD is ${data.codAllowed ? 'available' : 'not available'}.`);
        setCodAllowed(data.codAllowed);
        setShippingFee(data.freeAbove != null && totalPrice >= Number(data.freeAbove) ? 0 : Number(data.baseFee));
      } else {
        setPinMessage('Delivery is not available to this PIN code.');
        setShippingFee(null);
        setCodAllowed(false);
      }
    } catch {
      if (requestId !== pinRequestId.current) return;
      setPinMessage('Failed to check PIN code availability.');
      setShippingFee(null);
      setCodAllowed(false);
    } finally {
      if (requestId === pinRequestId.current) setPinValidating(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/checkout/coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderAmount: totalPrice }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscount(data.discount);
        setCouponMessage(`Coupon applied! Saved ₹${data.discount}`);
      } else {
        setDiscount(0);
        setCouponMessage(data.error || 'Invalid coupon.');
      }
    } catch {
      setCouponMessage('Failed to apply coupon.');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { router.push('/login'); return; }
    if (items.length === 0) { setError('Your cart is empty.'); return; }
    if (shippingFee === null) { setError('Please enter a serviceable PIN code.'); return; }
    if (!codAllowed) { setError('COD is not available for your location. Online payments coming soon.'); return; }

    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
          shippingPin: form.pinCode,
          shippingPhone: form.phone,
          whatsappUpdates,
          shippingAddr: `${form.name.trim() || user?.name?.trim() || ''}, ${form.street}, ${form.city}, ${form.state} - ${form.pinCode}`,
          paymentMethod: 'COD',
          couponCode: discount > 0 ? couponCode : undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order failed');
      clearCart();
      router.push(`/orders/${data.order.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return (
    <div className="text-center py-16"><p className="text-gray-500 mb-4">Your cart is empty.</p><Link href="/products" className="text-blue-600 hover:underline">Browse Products →</Link></div>
  );

  if (authLoading) return <p className="rounded-xl bg-white p-6 text-center text-gray-700 shadow">Checking your account…</p>;

  if (!token) return (
    <section className="motion-card mx-auto max-w-xl rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900">Sign in to place your order</h2>
      <p className="mt-3 text-gray-600">Checkout is available to registered customers. Sign in or create an account to continue; your cart will be saved.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button type="button" onClick={() => router.push('/login?returnTo=%2Fcheckout')}>Sign in</Button>
        <Button type="button" variant="outline" onClick={() => router.push('/register?returnTo=%2Fcheckout')}>Create account</Button>
      </div>
    </section>
  );

  return (
    <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Delivery Address */}
      <div className="motion-card h-fit space-y-4 rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-emerald-950/5 backdrop-blur-sm md:p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Delivery Address</h2>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>}

        <div><label className="text-sm font-medium text-gray-700">Full Name</label><Input name="name" value={form.name || user?.name || ''} onChange={handleChange} required className="mt-1" /></div>
        <div><label className="text-sm font-medium text-gray-700">Mobile number</label><Input type="tel" name="phone" value={form.phone} onChange={handleChange} required className="mt-1" placeholder="10-digit mobile number" maxLength={13} pattern="(\+91)?[6-9]\d{9}" /><p className="mt-1 text-xs text-gray-500">Add your number to place the order. We will use it only for delivery updates.</p></div>
        <label className="flex items-start gap-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950">
          <input type="checkbox" checked={whatsappUpdates} onChange={event => setWhatsappUpdates(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-800" />
          <span><strong className="block">Send me order updates on WhatsApp</strong><span className="text-emerald-900">Optional. We will use your number only for order status messages. You can always track orders in My Orders.</span></span>
        </label>
        <div><label className="text-sm font-medium text-gray-700">Street Address</label><Input name="street" value={form.street} onChange={handleChange} required className="mt-1" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium text-gray-700">City</label><Input name="city" value={form.city} onChange={handleChange} required className="mt-1" /></div>
          <div><label className="text-sm font-medium text-gray-700">State</label><Input name="state" value={form.state} onChange={handleChange} required className="mt-1" /></div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Delivery PIN Code</label>
          <Input name="pinCode" value={form.pinCode} onChange={handleChange} required className="mt-1" placeholder="6-digit PIN code" maxLength={6} pattern="\d{6}" />
          {pinValidating && <p className="text-xs text-blue-500 mt-1">Checking availability...</p>}
          {pinMessage && <p className={`text-xs mt-1 ${shippingFee !== null ? 'text-green-600' : 'text-red-500'}`}>{pinMessage}</p>}
        </div>
      </div>

      {/* Order Summary & Payment */}
      <div className="space-y-6">
        <div className="motion-card rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-emerald-950/5 backdrop-blur-sm md:p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm text-gray-800">
                <span>{displayProductName(item.name)} × {item.quantity}</span>
                <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            
            <div className="py-3 border-y flex gap-2">
              <Input placeholder="Coupon code (e.g. WELCOME10)" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
              <Button type="button" onClick={applyCoupon} variant="outline">Apply</Button>
            </div>
            {couponMessage && <p className={`text-xs ${discount > 0 ? 'text-green-600' : 'text-red-500'}`}>{couponMessage}</p>}

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{totalPrice.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{discount.toFixed(2)}</span></div>}
              <div className="flex justify-between"><span>Shipping</span><span className={shippingFee === 0 ? 'text-green-600' : ''}>{shippingFee === null ? 'Enter PIN' : shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total Payable</span><span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="motion-card rounded-2xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-emerald-950/5 backdrop-blur-sm md:p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
          <div className={`flex items-center gap-3 rounded-xl border-2 p-4 ${codAllowed ? 'border-emerald-700 bg-emerald-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
            <span className="text-2xl">💵</span>
            <div>
              <p className="font-semibold text-gray-800">Cash on Delivery (COD)</p>
              <p className="text-xs text-gray-500">Pay when your order is delivered</p>
            </div>
            {codAllowed && <span className="ml-auto text-emerald-800">✓</span>}
          </div>
        </div>

        <Button type="submit" disabled={loading || pinValidating || shippingFee === null || !codAllowed} className="w-full py-3 text-base">
          {loading ? 'Placing Order...' : `Place COD Order — ₹${finalTotal.toFixed(2)}`}
        </Button>
        {!loading && shippingFee === null && <p className="text-center text-sm text-gray-600">Enter a supported 6-digit PIN code to enable order placement.</p>}
        {!codAllowed && shippingFee !== null && <p className="text-center text-sm text-amber-700">Cash on delivery is unavailable for this PIN.</p>}
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Secure checkout</p>
          <h1 className="mb-8 text-3xl font-bold text-gray-950 md:text-4xl">Checkout</h1>
          <Suspense fallback={<div>Loading checkout...</div>}>
            <CheckoutForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
