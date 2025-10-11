"use client";

import { api } from '@/lib/trpc/provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Image from 'next/image';
import { 
  DashboardStatsLoading, 
  LoadingSpinner, 
  CryptoPriceLoading 
} from '@/components/ui/loading';
import { ErrorBoundary, ApiErrorFallback } from '@/components/ui/error-boundary';
import { useIsMobile } from '@/hooks/use-media-query';
import { AlertTriangle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { CoinGeckoPrice } from '@/types';

export default function CryptoDashboard() {
  const { data: session } = useSession();
  const [addingToWatchlist, setAddingToWatchlist] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Get top cryptocurrencies
  const { data: topCryptos, isLoading, error, refetch } = api.crypto.getTopCryptos.useQuery({ limit: 10 });
  
  // Get user's followed cryptocurrencies
  const { data: followedCryptos, refetch: refetchFollowed } = api.crypto.getFollowedCryptos.useQuery(undefined, {
    enabled: !!session
  });

  // Mutations for following/unfollowing
  const followMutation = api.crypto.followCrypto.useMutation({
    onSuccess: () => {
      refetchFollowed();
      setAddingToWatchlist(null);
    },
    onError: (error: unknown) => {
      console.error('Failed to follow crypto:', error);
      setAddingToWatchlist(null);
    }
  });

  const unfollowMutation = api.crypto.unfollowCrypto.useMutation({
    onSuccess: () => {
      refetchFollowed();
      setAddingToWatchlist(null);
    },
    onError: (error: unknown) => {
      console.error('Failed to unfollow crypto:', error);
      setAddingToWatchlist(null);
    }
  });

  // Check if a crypto is in the watchlist
  const isInWatchlist = (cryptoSymbol: string) => {
    return followedCryptos?.data?.some((followed: { symbol: string }) => 
      followed.symbol.toLowerCase() === cryptoSymbol.toLowerCase()
    ) || false;
  };

  // Handle watchlist toggle
  const handleWatchlistToggle = async (crypto: { symbol: string; name: string }) => {
    if (!session) {
      window.open('/auth/signin', '_blank');
      return;
    }

    const cryptoSymbol = crypto.symbol;
    setAddingToWatchlist(cryptoSymbol);

    try {
      if (isInWatchlist(cryptoSymbol)) {
        await unfollowMutation.mutateAsync({ symbol: cryptoSymbol });
      } else {
        await followMutation.mutateAsync({ 
          symbol: cryptoSymbol,
          name: crypto.name 
        });
      }
    } catch (error) {
      console.error('Watchlist operation failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="mb-8">
          <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2"></div>
          <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
        </div>
        <DashboardStatsLoading />
        <div className="mt-8">
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4"></div>
          <CryptoPriceLoading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Cryptocurrency Dashboard</h1>
        <ErrorBoundary fallback={ApiErrorFallback}>
          <Card className="p-6 border-destructive/20 bg-destructive/5">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <h3 className="text-lg font-semibold text-destructive">
                Failed to load data
              </h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Error loading cryptocurrencies: {error.message}
            </p>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          </Card>
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-6 px-4 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Cryptocurrency Dashboard</h1>
          <p className="text-muted-foreground">
            Track top cryptocurrencies and manage your watchlist
          </p>
        </div>

        {/* Quick Stats */}
        {topCryptos?.data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Market Leaders</p>
                  <p className="text-2xl font-bold">{topCryptos.data.length}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Watchlist</p>
                  <p className="text-2xl font-bold">{followedCryptos?.data?.length || 0}</p>
                </div>
                <div className="text-2xl">⭐</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gainers</p>
                  <p className="text-2xl font-bold text-green-500">
                    {topCryptos.data.filter((c: CoinGeckoPrice) => c.price_change_percentage_24h > 0).length}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Losers</p>
                  <p className="text-2xl font-bold text-red-500">
                    {topCryptos.data.filter((c: CoinGeckoPrice) => c.price_change_percentage_24h < 0).length}
                  </p>
                </div>
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Cryptocurrency Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Top Cryptocurrencies</h2>
          <div className={`grid gap-4 ${
            isMobile 
              ? 'grid-cols-1' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {topCryptos?.data?.map((crypto: CoinGeckoPrice) => (
              <Card key={crypto.id} className="p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] dark:hover:shadow-primary/25">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Image 
                        src={crypto.image} 
                        alt={crypto.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="absolute -top-1 -right-1 bg-muted rounded-full px-1 text-xs font-bold">
                        #{crypto.market_cap_rank}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">{crypto.name}</h3>
                      <p className="text-sm text-muted-foreground">{crypto.symbol.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${crypto.current_price.toLocaleString()}</p>
                    <p className={`text-sm flex items-center ${
                      crypto.price_change_percentage_24h >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {crypto.price_change_percentage_24h >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(crypto.price_change_percentage_24h)?.toFixed(2)}%
                    </p>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2 mb-3">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(`/sentiment?crypto=${crypto.id}`, '_blank')}
                  >
                    🤖 {isMobile ? 'AI' : 'AI Analysis'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant={isInWatchlist(crypto.symbol) ? "default" : "outline"}
                    onClick={() => handleWatchlistToggle(crypto)}
                    disabled={addingToWatchlist === crypto.symbol}
                    className={isInWatchlist(crypto.symbol) ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
                  >
                    {addingToWatchlist === crypto.symbol ? (
                      <LoadingSpinner className="h-4 w-4" />
                    ) : session ? (
                      isInWatchlist(crypto.symbol) ? "⭐" : "☆"
                    ) : "🔐"}
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Market Cap:</span>
                    <span className="font-medium">${(crypto.market_cap / 1e9).toFixed(2)}B</span>
                  </div>
                  <div className="flex justify-between">
                    <span>24h Volume:</span>
                    <span className="font-medium">${(crypto.total_volume / 1e6).toFixed(2)}M</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {topCryptos?.data?.length === 0 && (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No data available</h3>
                <p className="text-muted-foreground">
                  No cryptocurrency data available at the moment
                </p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
}