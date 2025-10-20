"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Target, Globe, Bitcoin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface ComparativeAnalysisProps {
  portfolioData?: {
    portfolioMetrics: {
      totalValue: number;
      totalGainLoss: number;
      gainLossPercentage: number;
    };
    marketOverview: {
      totalMarketCap: number;
      totalMarketCapChange24h: number;
      btcDominance: number;
    };
  };
  marketData?: {
    totalMarketCap: number;
    totalMarketCapChange24h: number;
    btcDominance: number;
  };
  isLoading?: boolean;
  className?: string;
}

export function ComparativeAnalysis({ 
  portfolioData, 
  marketData,
  isLoading = false, 
  className 
}: ComparativeAnalysisProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('30d');

  // Use market data from either source
  const actualMarketData = marketData || portfolioData?.marketOverview;

  // Calculate comparative metrics
  const comparativeMetrics = useMemo(() => {
    if (!portfolioData?.portfolioMetrics || !actualMarketData) return null;

    const portfolioReturn = portfolioData.portfolioMetrics.gainLossPercentage;
    const marketCapChange = actualMarketData.totalMarketCapChange24h;
    
    // Simplified comparison vs market
    const vsMarket = portfolioReturn - marketCapChange;
    
    // Portfolio performance rating
    const outperformanceRating = vsMarket > 10 ? 'Excellent' : 
                                 vsMarket > 0 ? 'Good' : 
                                 vsMarket > -10 ? 'Fair' : 'Poor';

    return {
      portfolioReturn,
      marketCapChange,
      vsMarket,
      outperformanceRating,
      btcDominance: actualMarketData.btcDominance,
    };
  }, [portfolioData, actualMarketData]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!portfolioData || !actualMarketData || !comparativeMetrics) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Comparison Data</h3>
          <p className="text-muted-foreground text-center">
            Portfolio and market data needed for comparative analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Comparative Analysis
            </CardTitle>
            <CardDescription>
              How your portfolio performs against market benchmarks
            </CardDescription>
          </div>
          <Select value={timeframe} onValueChange={(value: '24h' | '7d' | '30d') => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Your Portfolio</span>
            </div>
            <div className={`flex items-center gap-1 ${
              comparativeMetrics.portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {comparativeMetrics.portfolioReturn >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-xl font-bold">
                {comparativeMetrics.portfolioReturn >= 0 ? '+' : ''}
                {comparativeMetrics.portfolioReturn.toFixed(2)}%
              </span>
            </div>
          </Card>

          <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Market Cap</span>
            </div>
            <div className={`flex items-center gap-1 ${
              comparativeMetrics.marketCapChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {comparativeMetrics.marketCapChange >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-xl font-bold">
                {comparativeMetrics.marketCapChange >= 0 ? '+' : ''}
                {comparativeMetrics.marketCapChange.toFixed(2)}%
              </span>
            </div>
          </Card>

          <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <Bitcoin className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">BTC Dominance</span>
            </div>
            <div className="flex items-center gap-1 text-orange-600">
              <span className="text-xl font-bold">
                {comparativeMetrics.btcDominance.toFixed(1)}%
              </span>
            </div>
          </Card>
        </div>

        {/* Outperformance Analysis */}
        <Card className="bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Outperformance Analysis</CardTitle>
            <CardDescription>
              How your portfolio compares to market benchmarks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* vs Market */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">vs Total Market</span>
                <Badge 
                  variant={comparativeMetrics.vsMarket >= 0 ? "default" : "destructive"}
                  className={comparativeMetrics.vsMarket >= 0 ? "bg-green-600" : ""}
                >
                  {comparativeMetrics.vsMarket >= 0 ? '+' : ''}
                  {comparativeMetrics.vsMarket.toFixed(2)}%
                </Badge>
              </div>
              <Progress 
                value={Math.min(Math.abs(comparativeMetrics.vsMarket), 20)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {comparativeMetrics.vsMarket >= 0 ? 'Outperforming' : 'Underperforming'} overall market by {Math.abs(comparativeMetrics.vsMarket).toFixed(2)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Performance Rating */}
        <Card className={`border-2 ${
          comparativeMetrics.outperformanceRating === 'Excellent' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
          comparativeMetrics.outperformanceRating === 'Good' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' :
          comparativeMetrics.outperformanceRating === 'Fair' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
          'border-red-500 bg-red-50 dark:bg-red-950/20'
        }`}>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">
                Portfolio Performance Rating
              </h3>
              <div className={`text-3xl font-bold ${
                comparativeMetrics.outperformanceRating === 'Excellent' ? 'text-green-600' :
                comparativeMetrics.outperformanceRating === 'Good' ? 'text-blue-600' :
                comparativeMetrics.outperformanceRating === 'Fair' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {comparativeMetrics.outperformanceRating}
              </div>
              <p className="text-sm text-muted-foreground">
                {comparativeMetrics.outperformanceRating === 'Excellent' && 'Your portfolio is significantly outperforming the market!'}
                {comparativeMetrics.outperformanceRating === 'Good' && 'Your portfolio is performing well against benchmarks.'}
                {comparativeMetrics.outperformanceRating === 'Fair' && 'Your portfolio is keeping pace with the market.'}
                {comparativeMetrics.outperformanceRating === 'Poor' && 'Consider reviewing your portfolio allocation strategy.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Market Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="font-medium">Total Market Cap</p>
            <p className="text-muted-foreground">${(actualMarketData.totalMarketCap / 1e12).toFixed(2)}T</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">24h Market Change</p>
            <p className={`${actualMarketData.totalMarketCapChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {actualMarketData.totalMarketCapChange24h >= 0 ? '+' : ''}{actualMarketData.totalMarketCapChange24h.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}