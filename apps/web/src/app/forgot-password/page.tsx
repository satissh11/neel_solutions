"use client";

import { API_BASE_URL } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { readApiResponse } from '@/lib/api-response';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await readApiResponse<{ message: string }>(response);
      setNotice(data.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not send the reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-canvas flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="brand-logo-frame mx-auto mb-5 inline-flex"><Image src="/brand-logo.svg" alt="Neel Solutions" width={220} height={56} className="h-14 w-auto max-w-full" /></span>
          <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
          <p className="mt-2 text-sm text-gray-500">Enter your account email and we will send you a link to set a new password.</p>
        </CardHeader>
        <CardContent>
          {notice && <p role="status" className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <div className="space-y-2">
              <label htmlFor="forgot-email" className="text-sm font-medium text-gray-700">Email Address</label>
              <Input id="forgot-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <Link href="/login" className="text-sm font-medium text-emerald-800 hover:underline">Back to sign in</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
