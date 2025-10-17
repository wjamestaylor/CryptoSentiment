import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Bell, 
  Eye, 
  MessageSquare, 
  Crown, 
  TrendingUp,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { api } from '@/lib/trpc/provider';
import { UsageType } from '@prisma/client';
import { useRouter } from 'next/navigation';

export function UsageDashboard() {
  const router = useRouter();
  const { data: subscription } = api.subscription.getCurrent.useQuery();
  const { data: limits } = api.subscription.getLimits.useQuery();

  if (!subscription?.data || !limits?.data) {
    return null;
  }

  const { tier } = subscription.data;
  const { usage } = limits.data;

  const usageItems = [
    {
      type: UsageType.AI_ANALYSIS,
      label: 'AI Analysis',
      icon: Zap,
      current: usage.aiAnalysisUsed,
      limit: usage.aiAnalysisLimit,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      description: 'AI-powered sentiment analysis requests'
    },
    {
      type: UsageType.ALERT_CREATION,
      label: 'Alerts',
      icon: Bell,
      current: usage.alertsUsed,
      limit: usage.alertsLimit,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      description: 'Price and sentiment alert configurations'
    },
    {
      type: UsageType.WATCHLIST_ADD,
      label: 'Watchlist',
      icon: Eye,
      current: usage.watchlistUsed,
      limit: usage.watchlistLimit,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      description: 'Cryptocurrencies in your watchlist'
    },
    {
      type: UsageType.BOT_NOTIFICATION,
      label: 'Bot Notifications',
      icon: MessageSquare,
      current: usage.botNotificationsUsed,
      limit: usage.botNotificationsLimit,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      description: 'Discord and Telegram notifications'
    }
  ];

  const isFreeTier = tier === 'FREE';
  const hasLimitsReached = usageItems.some(item => 
    item.limit !== -1 && item.current >= item.limit
  );
  const hasHighUsage = usageItems.some(item => 
    item.limit !== -1 && (item.current / item.limit) >= 0.8
  );

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  return (
    <div className="space-y-6">
      {/* Header with tier info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Usage & Limits</h3>
          <p className="text-sm text-muted-foreground">
            Current plan: <Badge variant={tier === 'FREE' ? 'outline' : 'default'}>
              {tier === 'FREE' && <Crown className="h-3 w-3 mr-1" />}
              {tier === 'PRO' && <Zap className="h-3 w-3 mr-1" />}
              {tier === 'BUSINESS' && <TrendingUp className="h-3 w-3 mr-1" />}
              {tier}
            </Badge>
          </p>
        </div>
        {isFreeTier && (
          <Button onClick={handleUpgrade} size="sm">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Upgrade
          </Button>
        )}
      </div>

      {/* Alert for limits reached or high usage */}
      {(hasLimitsReached || (hasHighUsage && isFreeTier)) && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/20">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-amber-900 dark:text-amber-100">
                  {hasLimitsReached ? 'Usage Limits Reached' : 'Approaching Limits'}
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                  {hasLimitsReached 
                    ? 'You\'ve reached your monthly limits for some features.'
                    : 'You\'re using most of your monthly allowance.'}
                  {isFreeTier && ' Upgrade to continue using these features without interruption.'}
                </p>
                {isFreeTier && (
                  <Button 
                    onClick={handleUpgrade} 
                    size="sm" 
                    className="mt-3"
                    variant="outline"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    View Plans
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {usageItems.map((item) => {
          const Icon = item.icon;
          const isUnlimited = item.limit === -1;
          const percentage = isUnlimited ? 0 : (item.current / item.limit) * 100;
          const isNearLimit = !isUnlimited && percentage >= 80;
          const isAtLimit = !isUnlimited && item.current >= item.limit;

          return (
            <Card key={item.type} className={`relative ${isAtLimit ? 'border-red-200' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${item.bgColor}`}>
                      <Icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                  </div>
                  <div className="text-right">
                    {isUnlimited ? (
                      <Badge variant="outline" className="text-green-600 text-xs">
                        Unlimited
                      </Badge>
                    ) : (
                      <span className={`text-sm font-mono ${
                        isAtLimit ? 'text-red-600' : 
                        isNearLimit ? 'text-amber-600' : 
                        'text-gray-600'
                      }`}>
                        {item.current}/{item.limit}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription className="text-xs">
                  {item.description}
                </CardDescription>
                
                {!isUnlimited && (
                  <div className="space-y-2">
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={`h-2 ${
                        isAtLimit ? 'text-red-600' :
                        isNearLimit ? 'text-amber-600' : 
                        'text-green-600'
                      }`}
                    />
                    
                    {isAtLimit && (
                      <div className="text-xs text-red-600 font-medium">
                        Limit reached
                      </div>
                    )}
                    
                    {isNearLimit && !isAtLimit && (
                      <div className="text-xs text-amber-600">
                        {item.limit - item.current} remaining
                      </div>
                    )}
                  </div>
                )}
                
                {isUnlimited && (
                  <div className="text-xs text-green-600 font-medium">
                    No limits on this plan
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upgrade CTA for free tier */}
      {isFreeTier && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Crown className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Unlock Your Full Potential
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  Upgrade to Pro or Business for unlimited AI analysis, more alerts, and advanced features.
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleUpgrade} size="sm">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
                <Button 
                  onClick={() => router.push('/pricing')} 
                  variant="outline" 
                  size="sm"
                >
                  Compare Plans
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default UsageDashboard;