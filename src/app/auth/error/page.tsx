'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const errorMessages: Record<string, { title: string; description: string; action: string }> = {
  Configuration: {
    title: 'Server Error',
    description: 'There was a problem with the server configuration. Please try again later.',
    action: 'Contact support if this persists'
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in with this account.',
    action: 'Try signing in with a different email address'
  },
  Verification: {
    title: 'Invalid Link',
    description: 'The sign-in link is no longer valid. It may have expired or been used already.',
    action: 'Request a new sign-in link'
  },
  Default: {
    title: 'Authentication Error',
    description: 'Something went wrong during the authentication process.',
    action: 'Please try again'
  }
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            Crypto<span className="text-gray-800">Sentiment</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <CardTitle className="text-red-900">{errorInfo.title}</CardTitle>
            <CardDescription className="text-red-700">
              {errorInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                {errorInfo.action}
              </p>

              {error === 'Verification' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-yellow-900 mb-2">What happened?</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• The sign-in link may have expired (valid for 24 hours)</li>
                    <li>• The link may have already been used</li>
                    <li>• You may have clicked an old link</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col space-y-3">
                <Link href="/auth/signin">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    {error === 'Verification' ? 'Get a new sign-in link' : 'Try signing in again'}
                  </Button>
                </Link>
                
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Back to home
                  </Button>
                </Link>
              </div>

              {error === 'Configuration' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">
                    Error Code: {error} | If this issue persists, please contact our support team.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}