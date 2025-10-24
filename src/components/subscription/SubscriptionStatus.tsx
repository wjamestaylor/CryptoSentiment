"use client";

import { api } from '@/lib/trpc/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { Crown, Zap, Users, ArrowUpRight, Calendar } from 'lucide-react';

export function SubscriptionStatus() {
  const router = useRouter();
  const { data: subscription, isLoading } = api.subscription.getCurrent.useQuery();
  const { data: limits } = api.subscription.getLimits.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription?.success || !subscription.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Unable to load subscription information.
          </p>
          <Button 
            onClick={() => router.push('/pricing')}
            variant="outline" 
            size="sm"
          >
            View Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sub = subscription.data;
  const tierLimits = limits?.success ? limits.data?.limits : null;
  const usageData = limits?.success ? limits.data?.usage : null;

  // Get tier styling
  const getTierStyle = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return { 
          badge: 'secondary', 
          icon: Crown, 
          color: 'text-gray-600' 
        };
      case 'PRO':
        return { 
          badge: 'default', 
          icon: Zap, 
          color: 'text-blue-600' 
        };
      case 'BUSINESS':
        return { 
          badge: 'default', 
          icon: Users, 
          color: 'text-purple-600' 
        };
      default:
        return { 
          badge: 'secondary', 
          icon: Crown, 
          color: 'text-gray-600' 
        };
    }
  };

  const tierStyle = getTierStyle(sub.tier);
  const TierIcon = tierStyle.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TierIcon className={`h-5 w-5 ${tierStyle.color}`} />
            Subscription
          </div>
          {sub.tier !== 'FREE' && (
            <Badge variant={tierStyle.badge as "default" | "secondary" | "destructive" | "outline" | null | undefined}>
              {sub.tier}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {sub.tier === 'FREE' 
            ? 'Start with our free plan and upgrade anytime'
            : `${sub.tier.charAt(0) + sub.tier.slice(1).toLowerCase()} plan - Premium features unlocked`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Limits */}
        {tierLimits && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Usage Limits</h4>
            
            {/* AI Analyses */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>AI Analyses</span>
                <span className="text-muted-foreground">
                  {usageData?.aiAnalysisUsed ?? 0} / {tierLimits.aiAnalysisPerMonth === -1 ? '∞' : tierLimits.aiAnalysisPerMonth}
                </span>
              </div>
              {tierLimits.aiAnalysisPerMonth !== -1 && (
                <Progress value={usageData?.aiAnalysisUsed ? (usageData.aiAnalysisUsed / tierLimits.aiAnalysisPerMonth) * 100 : 0} className="h-2" />
              )}
            </div>

            {/* Watchlist */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Watchlist</span>
                <span className="text-muted-foreground">
                  {usageData?.watchlistUsed ?? 0} / {tierLimits.watchlist === -1 ? '∞' : tierLimits.watchlist}
                </span>
              </div>
              {tierLimits.watchlist !== -1 && (
                <Progress value={usageData?.watchlistUsed ? (usageData.watchlistUsed / tierLimits.watchlist) * 100 : 0} className="h-2" />
              )}
            </div>

            {/* Alerts */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Alerts</span>
                <span className="text-muted-foreground">
                  {usageData?.alertsUsed ?? 0} / {tierLimits.alerts === -1 ? '∞' : tierLimits.alerts}
                </span>
              </div>
              {tierLimits.alerts !== -1 && (
                <Progress value={usageData?.alertsUsed ? (usageData.alertsUsed / tierLimits.alerts) * 100 : 0} className="h-2" />
              )}
            </div>
          </div>
        )}

        {/* Billing Info */}
        {sub.tier !== 'FREE' && sub.currentPeriodEnd && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Next billing: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
            {sub.cancelAtPeriodEnd && (
              <Badge variant="destructive" className="text-xs">
                Cancels at period end
              </Badge>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {sub.tier === 'FREE' ? (
            <Button 
              onClick={() => router.push('/pricing')}
              className="w-full"
              size="sm"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          ) : (
            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/stripe/portal', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      returnUrl: window.location.origin + '/dashboard',
                    }),
                  });

                  if (!response.ok) {
                    throw new Error('Failed to create portal session');
                  }

                  const { url } = await response.json();
                  if (url) {
                    window.location.href = url;
                  }
                } catch (error) {
                  console.error('Error opening customer portal:', error);
                  // You could add a toast notification here
                }
              }}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Manage Billing
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}