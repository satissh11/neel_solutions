"use client";

import Script from 'next/script';
import { useCallback, useRef } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string; width: number }) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
  text?: 'signin_with' | 'signup_with';
}

export function GoogleSignInButton({ onCredential, onError, text = 'signin_with' }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const renderButton = useCallback(() => {
    const google = window.google;
    const container = containerRef.current;
    if (!google || !container || !clientId) return;
    container.replaceChildren();
    google.accounts.id.initialize({ client_id: clientId, callback: response => onCredential(response.credential) });
    google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', text, width: Math.min(container.clientWidth || 340, 400) });
  }, [clientId, onCredential, text]);

  if (!clientId) return <p className="text-center text-xs text-amber-800">Google sign-in is not configured for this site yet.</p>;

  return (
    <div className="space-y-2">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={renderButton} onError={() => onError('Could not load Google sign-in. Please use email and password instead.')} />
      <div ref={containerRef} className="flex min-h-10 justify-center" />
    </div>
  );
}
