'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided. Please check your email link.');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. Please try again.');
        }
      } catch {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {status === 'loading' && '🔄 Verifying your email...'}
          {status === 'success' && '✅ Email Verified!'}
          {status === 'error' && '❌ Verification Failed'}
        </CardTitle>
        <CardDescription className="text-center">
          {status === 'loading' && 'Please wait while we verify your email address.'}
          {status === 'success' && 'Your email has been successfully verified.'}
          {status === 'error' && 'There was a problem verifying your email.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'loading' && (
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="text-sm text-green-600">{message}</div>
              <div className="text-xs text-green-500 mt-1">
                You can now sign in to your account and start using CryptoSentiment.
              </div>
            </div>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/signin">Sign In to Your Account</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-600">{message}</div>
            </div>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/signin">Try Signing In</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signup">Create New Account</Link>
              </Button>
            </div>
            <div className="text-center text-sm text-gray-600">
              <p>Need help?</p>
              <p className="text-xs mt-1">
                Verification links expire after 24 hours. If your link has expired, 
                you can create a new account or try signing in to resend the verification email.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">🔄 Loading...</CardTitle>
        <CardDescription className="text-center">
          Please wait while we prepare your verification page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            Crypto<span className="text-gray-800">Sentiment</span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <VerifyEmailContent />
        </Suspense>

        <div className="text-center">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}