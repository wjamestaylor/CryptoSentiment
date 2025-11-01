'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from './button';
import { LoadingSpinner } from './loading';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Helper function to get navigation link classes
  const getNavLinkClasses = (isActive: boolean, isMobile = false) => {
    if (isMobile) {
      return cn(
        'py-2 transition-colors',
        isActive 
          ? 'text-foreground font-semibold border-l-4 border-primary pl-3' 
          : 'text-muted-foreground hover:text-foreground'
      );
    }
    return cn(
      'font-medium transition-colors',
      isActive 
        ? 'text-foreground border-b-2 border-primary' 
        : 'text-muted-foreground hover:text-foreground'
    );
  };

  const navigationLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/sentiment', label: 'AI Analysis' },
    ...(session ? [{ href: '/crypto', label: 'Crypto Manager' }] : []),
    { href: '/alerts', label: 'Alerts' },
    ...(session ? [{ href: '/settings', label: 'Settings' }] : []),
    { href: '/pricing', label: 'Pricing' },
  ];

  return (
    <nav className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-primary">
            Crypto<span className="text-foreground">Sentiment</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={getNavLinkClasses(isActive)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {status === 'loading' ? (
              <LoadingSpinner className="h-6 w-6" />
            ) : session ? (
              <div className="flex items-center space-x-3">
                {session.user?.email && (
                  <span className="text-sm text-muted-foreground">
                    Welcome, {session.user.email.split('@')[0]}
                  </span>
                )}
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
                <Link href="/pricing">
                  <Button>
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" data-testid="close-icon" />
              ) : (
                <Menu className="h-6 w-6" data-testid="menu-icon" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-3">
              {navigationLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={getNavLinkClasses(isActive, true)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              
              <div className="pt-3 border-t">
                {status === 'loading' ? (
                  <div className="flex items-center py-2">
                    <LoadingSpinner className="h-5 w-5 mr-2" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : session ? (
                  <div className="space-y-3">
                    {session.user?.email && (
                      <div className="text-sm text-muted-foreground">
                        Welcome, {session.user.email.split('@')[0]}
                      </div>
                    )}
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
                    <Link href="/pricing" className="block">
                      <Button
                        className="w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Upgrade to Pro
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