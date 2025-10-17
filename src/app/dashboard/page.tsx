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
import { AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Plus, Wallet, Star, BarChart3 } from 'lucide-react';
import { CoinGeckoPrice } from '@/types';
import { PriceChart } from '@/components/analytics/PriceChart';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const { 
    data: followedCryptosData, 
    isLoading: followedLoading, 
    error: followedError,
    refetch: refetchFollowed 
  } = api.crypto.getFollowedCryptos.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const followedCryptos = followedCryptosData?.data || [];

  // Get current prices for followed cryptos
  const cryptoIds = followedCryptos.map(crypto => crypto.id).filter(Boolean);
  const { 
    data: pricesData, 
    isLoading: pricesLoading, 
    refetch: refetchPrices 
  } = api.crypto.getCryptosByIds.useQuery(
    { ids: cryptoIds },
    { 
      enabled: cryptoIds.length > 0,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const cryptoPrices = pricesData?.data || [];

  // Get portfolio holdings
  const { 
    data: portfolioData, 
    isLoading: portfolioLoading,
    refetch: refetchPortfolio 
  } = api.crypto.getPortfolioHoldings.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const portfolioHoldings = portfolioData?.data || [];

  // Mutations
  const unfollowMutation = api.crypto.unfollowCrypto.useMutation({
    onSuccess: () => {
      refetchFollowed();
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

  // Combine crypto data with prices
  const cryptosWithPrices = followedCryptos.map(crypto => {
    const priceData = cryptoPrices.find((p: CoinGeckoPrice) => p.id === crypto.id) as CoinGeckoPrice;
    return {
      ...crypto,
      currentPrice: priceData?.current_price,
      priceChange24h: priceData?.current_price ? (priceData.current_price * priceData.price_change_percentage_24h / 100) : undefined,
      priceChangePercentage24h: priceData?.price_change_percentage_24h,
      marketCap: priceData?.market_cap,
      volume24h: priceData?.total_volume,
    };
  });

  // Calculate portfolio stats based on actual holdings
  const portfolioValue = portfolioHoldings.reduce((sum, holding) => {
    const currentPrice = cryptoPrices.find((p: any) => p.id === holding.crypto.id)?.current_price || 0;
    return sum + (holding.amount * currentPrice);
  }, 0);

  const totalGain = portfolioHoldings.reduce((sum, holding) => {
    const currentPrice = cryptoPrices.find((p: any) => p.id === holding.crypto.id)?.current_price || 0;
    const purchaseValue = holding.amount * (holding.purchasePrice || 0);
    const currentValue = holding.amount * currentPrice;
    return sum + (currentValue - purchaseValue);
  }, 0);

  const avgPercentageChange = cryptosWithPrices.length > 0 
    ? cryptosWithPrices.reduce((sum, crypto) => sum + (crypto.priceChangePercentage24h || 0), 0) / cryptosWithPrices.length
    : 0;

  const handleUnfollow = (symbol: string) => {
    unfollowMutation.mutate({ symbol });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchFollowed(), refetchPrices(), refetchPortfolio()]);
      toast({
        title: "Refreshed",
        description: "Data updated successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to refresh data",
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your cryptocurrency portfolio and market insights
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Portfolio Stats Cards */}
        <ErrorBoundary fallback={({ resetError }) => <ApiErrorFallback resetError={resetError} />}>
          {followedLoading ? (
            <DashboardStatsLoading />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                      <p className="text-2xl font-bold">
                        ${portfolioValue.toLocaleString()}
                      </p>
                    </div>
                    <Wallet className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">24h Change</p>
                      <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${totalGain >= 0 ? '+' : ''}${totalGain.toFixed(2)}
                      </p>
                    </div>
                    {totalGain >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg % Change</p>
                      <p className={`text-2xl font-bold ${avgPercentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {avgPercentageChange >= 0 ? '+' : ''}{avgPercentageChange.toFixed(2)}%
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Holdings</p>
                      <p className="text-2xl font-bold">{portfolioHoldings.length}</p>
                    </div>
                    <Wallet className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ErrorBoundary>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Watchlist */}
          <div className="lg:col-span-2">
            {portfolioHoldings.length === 0 ? (
              // Show portfolio setup when no holdings exist
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Set Up Your Portfolio
                  </CardTitle>
                  <CardDescription>
                    Start tracking your cryptocurrency investments by adding your holdings
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Portfolio Holdings Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Add your cryptocurrency holdings to track performance, calculate gains/losses, and get portfolio insights.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild size="lg">
                      <a href="/portfolio">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Holding
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <a href="/watchlist">
                        <Star className="h-4 w-4 mr-2" />
                        Browse Cryptocurrencies
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Show watchlist when portfolio exists
              <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Watchlist</CardTitle>
                  <CardDescription>
                    Cryptocurrencies you&apos;re tracking
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/watchlist">
                    <Plus className="h-4 w-4 mr-2" />
                    Add More
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                <ErrorBoundary fallback={({ resetError }) => <ApiErrorFallback resetError={resetError} />}>
                  {followedLoading || pricesLoading ? (
                    <CryptoPriceLoading />
                  ) : followedError ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                      <p className="text-muted-foreground">Failed to load watchlist</p>
                      <Button onClick={() => refetchFollowed()} variant="outline" className="mt-2">
                        Try Again
                      </Button>
                    </div>
                  ) : cryptosWithPrices.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">No cryptocurrencies in your watchlist</p>
                      <Button asChild>
                        <a href="/watchlist">Add Some Coins</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cryptosWithPrices.slice(0, 6).map((crypto) => (
                        <div key={crypto.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold">
                                {crypto.symbol?.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{crypto.symbol?.toUpperCase()}</p>
                              <p className="text-sm text-muted-foreground">{crypto.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="font-medium">
                                ${crypto.currentPrice?.toLocaleString() || 'N/A'}
                              </p>
                              {crypto.priceChangePercentage24h !== undefined && (
                                <Badge 
                                  variant={crypto.priceChangePercentage24h >= 0 ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {crypto.priceChangePercentage24h >= 0 ? '+' : ''}
                                  {crypto.priceChangePercentage24h.toFixed(2)}%
                                </Badge>
                              )}
                            </div>
                            <Button
                              onClick={() => handleUnfollow(crypto.symbol)}
                              variant="ghost"
                              size="sm"
                              disabled={unfollowMutation.isPending}
                            >
                              <Star className="h-4 w-4 fill-current" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {cryptosWithPrices.length > 6 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" asChild>
                            <a href="/watchlist">
                              View All ({cryptosWithPrices.length})
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
          <div className="space-y-6">
            {/* Portfolio Holdings Summary */}
            {portfolioHoldings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Holdings</span>
                      <span className="font-medium">{portfolioHoldings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Value</span>
                      <span className="font-medium">${portfolioValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Gain/Loss</span>
                      <span className={`font-medium ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalGain >= 0 ? '+' : ''}${totalGain.toFixed(2)}
                      </span>
                    </div>
                    <Button asChild className="w-full mt-4">
                      <a href="/portfolio">View Full Portfolio</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full" variant="outline">
                  <a href="/watchlist">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Watchlist
                  </a>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <a href="/portfolio">
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
            {cryptosWithPrices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Performer Today</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const topPerformer = cryptosWithPrices.reduce((max, crypto) => 
                      (crypto.priceChangePercentage24h || 0) > (max.priceChangePercentage24h || 0) 
                        ? crypto 
                        : max
                    );
                    
                    return (
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <span className="font-semibold">
                            {topPerformer.symbol?.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{topPerformer.symbol?.toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">{topPerformer.name}</p>
                          <Badge 
                            variant={topPerformer.priceChangePercentage24h && topPerformer.priceChangePercentage24h >= 0 ? "default" : "destructive"}
                            className="mt-1"
                          >
                            {topPerformer.priceChangePercentage24h && topPerformer.priceChangePercentage24h >= 0 ? '+' : ''}
                            {topPerformer.priceChangePercentage24h?.toFixed(2)}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Price Chart for Top Crypto */}
        {cryptosWithPrices.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
                <CardDescription>
                  Detailed price analysis for {cryptosWithPrices[0]?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorBoundary fallback={({ resetError }) => <ApiErrorFallback resetError={resetError} />}>
                  <PriceChart 
                    cryptoId={cryptosWithPrices[0].id}
                    cryptoName={cryptosWithPrices[0].name}
                    cryptoSymbol={cryptosWithPrices[0].symbol}
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