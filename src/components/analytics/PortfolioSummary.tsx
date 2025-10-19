"use client";

import { useMemo } from 'react';
import { api } from '@/lib/trpc/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Star,
  BarChart3,
  Brain,
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner } from '@/components/ui/loading';

interface PortfolioSummaryProps {
  className?: string;
  showFullDetails?: boolean;
}

export function PortfolioSummary({ className, showFullDetails = false }: PortfolioSummaryProps) {
  const { data: session } = useSession();
  // Fetch watchlist summary
  const { 
    data: watchlistData, 
    isLoading: watchlistLoading,
    error: watchlistError,
    refetch: refetchWatchlist
  } = api.analytics.getWatchlistSummary.useQuery(undefined, {
    enabled: !!session,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  // Fetch market overview
  const { 
    data: marketData, 
    isLoading: marketLoading 
  } = api.analytics.getMarketOverview.useQuery();

  // Calculate portfolio insights
  const insights = useMemo(() => {
    if (!watchlistData?.data) return null;

    const data = watchlistData.data;
    const hasPositions = data.totalFollowedCoins > 0;
    const isProfit = data.portfolioGainLossPercentage > 0;
    const significantChange = Math.abs(data.portfolioGainLossPercentage) > 5;

    return {
      hasPositions,
      isProfit,
      significantChange,
      riskLevel: Math.abs(data.portfolioGainLossPercentage) > 10 ? 'high' : 
                 Math.abs(data.portfolioGainLossPercentage) > 5 ? 'medium' : 'low',
      diversification: data.totalFollowedCoins >= 10 ? 'good' : 
                      data.totalFollowedCoins >= 5 ? 'moderate' : 'low',
    };
  }, [watchlistData]);

  if (!session) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Target className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-2">Portfolio Summary</h3>
          <p className="text-sm text-muted-foreground text-center mb-3">
            Sign in to view your portfolio analytics
          </p>
          <Button size="sm" onClick={() => window.open('/auth/signin', '_blank')}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (watchlistError) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
          <h3 className="font-semibold mb-2">Error Loading Portfolio</h3>
          <p className="text-sm text-muted-foreground text-center mb-3">
            {watchlistError.message}
          </p>
          <Button size="sm" variant="outline" onClick={() => refetchWatchlist()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                Portfolio Summary
              </CardTitle>
              <CardDescription>
                Overview of your cryptocurrency watchlist
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => refetchWatchlist()}
              disabled={watchlistLoading}
            >
              {watchlistLoading ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {watchlistLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          ) : watchlistData?.data ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Coins</p>
                  <p className="text-2xl font-bold">{watchlistData.data.totalFollowedCoins}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold">
                    ${watchlistData.data.portfolioValue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Performance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">24h Performance</span>
                  <div className={`flex items-center gap-1 ${
                    watchlistData.data.portfolioGainLossPercentage >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {watchlistData.data.portfolioGainLossPercentage >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="font-bold">
                      {watchlistData.data.portfolioGainLossPercentage >= 0 ? '+' : ''}
                      {watchlistData.data.portfolioGainLossPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">P&L Amount</span>
                  <span className={`text-sm font-medium ${
                    watchlistData.data.portfolioGainLoss >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    ${Math.abs(watchlistData.data.portfolioGainLoss).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Performance Insights */}
              {insights && (
                <div className="space-y-3 pt-3 border-t">
                  {/* Risk Level */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risk Level</span>
                    <Badge 
                      variant={
                        insights.riskLevel === 'high' ? 'destructive' :
                        insights.riskLevel === 'medium' ? 'default' : 'secondary'
                      }
                    >
                      {insights.riskLevel.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Diversification */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Diversification</span>
                    <Badge 
                      variant={
                        insights.diversification === 'good' ? 'default' :
                        insights.diversification === 'moderate' ? 'secondary' : 'outline'
                      }
                    >
                      {insights.diversification.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Diversification Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Coins in Watchlist</span>
                      <span className="text-xs text-muted-foreground">
                        {watchlistData.data.totalFollowedCoins}/20
                      </span>
                    </div>
                    <Progress 
                      value={(watchlistData.data.totalFollowedCoins / 20) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              )}

              {/* Top/Bottom Performers */}
              {(watchlistData.data.topPerformer || watchlistData.data.worstPerformer) && (
                <div className="space-y-3 pt-3 border-t">
                  <h4 className="text-sm font-medium">Performance Leaders</h4>
                  
                  {watchlistData.data.topPerformer && (
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <TrendingUp className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {watchlistData.data.topPerformer.symbol}
                          </p>
                          <p className="text-xs text-muted-foreground">Best</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-green-600">
                        +{watchlistData.data.topPerformer.gainLossPercentage.toFixed(2)}%
                      </Badge>
                    </div>
                  )}

                  {watchlistData.data.worstPerformer && (
                    <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                          <TrendingDown className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {watchlistData.data.worstPerformer.symbol}
                          </p>
                          <p className="text-xs text-muted-foreground">Worst</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-red-600">
                        {watchlistData.data.worstPerformer.gainLossPercentage.toFixed(2)}%
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Recently Added */}
              {watchlistData.data.recentlyAdded && watchlistData.data.recentlyAdded.length > 0 && (
                <div className="space-y-3 pt-3 border-t">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recently Added
                  </h4>
                  <div className="space-y-2">
                    {watchlistData.data.recentlyAdded.slice(0, 3).map((coin: any) => (
                      <div key={coin.symbol} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="font-medium">{coin.symbol}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(coin.addedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {showFullDetails && (
                <div className="flex gap-2 pt-3 border-t">
                  <Button size="sm" className="flex-1" onClick={() => window.open('/dashboard', '_blank')}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Dashboard
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open('/analytics', '_blank')}>
                    <Brain className="h-4 w-4 mr-2" />
                    Full Analytics
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <Target className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-2">No Portfolio Data</h3>
              <p className="text-sm text-muted-foreground text-center mb-3">
                Add cryptocurrencies to your watchlist to see portfolio analytics
              </p>
              <Button size="sm" onClick={() => window.open('/dashboard', '_blank')}>
                <Star className="h-4 w-4 mr-2" />
                Start Watching
              </Button>
            </div>
          )}

          {/* Market Context (always shown) */}
          {!marketLoading && marketData?.data && (
            <div className="pt-3 border-t">
              <h4 className="text-sm font-medium mb-2">Market Context</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Market Cap</p>
                  <p className="font-medium">
                    ${(marketData.data.totalMarketCap / 1e12).toFixed(2)}T
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">BTC Dominance</p>
                  <p className="font-medium">
                    {marketData.data.btcDominance.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-muted-foreground">24h Market Change</p>
                <p className={`font-medium ${
                  marketData.data.totalMarketCapChange24h >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {marketData.data.totalMarketCapChange24h >= 0 ? '+' : ''}
                  {marketData.data.totalMarketCapChange24h.toFixed(2)}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}