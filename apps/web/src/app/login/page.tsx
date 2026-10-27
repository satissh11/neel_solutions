"use client";

import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { readApiResponse } from '@/lib/api-response';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [returnTo, setReturnTo] = useState('/');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleGoogleCredential = async (credential: string) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await readApiResponse<{ token: string; user: { id: string; name: string; email: string; role: string } }>(response);
      const requestedPath = new URLSearchParams(window.location.search).get('returnTo');
      const redirectTo = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : data.user.role === 'ADMIN' ? '/admin' : '/';
      login(data.token, data.user, redirectTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  // Read redirect and registration feedback from the browser URL after mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedPath = params.get('returnTo');
    // URL-derived initial form state; this runs once during browser hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (requestedPath?.startsWith('/') && !requestedPath.startsWith('//')) setReturnTo(requestedPath);
    if (params.get('registered') === '1') setNotice('Account created successfully. Sign in to continue.');
    const registeredEmail = params.get('email');
    if (registeredEmail) setEmail(registeredEmail);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await readApiResponse<{ token: string; user: { id: string; name: string; email: string; role: string } }>(res);

      // Update shared auth state before redirecting, so protected pages see
      // the newly authenticated user immediately.
      const requestedPath = new URLSearchParams(window.location.search).get('returnTo');
      const redirectTo = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : data.user.role === 'ADMIN' ? '/admin' : '/';
      login(data.token, data.user, redirectTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-canvas flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="brand-logo-frame mx-auto mb-5 inline-flex"><Image src="/brand-logo.svg" alt="Neel Solutions" width={220} height={56} className="h-14 w-auto max-w-full" /></span>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <p className="text-sm text-gray-500 mt-2">Sign in to your Neel Solutions account</p>
        </CardHeader>
        <CardContent>
          {notice && <p role="status" className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-emerald-800 hover:underline">Forgot password?</Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-gray-500"><span className="h-px flex-1 bg-gray-200" />OR<span className="h-px flex-1 bg-gray-200" /></div>
          <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-emerald-800 hover:underline">
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
