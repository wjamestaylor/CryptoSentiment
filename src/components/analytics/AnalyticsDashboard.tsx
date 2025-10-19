"use client";

import { useState } from 'react';
import { api } from '@/lib/trpc/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart,
  Activity,
  AlertTriangle,
  Target,
  Brain,
  Zap,
  RefreshCw,
  Clock,
  TrendingUpIcon,
  TrendingDownIcon
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner } from '@/components/ui/loading';

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [performanceTimeframe, setPerformanceTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('30d');

  // Fetch analytics data
  const { 
    data: analyticsData, 
    isLoading: analyticsLoading, 
    error: analyticsError,
    refetch: refetchAnalytics
  } = api.analytics.getAnalyticsData.useQuery(undefined, {
    enabled: !!session,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Fetch performance metrics
  const { 
    data: performanceData, 
    isLoading: performanceLoading 
  } = api.analytics.getPerformanceMetrics.useQuery({ 
    timeframe: performanceTimeframe 
  }, {
    enabled: !!session,
  });

  // Fetch market overview (public data)
  const { 
    data: marketData, 
    isLoading: marketLoading 
  } = api.analytics.getMarketOverview.useQuery();

  // Fetch watchlist summary
  const { 
    data: watchlistData, 
    isLoading: watchlistLoading 
  } = api.analytics.getWatchlistSummary.useQuery(undefined, {
    enabled: !!session,
  });

  if (!session) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
          <p className="text-muted-foreground text-center mb-4">
            Sign in to access your personalized analytics and portfolio insights
          </p>
          <Button onClick={() => window.open('/auth/signin', '_blank')}>
            Sign In to View Analytics
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (analyticsError) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics Error</h3>
          <p className="text-muted-foreground text-center mb-4">
            Failed to load analytics data: {analyticsError.message}
          </p>
          <Button onClick={() => refetchAnalytics()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
            <p className="text-muted-foreground">
              Comprehensive insights into your cryptocurrency portfolio and market trends
            </p>
          </div>
          <Button 
            onClick={() => refetchAnalytics()} 
            variant="outline" 
            size="sm"
            disabled={analyticsLoading}
          >
            {analyticsLoading ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Market Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {marketLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        ${marketData?.data ? (marketData.data.totalMarketCap / 1e12).toFixed(2) : '0'}T
                      </div>
                      <p className={`text-xs ${
                        (marketData?.data?.totalMarketCapChange24h || 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {(marketData?.data?.totalMarketCapChange24h || 0) >= 0 ? '+' : ''}
                        {(marketData?.data?.totalMarketCapChange24h || 0).toFixed(2)}% from yesterday
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {marketLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-bold">
                      ${marketData?.data ? (marketData.data.totalVolume24h / 1e9).toFixed(1) : '0'}B
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">BTC Dominance</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {marketLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {(marketData?.data?.btcDominance || 0).toFixed(1)}%
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Watchlist Coins</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {watchlistLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {watchlistData?.data?.totalFollowedCoins || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        coins in watchlist
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            {analyticsLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Portfolio Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Portfolio Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Value</span>
                      <span className="text-lg font-bold">
                        ${(analyticsData?.data?.portfolioMetrics?.totalValue || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">24h P&L</span>
                      <span className={`text-lg font-bold flex items-center gap-1 ${
                        (analyticsData?.data?.portfolioMetrics?.totalGainLoss || 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {(analyticsData?.data?.portfolioMetrics?.totalGainLoss || 0) >= 0 ? (
                          <TrendingUpIcon className="h-4 w-4" />
                        ) : (
                          <TrendingDownIcon className="h-4 w-4" />
                        )}
                        ${Math.abs(analyticsData?.data?.portfolioMetrics?.totalGainLoss || 0).toLocaleString()}
                        ({(analyticsData?.data?.portfolioMetrics?.gainLossPercentage || 0).toFixed(2)}%)
                      </span>
                    </div>
                    {analyticsData?.data?.portfolioMetrics?.topPerformer && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-2">Best Performer</p>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {analyticsData.data.portfolioMetrics.topPerformer.symbol}
                          </span>
                          <Badge variant="secondary" className="text-green-600">
                            +{analyticsData.data.portfolioMetrics.topPerformer.gainLossPercentage.toFixed(2)}%
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activity Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">AI Analyses</span>
                      <span className="text-lg font-bold">
                        {analyticsData?.data?.sentimentAnalytics?.recentAnalyses || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Alerts</span>
                      <span className="text-lg font-bold">
                        {analyticsData?.data?.alertAnalytics?.totalAlerts || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">24h Triggers</span>
                      <span className="text-lg font-bold">
                        {analyticsData?.data?.alertAnalytics?.triggeredAlerts24h || 0}
                      </span>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Market Sentiment</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            analyticsData?.data?.sentimentAnalytics?.sentimentTrend === 'BULLISH' 
                              ? 'default' 
                              : analyticsData?.data?.sentimentAnalytics?.sentimentTrend === 'BEARISH'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {analyticsData?.data?.sentimentAnalytics?.sentimentTrend || 'NEUTRAL'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Avg: {(analyticsData?.data?.sentimentAnalytics?.averageSentiment || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4">
            <PortfolioAnalytics 
              data={analyticsData?.data?.portfolioMetrics}
              isLoading={analyticsLoading}
            />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <PerformanceAnalytics 
              data={performanceData?.data}
              isLoading={performanceLoading}
              timeframe={performanceTimeframe}
              onTimeframeChange={setPerformanceTimeframe}
            />
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment" className="space-y-4">
            <SentimentAnalytics 
              data={analyticsData?.data?.sentimentAnalytics}
              isLoading={analyticsLoading}
            />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <AlertAnalytics 
              data={analyticsData?.data?.alertAnalytics}
              isLoading={analyticsLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}

// Portfolio Analytics Component
function PortfolioAnalytics({ data, isLoading }: { data?: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || data.portfolioDistribution.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Portfolio Data</h3>
          <p className="text-muted-foreground text-center">
            Add cryptocurrencies to your watchlist to see portfolio analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Portfolio Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Distribution</CardTitle>
          <CardDescription>
            Breakdown of your watchlist by market value
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.portfolioDistribution.slice(0, 5).map((asset: any) => (
            <div key={asset.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {asset.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium">{asset.symbol}</p>
                  <p className="text-sm text-muted-foreground">{asset.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{asset.percentage.toFixed(1)}%</p>
                <p className={`text-sm ${
                  asset.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Top and worst performers in your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.topPerformer && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Top Performer</p>
                  <p className="font-semibold">{data.topPerformer.symbol}</p>
                  <p className="text-sm text-muted-foreground">{data.topPerformer.name}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-bold">+{data.topPerformer.gainLossPercentage.toFixed(2)}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${data.topPerformer.gainLoss.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {data.worstPerformer && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Worst Performer</p>
                  <p className="font-semibold">{data.worstPerformer.symbol}</p>
                  <p className="text-sm text-muted-foreground">{data.worstPerformer.name}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="font-bold">{data.worstPerformer.gainLossPercentage.toFixed(2)}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${data.worstPerformer.gainLoss.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Performance Analytics Component
function PerformanceAnalytics({ 
  data, 
  isLoading, 
  timeframe, 
  onTimeframeChange 
}: { 
  data?: any; 
  isLoading: boolean; 
  timeframe: string; 
  onTimeframeChange: (timeframe: '24h' | '7d' | '30d' | '1y') => void;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeframe Selector */}
      <div className="flex gap-2">
        {(['24h', '7d', '30d', '1y'] as const).map((tf) => (
          <Button
            key={tf}
            size="sm"
            variant={timeframe === tf ? 'default' : 'outline'}
            onClick={() => onTimeframeChange(tf)}
          >
            {tf}
          </Button>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (data?.returns || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(data?.returns || 0) >= 0 ? '+' : ''}{(data?.returns || 0).toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volatility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.volatility || 0).toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.sharpeRatio || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.winRate || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best/Worst Days */}
      {data?.bestDay && data?.worstDay && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Best Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">+{data.bestDay.return.toFixed(2)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(data.bestDay.date).toLocaleDateString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Worst Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">{data.worstDay.return.toFixed(2)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(data.worstDay.date).toLocaleDateString()}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Sentiment Analytics Component
function SentimentAnalytics({ data, isLoading }: { data?: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Overview</CardTitle>
          <CardDescription>
            AI sentiment analysis for your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Average Sentiment</span>
            <Badge 
              variant={
                (data?.averageSentiment || 0) > 0.2 
                  ? 'default' 
                  : (data?.averageSentiment || 0) < -0.2
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {(data?.averageSentiment || 0).toFixed(2)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Market Trend</span>
            <Badge 
              variant={
                data?.sentimentTrend === 'BULLISH' 
                  ? 'default' 
                  : data?.sentimentTrend === 'BEARISH'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {data?.sentimentTrend || 'NEUTRAL'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Recent Analyses</span>
            <span className="text-lg font-bold">
              {data?.recentAnalyses || 0}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Sentiment Coins</CardTitle>
          <CardDescription>
            Highest sentiment scores in your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.topSentimentCoins?.slice(0, 5).map((coin: any) => (
            <div key={coin.symbol} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{coin.symbol}</p>
                <p className="text-sm text-muted-foreground">{coin.name}</p>
              </div>
              <div className="text-right">
                <Badge 
                  variant={
                    coin.sentiment > 0.2 
                      ? 'default' 
                      : coin.sentiment < -0.2
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {coin.sentiment.toFixed(2)}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {(coin.confidence * 100).toFixed(0)}% confidence
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Alert Analytics Component
function AlertAnalytics({ data, isLoading }: { data?: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Alert Summary</CardTitle>
          <CardDescription>
            Overview of your alert activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{data?.totalAlerts || 0}</p>
              <p className="text-sm text-muted-foreground">Total Alerts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{data?.triggeredAlerts24h || 0}</p>
              <p className="text-sm text-muted-foreground">24h Triggers</p>
            </div>
          </div>
          
          {data?.alertsByType && Object.keys(data.alertsByType).length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Alert Types</p>
              {Object.entries(data.alertsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm">{type.replace('_', ' ')}</span>
                  <Badge variant="outline">{count as number}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Triggers</CardTitle>
          <CardDescription>
            Latest alert triggers (24h)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentTriggers?.length > 0 ? (
            <div className="space-y-3">
              {data.recentTriggers.slice(0, 5).map((trigger: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-2 border rounded">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{trigger.cryptoSymbol}</p>
                    <p className="text-xs text-muted-foreground">{trigger.message}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(trigger.triggeredAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No recent triggers</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}