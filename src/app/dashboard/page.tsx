"use client";

import { api } from '@/lib/trpc/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { 
  DashboardStatsLoading, 
  CryptoPriceLoading 
} from '@/components/ui/loading';
import { ErrorBoundary, ApiErrorFallback } from '@/components/ui/error-boundary';
import { AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Plus, Wallet, Star, BarChart3, Bell, Eye } from 'lucide-react';
import { PriceChart } from '@/components/analytics/PriceChart';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useUsageLimit } from '@/hooks/use-usage-limit';
import { useTrackUsage } from '@/hooks/use-track-usage';
import { UsageType } from '@prisma/client';
import { QuickStartGuide } from '@/components/onboarding/QuickStartGuide';

export default function Dashboard() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  
  // Feature gating integration
  const watchlistUsage = useUsageLimit(UsageType.WATCHLIST_ADD);
  const alertUsage = useUsageLimit(UsageType.ALERT_CREATION);
  const trackUsage = useTrackUsage();

  // Single unified dashboard data query - replaces multiple separate queries
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = api.dashboard.getDashboardData.useQuery(undefined, {
    enabled: !!session?.user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Extract data from unified response
  const summary = dashboardData?.data?.summary || {
    totalTracked: 0,
    totalWatching: 0,
    totalHoldings: 0,
    portfolioValue: 0,
    portfolioGainLoss: 0,
    portfolioGainLossPercentage: 0,
    lastUpdated: new Date()
  };

  // Combine watchlist and holdings for unified display
  const watchlistOnly = dashboardData?.data?.watchlist || [];
  const holdings = dashboardData?.data?.holdings || [];
  
  // Convert holdings to watchlist format and combine
  const holdingsAsWatchlist = holdings.map(holding => ({
    id: holding.id,
    symbol: holding.cryptoSymbol,
    name: holding.cryptoName,
    coinGeckoId: holding.coinGeckoId,
    addedAt: holding.firstPurchaseDate || new Date(),
    lastViewedAt: new Date(),
    currentPrice: holding.currentPrice,
    priceChangePercentage24h: holding.priceChangePercentage24h,
    priceChange24h: holding.priceChange24h,
    marketCap: undefined,
    volume24h: undefined,
    isHolding: true as const, // Flag to identify holdings
    holdingAmount: holding.holdingAmount,
    currentValue: holding.currentValue,
    gainLoss: holding.gainLoss,
    gainLossPercentage: holding.gainLossPercentage,
  }));

  // Create type for combined items
  type CombinedWatchlistItem = typeof watchlistOnly[0] & {
    isHolding: boolean;
    holdingAmount?: number;
    currentValue?: number;
    gainLoss?: number;
    gainLossPercentage?: number;
  };

  // Combine both lists with holdings first (they're more important)
  const combinedWatchlist: CombinedWatchlistItem[] = [
    ...holdingsAsWatchlist,
    ...watchlistOnly.map(item => ({ ...item, isHolding: false as const }))
  ];
  
  const topPerformer = dashboardData?.data?.topPerformer;

  // Mutations - Updated to use unified tracking system
  const removeCryptoMutation = api.crypto.removeCryptoTracking.useMutation({
    onSuccess: () => {
      refetchDashboard();
      toast({
        title: "Success",
        description: "Removed from watchlist",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUnfollow = (cryptoId: string, symbol: string) => {
    removeCryptoMutation.mutate({ id: cryptoId });
    
    // Track usage for analytics
    trackUsage(UsageType.WATCHLIST_ADD, {
      action: 'remove',
      cryptoSymbol: symbol,
      source: 'dashboard',
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchDashboard();
      toast({
        title: "Refreshed",
        description: "Dashboard data updated successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to refresh dashboard data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to CryptoSentiment</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Sign in to start tracking your cryptocurrency portfolio and sentiment analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Track your cryptocurrency portfolio and market insights
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Usage Indicators */}
            <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 md:h-4 md:w-4" />
                <span>{watchlistUsage.currentUsage}/{watchlistUsage.limit}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bell className="h-3 w-3 md:h-4 md:w-4" />
                <span>{alertUsage.currentUsage}/{alertUsage.limit}</span>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Portfolio Stats Cards */}
        <ErrorBoundary fallback={({ resetError }) => <ApiErrorFallback resetError={resetError} />}>
          {dashboardLoading ? (
            <DashboardStatsLoading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Portfolio Value</p>
                      <p className="text-lg md:text-2xl font-bold truncate">
                        ${summary.portfolioValue.toLocaleString()}
                      </p>
                    </div>
                    <Wallet className="h-6 w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">24h Change</p>
                      <p className={`text-lg md:text-2xl font-bold truncate ${summary.portfolioGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${summary.portfolioGainLoss >= 0 ? '+' : ''}${summary.portfolioGainLoss.toFixed(2)}
                      </p>
                    </div>
                    {summary.portfolioGainLoss >= 0 ? (
                      <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-600 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">24h Change %</p>
                      <p className={`text-lg md:text-2xl font-bold truncate ${summary.portfolioGainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.portfolioGainLossPercentage >= 0 ? '+' : ''}{summary.portfolioGainLossPercentage.toFixed(2)}%
                      </p>
                    </div>
                    <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-purple-600 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Holdings</p>
                      <p className="text-lg md:text-2xl font-bold">{summary.totalHoldings}</p>
                      <p className="text-xs text-muted-foreground">Watching: {summary.totalWatching}</p>
                    </div>
                    <Wallet className="h-6 w-6 md:h-8 md:w-8 text-orange-600 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ErrorBoundary>

        {/* Quick Start Guide - Show when user has no tracked cryptos */}
        {summary.totalTracked === 0 && (
          <div className="mb-6 md:mb-8">
            <QuickStartGuide hasAnyData={false} />
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* My Cryptocurrencies */}
          <div className="xl:col-span-2">
            {summary.totalTracked === 0 ? (
              // Show setup when no cryptos are tracked at all
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Star className="h-4 w-4 md:h-5 md:w-5" />
                    Start Tracking Cryptocurrencies
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Begin by adding cryptocurrencies to watch or track your portfolio holdings
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-6 md:py-8">
                  <Star className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-base md:text-lg font-medium mb-2">No Cryptocurrencies Yet</h3>
                  <p className="text-muted-foreground mb-6 text-sm md:text-base">
                    Add cryptocurrencies to your watchlist or track your portfolio holdings to get started with market insights and performance tracking.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild size="lg" className="w-full sm:w-auto">
                      <a href="/crypto">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Cryptocurrencies
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                      <a href="/crypto">
                        <Star className="h-4 w-4 mr-2" />
                        Browse Market
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Show watchlist when portfolio exists or when tracking any cryptos
              <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                  <CardTitle className="text-lg md:text-xl">My Cryptocurrencies</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Your watched and held cryptocurrencies ({summary.totalWatching + summary.totalHoldings} total)
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                  <a href="/crypto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add More
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                <ErrorBoundary fallback={({ resetError }) => <ApiErrorFallback resetError={resetError} />}>
                  {dashboardLoading ? (
                    <CryptoPriceLoading />
                  ) : dashboardError ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                      <p className="text-muted-foreground">Failed to load your cryptocurrencies</p>
                      <Button onClick={() => refetchDashboard()} variant="outline" className="mt-2">
                        Try Again
                      </Button>
                    </div>
                  ) : combinedWatchlist.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">No cryptocurrencies tracked yet</p>
                      <Button asChild>
                        <a href="/crypto">Add Your First Crypto</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {combinedWatchlist.slice(0, 6).map((crypto) => (
                        <div key={crypto.id} className="flex items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs md:text-sm font-semibold">
                                {crypto.symbol?.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm md:text-base">{crypto.symbol?.toUpperCase()}</p>
                                {crypto.isHolding ? (
                                  <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                    Holding
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Watching
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground truncate">{crypto.name}</p>
                              {crypto.isHolding && crypto.holdingAmount && (
                                <p className="text-xs text-muted-foreground">
                                  {crypto.holdingAmount} {crypto.symbol?.toUpperCase()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="font-medium text-sm md:text-base">
                                ${crypto.currentPrice?.toLocaleString() || 'N/A'}
                              </p>
                              {crypto.isHolding && crypto.currentValue && (
                                <p className="text-xs md:text-sm text-muted-foreground">
                                  Value: ${crypto.currentValue.toLocaleString()}
                                </p>
                              )}
                              <div className="flex flex-col md:flex-row gap-1">
                                {crypto.priceChangePercentage24h !== undefined && (
                                  <Badge 
                                    variant={crypto.priceChangePercentage24h >= 0 ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {crypto.priceChangePercentage24h >= 0 ? '+' : ''}
                                    {crypto.priceChangePercentage24h.toFixed(2)}%
                                  </Badge>
                                )}
                                {crypto.isHolding && crypto.gainLossPercentage !== undefined && (
                                  <Badge 
                                    variant={crypto.gainLossPercentage >= 0 ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    P&L: {crypto.gainLossPercentage >= 0 ? '+' : ''}{crypto.gainLossPercentage.toFixed(1)}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {!crypto.isHolding && (
                              <Button
                                onClick={() => handleUnfollow(crypto.id, crypto.symbol)}
                                variant="ghost"
                                size="sm"
                                disabled={removeCryptoMutation.isPending}
                                className="p-2"
                                title="Remove from watchlist"
                              >
                                <Star className="h-3 w-3 md:h-4 md:w-4 fill-current" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {combinedWatchlist.length > 6 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" asChild className="w-full sm:w-auto">
                            <a href="/crypto">
                              View All ({combinedWatchlist.length})
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </ErrorBoundary>
              </CardContent>
            </Card>
            )}
          </div>

          {/* Quick Actions & Portfolio Summary */}
          <div className="space-y-4 md:space-y-6">
            {/* Portfolio Holdings Summary */}
            {summary.totalHoldings > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Portfolio Summary</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Overview of your cryptocurrency investments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Holdings</span>
                      <span className="font-medium">{summary.totalHoldings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Portfolio Value</span>
                      <span className="font-medium">${summary.portfolioValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">24h Change</span>
                      <span className={`font-medium ${summary.portfolioGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.portfolioGainLoss >= 0 ? '+' : ''}${summary.portfolioGainLoss.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">24h Change %</span>
                      <span className={`font-medium ${summary.portfolioGainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.portfolioGainLossPercentage >= 0 ? '+' : ''}{summary.portfolioGainLossPercentage.toFixed(2)}%
                      </span>
                    </div>
                    <Button asChild className="w-full mt-4">
                      <a href="/crypto">View Full Portfolio</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full" variant="outline">
                  <a href="/watchlist">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Watchlist
                  </a>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <a href="/crypto">
                    <Wallet className="h-4 w-4 mr-2" />
                    Manage Portfolio
                  </a>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <a href="/alerts">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Set Price Alert
                  </a>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <a href="/sentiment">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Sentiment Analysis
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Top Performer */}
            {(topPerformer || combinedWatchlist.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">
                    {topPerformer ? 'Top Performer Today' : 'Featured Crypto'}
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    {topPerformer ? 'Best performing asset in your portfolio' : 'From your tracked cryptocurrencies'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    if (topPerformer) {
                      // Use Portfolio Service top performer (from holdings)
                      return (
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="font-semibold text-sm md:text-base">
                              {topPerformer.cryptoSymbol.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm md:text-base">{topPerformer.cryptoSymbol.toUpperCase()}</p>
                            <p className="text-xs md:text-sm text-muted-foreground truncate">{topPerformer.cryptoName}</p>
                            <Badge 
                              variant={topPerformer.gainLossPercentage >= 0 ? "default" : "destructive"}
                              className="mt-1"
                            >
                              {topPerformer.gainLossPercentage >= 0 ? '+' : ''}
                              {topPerformer.gainLossPercentage.toFixed(2)}%
                            </Badge>
                          </div>
                        </div>
                      );
                    } else if (combinedWatchlist.length > 0) {
                      // Fallback to first item in combined list
                      const crypto = combinedWatchlist[0];
                      return (
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="font-semibold text-sm md:text-base">
                              {crypto.symbol?.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm md:text-base">{crypto.symbol?.toUpperCase()}</p>
                              {crypto.isHolding && (
                                <Badge variant="default" className="text-xs">Holding</Badge>
                              )}
                            </div>
                            <p className="text-xs md:text-sm text-muted-foreground truncate">{crypto.name}</p>
                            {crypto.priceChangePercentage24h !== undefined && (
                              <Badge 
                                variant={crypto.priceChangePercentage24h >= 0 ? "default" : "destructive"}
                                className="mt-1"
                              >
                                {crypto.priceChangePercentage24h >= 0 ? '+' : ''}
                                {crypto.priceChangePercentage24h.toFixed(2)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Price Chart for Top Crypto */}
        {(topPerformer || combinedWatchlist.length > 0) && (
          <div className="mt-6 md:mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Price Chart</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Switch between watched and held coins to view detailed price analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-6">
                <ErrorBoundary fallback={({ resetError }) => <ApiErrorFallback resetError={resetError} />}>
                  <PriceChart 
                    cryptoId={topPerformer?.coinGeckoId || combinedWatchlist[0]?.coinGeckoId || combinedWatchlist[0]?.id || 'bitcoin'}
                    cryptoName={topPerformer?.cryptoName || combinedWatchlist[0]?.name}
                    cryptoSymbol={topPerformer?.cryptoSymbol || combinedWatchlist[0]?.symbol}
                    enableMultiView={true}
                  />
                </ErrorBoundary>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}