'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function AuthAwareContent() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-sm sm:max-w-none mx-auto">
        <div className="w-full sm:w-auto">
          <Button size="lg" disabled className="w-full sm:w-auto">
            Loading...
          </Button>
        </div>
        <div className="w-full sm:w-auto">
          <Button variant="outline" size="lg" disabled className="w-full sm:w-auto">
            Loading...
          </Button>
        </div>
      </div>
    );
  }

  if (session) {
    // Authenticated user - promote paid plans
    return (
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-sm sm:max-w-none mx-auto">
        <Link href="/sentiment" className="w-full sm:w-auto">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            Try AI Analysis
          </Button>
        </Link>
        <Link href="/pricing" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            Upgrade to Pro
          </Button>
        </Link>
      </div>
    );
  }

  // Not authenticated - show signup options
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-sm sm:max-w-none mx-auto">
      <Link href="/sentiment" className="w-full sm:w-auto">
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          Try AI Analysis
        </Button>
      </Link>
      <Link href="/auth/signup" className="w-full sm:w-auto">
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          Get Started Free
        </Button>
      </Link>
    </div>
  );
}

export function AuthAwareCTA() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" size="lg" disabled className="w-full sm:w-auto">
          Loading...
        </Button>
        <Button size="lg" disabled className="w-full sm:w-auto">
          Loading...
        </Button>
      </div>
    );
  }

  if (session) {
    // Authenticated user - promote paid plans
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/pricing">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            View All Plans
          </Button>
        </Link>
        <Link href="/pricing">
          <Button size="lg" className="w-full sm:w-auto">
            Upgrade to Pro
          </Button>
        </Link>
      </div>
    );
  }

  // Not authenticated - show signup options
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link href="/pricing">
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          View All Plans
        </Button>
      </Link>
      <Link href="/auth/signup">
        <Button size="lg" className="w-full sm:w-auto">
          Start Free Trial
        </Button>
      </Link>
    </div>
  );
}