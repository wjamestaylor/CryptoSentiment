'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './button';
import { ThemeToggle } from './theme-toggle';
import { LoadingSpinner } from './loading';

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/sentiment', label: 'AI Analysis' },
    ...(session ? [{ href: '/watchlist', label: 'Watchlist' }] : []),
    { href: '/alerts', label: 'Alerts' },
    { href: '/pricing', label: 'Pricing' },
  ];

  return (
    <nav className="border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-primary">
            Crypto<span className="text-foreground">Sentiment</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            {status === 'loading' ? (
              <LoadingSpinner className="h-6 w-6" />
            ) : session ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
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
                <Link href="/auth/signin">
                  <Button
                    variant="outline"
                    className="text-primary border-primary/20 hover:bg-primary/5"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-3">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground py-2 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="pt-3 border-t">
                {status === 'loading' ? (
                  <div className="flex items-center py-2">
                    <LoadingSpinner className="h-5 w-5 mr-2" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : session ? (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Welcome, {session.user?.email?.split('@')[0]}
                    </div>
                    <Button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/auth/signin" className="block">
                      <Button
                        variant="outline"
                        className="w-full text-primary border-primary/20 hover:bg-primary/5"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup" className="block">
                      <Button
                        className="w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}