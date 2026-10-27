"use client";

import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { readApiResponse } from '@/lib/api-response';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Read the one-time token from the browser URL after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(new URLSearchParams(window.location.search).get('token') ?? '');
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      await readApiResponse<{ message: string }>(response);
      setDone(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not reset the password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-canvas flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="brand-logo-frame mx-auto mb-5 inline-flex"><Image src="/brand-logo.svg" alt="Neel Solutions" width={220} height={56} className="h-14 w-auto max-w-full" /></span>
          <CardTitle className="text-2xl font-bold">Set a new password</CardTitle>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4 text-center">
              <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">Your password has been updated.</p>
              <Link href="/login" className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900">Sign in</Link>
            </div>
          ) : !token ? (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-600">This reset link is missing or incomplete. <Link href="/forgot-password" className="font-semibold underline">Request a new one</Link>.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error} {error.includes('expired') && <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link>}</div>}
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium text-gray-700">New password</label>
                <Input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
                <p className="text-xs text-gray-500">At least 8 characters.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">Confirm new password</label>
                <Input id="confirm-password" type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Update password'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <Link href="/login" className="text-sm font-medium text-emerald-800 hover:underline">Back to sign in</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
