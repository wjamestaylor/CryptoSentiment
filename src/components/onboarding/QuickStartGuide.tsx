'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  BarChart3, 
  Bell, 
  TrendingUp,
  ChevronRight,
  X,
  Lightbulb
} from 'lucide-react';
import Link from 'next/link';

interface QuickStartItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action: {
    label: string;
    href: string;
  };
  color: string;
}

const QUICK_START_ITEMS: QuickStartItem[] = [
  {
    id: 'watchlist',
    icon: <Star className="h-5 w-5" />,
    title: 'Add Your First Crypto',
    description: 'Start tracking cryptocurrencies to monitor prices and performance',
    action: {
      label: 'Browse Cryptos',
      href: '/crypto'
    },
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20'
  },
  {
    id: 'sentiment',
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Try AI Analysis',
    description: 'Get AI-powered sentiment insights for any cryptocurrency',
    action: {
      label: 'Analyze Now',
      href: '/sentiment'
    },
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20'
  },
  {
    id: 'alerts',
    icon: <Bell className="h-5 w-5" />,
    title: 'Set Price Alerts',
    description: 'Get notified when cryptocurrencies reach your target prices',
    action: {
      label: 'Create Alert',
      href: '/alerts'
    },
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20'
  },
  {
    id: 'portfolio',
    icon: <TrendingUp className="h-5 w-5" />,
    title: 'Track Portfolio',
    description: 'Monitor your holdings and see comprehensive analytics',
    action: {
      label: 'View Analytics',
      href: '/analytics'
    },
    color: 'text-green-600 bg-green-50 dark:bg-green-950/20'
  }
];

const QUICK_START_DISMISSED_KEY = 'cryptosentiment_quickstart_dismissed';

interface QuickStartGuideProps {
  hasAnyData?: boolean;
}

export function QuickStartGuide({ hasAnyData = false }: QuickStartGuideProps) {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Only show if user has no data and hasn't dismissed it
    if (!hasAnyData) {
      const dismissed = localStorage.getItem(QUICK_START_DISMISSED_KEY);
      setIsDismissed(dismissed === 'true');
    }
  }, [hasAnyData]);

  const handleDismiss = () => {
    localStorage.setItem(QUICK_START_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  // Don't show if user has data or has dismissed
  if (isDismissed || hasAnyData) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Quick Start Guide</CardTitle>
              <CardDescription>
                Get the most out of CryptoSentiment in 4 easy steps
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
            aria-label="Dismiss guide"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUICK_START_ITEMS.map((item) => (
            <Card key={item.id} className="transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.description}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full group"
                    >
                      <Link href={item.action.href}>
                        {item.action.label}
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
