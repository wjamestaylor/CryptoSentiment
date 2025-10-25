'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface FeatureHighlightProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: {
    label: string;
    href: string;
  };
  badge?: string;
  color?: 'blue' | 'purple' | 'green' | 'orange';
  isNew?: boolean;
}

const COLOR_CLASSES = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    badge: 'bg-blue-600'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    badge: 'bg-purple-600'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    badge: 'bg-green-600'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    badge: 'bg-orange-600'
  }
};

export function FeatureHighlight({
  title,
  description,
  icon,
  action,
  badge,
  color = 'blue',
  isNew = false
}: FeatureHighlightProps) {
  const colors = COLOR_CLASSES[color];

  return (
    <Card className={`${colors.bg} ${colors.border} transition-all hover:shadow-lg`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${colors.icon}`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {title}
                {isNew && (
                  <Badge className={`${colors.badge} text-white text-xs`}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    New
                  </Badge>
                )}
              </CardTitle>
              {badge && !isNew && (
                <Badge variant="secondary" className="mt-1">
                  {badge}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <CardDescription className="mt-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full group">
          <Link href={action.href}>
            {action.label}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
