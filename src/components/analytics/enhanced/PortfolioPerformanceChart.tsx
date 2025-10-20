"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, BarChart3, Target, Wallet, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PortfolioPerformanceChartProps {
  portfolioData?: {
    portfolioMetrics: {
      totalValue: number;
      totalGainLoss: number;
      gainLossPercentage: number;
      portfolioDistribution: Array<{
        symbol: string;
        name: string;
        value: number;
        percentage: number;
        currentPrice: number;
        priceChange24h: number;
      }>;
      topPerformer: {
        symbol: string;
        name: string;
        gainLoss: number;
        gainLossPercentage: number;
      } | null;
      worstPerformer: {
        symbol: string;
        name: string;
        gainLoss: number;
        gainLossPercentage: number;
      } | null;
    };
    sentimentAnalytics: {
      averageSentiment: number;
      sentimentTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      recentAnalyses: number;
    };
    alertAnalytics: {
      totalAlerts: number;
      triggeredAlerts24h: number;
    };
  };
  isLoading?: boolean;
  className?: string;
}

export function PortfolioPerformanceChart({ 
  portfolioData, 
  isLoading = false, 
  className 
}: PortfolioPerformanceChartProps) {
  const [activeTab, setActiveTab] = useState('overview');

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
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!portfolioData?.portfolioMetrics) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Portfolio Data</h3>
          <p className="text-muted-foreground text-center">
            Add some cryptocurrency holdings to see performance analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  const metrics = portfolioData.portfolioMetrics;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Portfolio Performance
        </CardTitle>
        <CardDescription>
          Comprehensive analysis of your cryptocurrency portfolio
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Value</p>
                      <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                        ${metrics.totalValue.toLocaleString()}
                      </p>
                    </div>
                    <Wallet className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`${metrics.gainLossPercentage >= 0 ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${metrics.gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Total Return
                      </p>
                      <p className={`text-2xl font-bold ${metrics.gainLossPercentage >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                        {metrics.gainLossPercentage >= 0 ? '+' : ''}{metrics.gainLossPercentage.toFixed(2)}%
                      </p>
                      <p className={`text-sm ${metrics.gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${metrics.totalGainLoss >= 0 ? '+' : ''}{metrics.totalGainLoss.toLocaleString()}
                      </p>
                    </div>
                    {metrics.gainLossPercentage >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Holdings</p>
                      <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                        {metrics.portfolioDistribution.length}
                      </p>
                      <p className="text-sm text-purple-600">Assets</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sentiment & Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Portfolio Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Sentiment</span>
                      <Badge 
                        variant={portfolioData.sentimentAnalytics.sentimentTrend === 'BULLISH' ? 'default' : 
                                portfolioData.sentimentAnalytics.sentimentTrend === 'BEARISH' ? 'destructive' : 'secondary'}
                        className={portfolioData.sentimentAnalytics.sentimentTrend === 'BULLISH' ? 'bg-green-600' : ''}
                      >
                        {portfolioData.sentimentAnalytics.sentimentTrend}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sentiment Score</span>
                      <span className="font-semibold">
                        {portfolioData.sentimentAnalytics.averageSentiment.toFixed(1)}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Recent Analyses</span>
                      <span className="font-semibold">
                        {portfolioData.sentimentAnalytics.recentAnalyses}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alert Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Alerts</span>
                      <span className="font-semibold">
                        {portfolioData.alertAnalytics.totalAlerts}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Triggered (24h)</span>
                      <Badge variant={portfolioData.alertAnalytics.triggeredAlerts24h > 0 ? 'default' : 'secondary'}>
                        {portfolioData.alertAnalytics.triggeredAlerts24h}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Performer */}
              {metrics.topPerformer && (
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800 dark:text-green-200 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Top Performer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{metrics.topPerformer.symbol}</span>
                        <Badge className="bg-green-600">
                          +{metrics.topPerformer.gainLossPercentage.toFixed(2)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{metrics.topPerformer.name}</p>
                      <p className="text-sm text-green-600">
                        +${metrics.topPerformer.gainLoss.toLocaleString()} gain
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Worst Performer */}
              {metrics.worstPerformer && (
                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-red-800 dark:text-red-200 flex items-center gap-2">
                      <TrendingDown className="h-5 w-5" />
                      Worst Performer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{metrics.worstPerformer.symbol}</span>
                        <Badge variant="destructive">
                          {metrics.worstPerformer.gainLossPercentage.toFixed(2)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{metrics.worstPerformer.name}</p>
                      <p className="text-sm text-red-600">
                        ${metrics.worstPerformer.gainLoss.toLocaleString()} loss
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Holdings Tab */}
          <TabsContent value="holdings" className="space-y-6">
            {metrics.portfolioDistribution.length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-semibold">Portfolio Distribution</h4>
                {metrics.portfolioDistribution.map((holding) => (
                  <Card key={holding.symbol}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-semibold">{holding.symbol}</p>
                              <p className="text-sm text-muted-foreground">{holding.name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${holding.value.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{holding.percentage.toFixed(1)}%</p>
                          <div className="flex items-center gap-1 mt-1">
                            {holding.priceChange24h >= 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span className={`text-xs ${holding.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {holding.priceChange24h >= 0 ? '+' : ''}{holding.priceChange24h.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No holdings data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}