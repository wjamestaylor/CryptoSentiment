"use client";

import { api } from '@/lib/trpc/provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Image from 'next/image';

export default function CryptoDashboard() {
  const { data: session } = useSession();
  const [addingToWatchlist, setAddingToWatchlist] = useState<string | null>(null);
  
  // Get top cryptocurrencies
  const { data: topCryptos, isLoading, error } = api.crypto.getTopCryptos.useQuery({ limit: 10 });
  
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
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Cryptocurrency Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Cryptocurrency Dashboard</h1>
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-600">Error loading cryptocurrencies: {error.message}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2"
            variant="outline"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Cryptocurrency Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topCryptos?.data?.map((crypto: { 
          id: string; 
          symbol: string; 
          name: string; 
          image: string; 
          current_price: number; 
          price_change_percentage_24h: number;
          market_cap: number;
          total_volume: number;
          market_cap_rank: number;
        }) => (
          <Card key={crypto.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Image 
                  src={crypto.image} 
                  alt={crypto.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{crypto.name}</h3>
                  <p className="text-sm text-gray-500">{crypto.symbol.toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">${crypto.current_price.toLocaleString()}</p>
                <p className={`text-sm ${
                  crypto.price_change_percentage_24h >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {crypto.price_change_percentage_24h?.toFixed(2)}%
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
                🤖 AI Analysis
              </Button>
              <Button 
                size="sm" 
                variant={isInWatchlist(crypto.symbol) ? "default" : "outline"}
                onClick={() => handleWatchlistToggle(crypto)}
                disabled={addingToWatchlist === crypto.symbol}
                className={isInWatchlist(crypto.symbol) ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
              >
                {addingToWatchlist === crypto.symbol ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : session ? (
                  isInWatchlist(crypto.symbol) ? "⭐" : "☆"
                ) : "🔐"}
              </Button>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Market Cap:</span>
                <span>${(crypto.market_cap / 1e9).toFixed(2)}B</span>
              </div>
              <div className="flex justify-between">
                <span>24h Volume:</span>
                <span>${(crypto.total_volume / 1e6).toFixed(2)}M</span>
              </div>
              <div className="flex justify-between">
                <span>Rank:</span>
                <span>#{crypto.market_cap_rank}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {topCryptos?.data?.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No cryptocurrency data available</p>
        </Card>
      )}
    </div>
  );
}