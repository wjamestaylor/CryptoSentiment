"use client";

import { api } from '@/lib/trpc/provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Crown, Zap, Users, ArrowUpRight } from 'lucide-react';

export function SubscriptionIndicator() {
  const router = useRouter();
  const { data: subscription, isLoading } = api.subscription.getCurrent.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" data-testid="subscription-loading"></div>
      </div>
    );
  }

  if (!subscription?.success || !subscription.data) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          <Crown className="h-3 w-3 mr-1" />
          Free
        </Badge>
        <Button 
          onClick={() => router.push('/pricing')}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs hover:bg-primary/10"
        >
          Upgrade
        </Button>
      </div>
    );
  }

  const sub = subscription.data;

  // Get tier styling
  const getTierStyle = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return { 
          variant: 'outline' as const,
          icon: Crown, 
          color: 'text-gray-600',
          label: 'Free'
        };
      case 'PRO':
        return { 
          variant: 'default' as const,
          icon: Zap, 
          color: 'text-blue-600',
          label: 'Pro'
        };
      case 'BUSINESS':
        return { 
          variant: 'default' as const,
          icon: Users, 
          color: 'text-purple-600',
          label: 'Business'
        };
      default:
        return { 
          variant: 'outline' as const,
          icon: Crown, 
          color: 'text-gray-600',
          label: 'Free'
        };
    }
  };

  const tierStyle = getTierStyle(sub.tier);
  const TierIcon = tierStyle.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={tierStyle.variant} className="text-xs">
        <TierIcon className={`h-3 w-3 mr-1 ${tierStyle.color}`} />
        {tierStyle.label}
      </Badge>
      
      {sub.tier === 'FREE' ? (
        <Button 
          onClick={() => router.push('/pricing')}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs hover:bg-primary/10"
        >
          <ArrowUpRight className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      ) : (
        <Button 
          onClick={() => router.push('/profile')}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs hover:bg-primary/10"
        >
          Manage
        </Button>
      )}
    </div>
  );
}