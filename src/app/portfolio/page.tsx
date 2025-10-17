"use client";

import { useSession } from 'next-auth/react';
import { PortfolioManager } from '@/components/portfolio/PortfolioManager';

export default function PortfolioPage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Portfolio Management</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Sign in to track your cryptocurrency investments and portfolio performance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground mt-1">
            Track your cryptocurrency investments and portfolio performance
          </p>
        </div>

        <PortfolioManager />
      </div>
    </div>
  );
}