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

  // Get current prices for followed cryptocurrencies
  const followedCryptoIds = followedCryptos?.data
    ?.map(crypto => crypto.coinGeckoId)
    .filter(Boolean) || []; // Filter out null/undefined values
  
  const { data: followedCryptoPrices } = api.crypto.getCryptosByIds.useQuery(
    { ids: followedCryptoIds as string[] },
    { 
      enabled: !!session && followedCryptoIds.length > 0,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

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

  // Merge top cryptocurrencies with watched ones, ensuring no duplicates
  const getAllDisplayedCryptos = () => {
    const topCryptosData = topCryptos?.data || [];
    const watchedCryptosData = followedCryptoPrices?.data || [];
    
    // Create a map of existing crypto IDs from top cryptocurrencies
    const topCryptoIds = new Set(topCryptosData.map((crypto: CoinGeckoPrice) => crypto.id));
    
    // Filter watched cryptos that are not already in the top cryptocurrencies
    const additionalWatchedCryptos = watchedCryptosData.filter(
      (crypto: CoinGeckoPrice) => !topCryptoIds.has(crypto.id)
    );
    
    // Combine top cryptocurrencies with additional watched ones
    return [...topCryptosData, ...additionalWatchedCryptos];
  };

  const allDisplayedCryptos = getAllDisplayedCryptos();

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
      <div className="container mx-auto py-4 px-3 sm:py-6 sm:px-4 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Cryptocurrency Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track top cryptocurrencies and manage your watchlist
          </p>
        </div>

        {/* Quick Stats */}
        {allDisplayedCryptos && allDisplayedCryptos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Shown</p>
                  <p className="text-xl sm:text-2xl font-bold">{allDisplayedCryptos.length}</p>
                </div>
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 self-end sm:self-center" />
              </div>
            </Card>
            <Card className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Watchlist</p>
                  <p className="text-xl sm:text-2xl font-bold">{followedCryptos?.data?.length || 0}</p>
                </div>
                <div className="text-xl sm:text-2xl self-end sm:self-center">⭐</div>
              </div>
            </Card>
            <Card className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Gainers</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-500">
                    {allDisplayedCryptos.filter((c: CoinGeckoPrice) => c.price_change_percentage_24h > 0).length}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 self-end sm:self-center" />
              </div>
            </Card>
            <Card className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Losers</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-500">
                    {allDisplayedCryptos.filter((c: CoinGeckoPrice) => c.price_change_percentage_24h < 0).length}
                  </p>
                </div>
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 self-end sm:self-center" />
              </div>
            </Card>
          </div>
        )}

        {/* Cryptocurrency Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {session && followedCryptos?.data?.length ? 
              'Top Cryptocurrencies & Your Watchlist' : 
              'Top Cryptocurrencies'
            }
          </h2>
          <div className={`grid gap-3 sm:gap-4 ${
            isMobile 
              ? 'grid-cols-1' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {allDisplayedCryptos?.map((crypto: CoinGeckoPrice) => (
              <Card key={crypto.id} className="p-3 sm:p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] dark:hover:shadow-primary/25">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <Image 
                        src={crypto.image} 
                        alt={crypto.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                      />
                      <div className="absolute -top-1 -right-1 bg-muted rounded-full px-1 text-xs font-bold">
                        #{crypto.market_cap_rank}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{crypto.name}</h3>
                        {isInWatchlist(crypto.symbol) && (
                          <div className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                            ⭐
                          </div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{crypto.symbol.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm sm:text-lg">${crypto.current_price.toLocaleString()}</p>
                    <p className={`text-xs sm:text-sm flex items-center justify-end ${
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
                    className="flex-1 text-xs sm:text-sm py-1 sm:py-2"
                    onClick={() => window.open(`/sentiment?crypto=${crypto.id}`, '_blank')}
                  >
                    🤖 {isMobile ? 'AI' : 'AI Analysis'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant={isInWatchlist(crypto.symbol) ? "default" : "outline"}
                    onClick={() => handleWatchlistToggle(crypto)}
                    disabled={addingToWatchlist === crypto.symbol}
                    className={`px-2 sm:px-3 py-1 sm:py-2 ${isInWatchlist(crypto.symbol) ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}`}
                  >
                    {addingToWatchlist === crypto.symbol ? (
                      <LoadingSpinner className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : session ? (
                      isInWatchlist(crypto.symbol) ? "⭐" : "☆"
                    ) : "🔐"}
                  </Button>
                </div>
                
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
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

        {allDisplayedCryptos?.length === 0 && !isLoading && (
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