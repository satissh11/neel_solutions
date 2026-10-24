"use client";

import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [returnTo, setReturnTo] = useState('/');
  const router = useRouter();

  // Read the optional post-registration destination from the browser URL.
  useEffect(() => {
    const requestedPath = new URLSearchParams(window.location.search).get('returnTo');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (requestedPath?.startsWith('/') && !requestedPath.startsWith('//')) setReturnTo(requestedPath);
  }, []);

  const handleGoogleCredential = async (credential: string) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Google sign-in failed.');
      const requestedPath = new URLSearchParams(window.location.search).get('returnTo');
      const redirectTo = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : data.user.role === 'ADMIN' ? '/admin' : '/';
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.assign(redirectTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Google sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      const requestedPath = new URLSearchParams(window.location.search).get('returnTo');
      const redirectTo = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';
      router.push(`/login?registered=1&email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(redirectTo)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-canvas flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="brand-logo-frame mx-auto mb-5 inline-flex"><Image src="/brand-logo.svg" alt="Neel Solutions" width={220} height={56} className="h-14 w-auto max-w-full" /></span>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <p className="text-sm text-gray-500 mt-2">Join Neel Solutions for a healthy lifestyle</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
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
              <label className="text-sm font-medium text-gray-700">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-gray-500"><span className="h-px flex-1 bg-gray-200" />OR<span className="h-px flex-1 bg-gray-200" /></div>
          <GoogleSignInButton text="signup_with" onCredential={handleGoogleCredential} onError={setError} />
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-emerald-800 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
