'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from './button';

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Crypto<span className="text-gray-800">Sentiment</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">
              Dashboard
            </Link>
            <Link href="/sentiment" className="text-gray-600 hover:text-blue-600 font-medium">
              AI Analysis
            </Link>
            <Link href="/alerts" className="text-gray-600 hover:text-blue-600 font-medium">
              Alerts
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-blue-600 font-medium">
              Pricing
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-3">
            {status === 'loading' ? (
              <div className="h-9 w-20 bg-gray-200 animate-pulse rounded"></div>
            ) : session ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  Welcome, {session.user?.email?.split('@')[0]}
                </span>
                <Button
                  onClick={() => signOut()}
                  variant="outline"
                  size="sm"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => signIn()}
                  variant="outline"
                  size="sm"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => signIn()}
                  size="sm"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-3 flex space-x-4 text-sm">
          <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/sentiment" className="text-gray-600 hover:text-blue-600">
            AI Analysis
          </Link>
          <Link href="/alerts" className="text-gray-600 hover:text-blue-600">
            Alerts
          </Link>
        </div>
      </div>
    </nav>
  );
}