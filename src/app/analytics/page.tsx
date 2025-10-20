"use client";

import { AdvancedAnalyticsDashboard } from '@/components/analytics/enhanced/AdvancedAnalyticsDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect to login if not authenticated
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics for your cryptocurrency portfolio
          </p>
        </div>
      </div>

      {/* Enhanced Analytics Dashboard */}
      <ErrorBoundary>
        <AdvancedAnalyticsDashboard />
      </ErrorBoundary>
    </div>
  );
}