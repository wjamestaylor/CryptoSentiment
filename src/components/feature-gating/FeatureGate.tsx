import React from 'react';
import { api } from '@/lib/trpc/provider';
import { UsageType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Crown, Zap } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  usageType: UsageType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUsage?: boolean;
}

interface UpgradePromptProps {
  usageType: UsageType;
  currentUsage: number;
  limit: number;
  resetDate?: Date;
}

function UpgradePrompt({ usageType, currentUsage, limit, resetDate }: UpgradePromptProps) {
  const getFeatureName = (type: UsageType) => {
    switch (type) {
      case UsageType.ALERT_CREATION:
        return 'alerts';
      case UsageType.AI_ANALYSIS:
        return 'AI analyses';
      case UsageType.WATCHLIST_ADD:
        return 'watchlist items';
      case UsageType.BOT_NOTIFICATION:
        return 'bot notifications';
      default:
        return 'features';
    }
  };

  const featureName = getFeatureName(usageType);
  const resetText = resetDate ? ` Limit resets ${resetDate.toLocaleDateString()}.` : '';

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-lg text-orange-900 dark:text-orange-100">
            Limit Reached
          </CardTitle>
        </div>
        <CardDescription className="text-orange-700 dark:text-orange-300">
          You&apos;ve reached your {featureName} limit ({currentUsage}/{limit}).{resetText}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress 
          value={(currentUsage / limit) * 100} 
          className="w-full"
          aria-label={`${currentUsage} of ${limit} ${featureName} used`}
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href="/pricing">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade Now
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/settings">
              View Usage Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FeatureGate({ usageType, children, fallback, showUsage = false }: FeatureGateProps) {
  const { data: usageCheck, isLoading } = api.subscription.checkUsageLimit.useQuery({ usageType });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!usageCheck?.success || !usageCheck.data) {
    // Show fallback or children on error (graceful degradation)
    return <>{fallback || children}</>;
  }

  const { allowed, currentUsage, limit, remaining, resetDate } = usageCheck.data;

  // If not allowed, show upgrade prompt or fallback
  if (!allowed) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <UpgradePrompt 
        usageType={usageType}
        currentUsage={currentUsage}
        limit={limit}
        resetDate={resetDate}
      />
    );
  }

  // If allowed but want to show usage info
  if (showUsage && limit > 0) {
    const usagePercentage = (currentUsage / limit) * 100;
    const isNearLimit = usagePercentage >= 80;

    return (
      <div className="space-y-4">
        {isNearLimit && (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2 text-sm text-yellow-800 dark:text-yellow-200">
                <Zap className="h-4 w-4" />
                <span>
                  {remaining} uses remaining ({currentUsage}/{limit} used)
                </span>
              </div>
            </CardContent>
          </Card>
        )}
        {children}
      </div>
    );
  }

  // Default: just show children
  return <>{children}</>;
}

// Hook for checking usage limits in components
export function useUsageLimit(usageType: UsageType) {
  const { data: usageCheck, isLoading, refetch } = api.subscription.checkUsageLimit.useQuery({ usageType });

  return {
    isLoading,
    allowed: usageCheck?.data?.allowed ?? false,
    currentUsage: usageCheck?.data?.currentUsage ?? 0,
    limit: usageCheck?.data?.limit ?? 0,
    remaining: usageCheck?.data?.remaining ?? 0,
    resetDate: usageCheck?.data?.resetDate,
    refetch,
  };
}

// Hook for tracking usage
export function useTrackUsage() {
  const trackUsageMutation = api.subscription.trackUsage.useMutation();

  const trackUsage = async (usageType: UsageType, metadata?: Record<string, unknown>) => {
    try {
      await trackUsageMutation.mutateAsync({ usageType, metadata });
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  };

  return {
    trackUsage,
    isTracking: trackUsageMutation.isPending,
  };
}