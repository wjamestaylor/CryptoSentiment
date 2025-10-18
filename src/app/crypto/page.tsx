'use client';

import { useSession } from 'next-auth/react';
import { CryptoManager } from '@/components/crypto/CryptoManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CryptoPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 sm:p-8">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-bold">Sign In Required</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Please sign in to manage your cryptocurrency tracking and portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.href = '/api/auth/signin'}
                className="w-full sm:w-auto"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Crypto Management</h1>
          <p className="text-muted-foreground">
            Unified tracking for all your cryptocurrency interests - from watchlists to portfolio management
          </p>
        </div>
        
        <CryptoManager />
      </div>
    </div>
  );
}