'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/trpc/provider';

export default function WatchlistPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Get user's followed cryptocurrencies
  const { data: followedCryptos, refetch: refetchFollowed } = api.crypto.getFollowedCryptos.useQuery(undefined, {
    enabled: !!session
  });

  // Search cryptocurrencies
  const { data: searchResults, isLoading: isSearchLoading } = api.crypto.searchCryptos.useQuery(
    { query: searchQuery },
    { 
      enabled: searchQuery.length > 2 && searchQuery.trim() !== '',
      retry: false,
      refetchOnWindowFocus: false
    }
  );

  // Mutations for following/unfollowing
  const followMutation = api.crypto.followCrypto.useMutation({
    onSuccess: () => {
      refetchFollowed();
      setSearchQuery('');
      setIsSearching(false);
    }
  });

  const unfollowMutation = api.crypto.unfollowCrypto.useMutation({
    onSuccess: () => {
      refetchFollowed();
    }
  });

  // Convert symbol to CoinGecko ID for sentiment analysis
  const symbolToId = (symbol: string): string => {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'SOL': 'solana',
      'MATIC': 'polygon',
      'BNB': 'binancecoin',
      'XRP': 'ripple',
      'DOGE': 'dogecoin',
      'SHIB': 'shiba-inu',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash',
      'XLM': 'stellar',
      'VET': 'vechain',
      'ICP': 'internet-computer',
      'FIL': 'filecoin',
      'TRX': 'tron',
      'ETC': 'ethereum-classic',
      'XMR': 'monero',
      'ALGO': 'algorand',
      'ATOM': 'cosmos',
      'HBAR': 'hedera-hashgraph',
      'NEAR': 'near',
      'MANA': 'decentraland',
      'SAND': 'the-sandbox',
      'CRO': 'crypto-com-chain',
      'FTM': 'fantom',
      'AAVE': 'aave',
      'GRT': 'the-graph',
      'ENJ': 'enjincoin',
      'LRC': 'loopring',
      'BAT': 'basic-attention-token',
      'ZEC': 'zcash',
      'DASH': 'dash',
      'XTZ': 'tezos',
      'THETA': 'theta-token',
      'RUNE': 'thorchain',
      'EGLD': 'elrond-erd-2',
      'KSM': 'kusama',
      'WAVES': 'waves',
      'COMP': 'compound-coin',
      'ZIL': 'zilliqa',
      'ICX': 'icon',
      'ONT': 'ontology',
      'ZRX': '0x',
      'BAL': 'balancer',
      'SNX': 'havven',
      'YFI': 'yearn-finance',
      'UMA': 'uma',
      'REN': 'republic-protocol',
      'KNC': 'kyber-network',
      'STORJ': 'storj',
      'BNT': 'bancor',
      'ANT': 'aragon',
      'REP': 'augur',
      'GNT': 'golem'
    };
    
    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  };

  const handleFollow = async (crypto: any) => {
    try {
      await followMutation.mutateAsync({
        symbol: crypto.symbol || crypto.id,
        name: crypto.name
      });
    } catch (error) {
      console.error('Failed to follow crypto:', error);
    }
  };

  const handleUnfollow = async (symbol: string) => {
    try {
      await unfollowMutation.mutateAsync({ symbol });
    } catch (error) {
      console.error('Failed to unfollow crypto:', error);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to manage your cryptocurrency watchlist.</p>
            <Button onClick={() => window.location.href = '/api/auth/signin'}>
              Sign In
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Watchlist</h1>
          <Button
            onClick={() => setIsSearching(!isSearching)}
            variant={isSearching ? "secondary" : "default"}
          >
            {isSearching ? "Cancel" : "Add Cryptocurrency"}
          </Button>
        </div>

        {/* Add Cryptocurrency Search */}
        {isSearching && (
          <Card>
            <CardHeader>
              <CardTitle>Add Cryptocurrency</CardTitle>
              <CardDescription>Search and add cryptocurrencies to your watchlist</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search cryptocurrency (e.g., bitcoin, ethereum)..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                  }}
                  className="w-full"
                />

                {searchQuery.length > 2 && (
                  <div className="space-y-2">
                    {isSearchLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Searching...</p>
                      </div>
                    ) : searchResults?.data?.coins?.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {searchResults.data.coins.slice(0, 10).map((crypto: any) => (
                          <div
                            key={crypto.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={crypto.thumb}
                                alt={crypto.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <div className="font-medium">{crypto.name}</div>
                                <div className="text-sm text-gray-500">{crypto.symbol?.toUpperCase()}</div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleFollow(crypto)}
                              disabled={followMutation.isLoading}
                            >
                              {followMutation.isLoading ? "Adding..." : "Add to Watchlist"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : searchQuery.length > 2 ? (
                      <div className="text-center py-4 text-gray-500">
                        No cryptocurrencies found matching "{searchQuery}"
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Watchlist */}
        <Card>
          <CardHeader>
            <CardTitle>Your Watchlist</CardTitle>
            <CardDescription>
              Cryptocurrencies you're following ({followedCryptos?.data?.length || 0} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {followedCryptos?.data?.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Your watchlist is empty</h3>
                <p className="text-gray-500 mb-4">Add cryptocurrencies to track their prices and sentiment</p>
                <Button onClick={() => setIsSearching(true)}>
                  Add Your First Cryptocurrency
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {followedCryptos?.data?.map((crypto: any) => (
                  <Card key={crypto.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">
                            {crypto.symbol?.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{crypto.name}</div>
                          <div className="text-sm text-gray-500">{crypto.symbol?.toUpperCase()}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnfollow(crypto.symbol)}
                        disabled={unfollowMutation.isLoading}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(`/sentiment?crypto=${symbolToId(crypto.symbol)}`, '_blank')}
                      >
                        🤖 AI Analysis
                      </Button>
                      <div className="text-xs text-gray-500 text-center">
                        Added {new Date(crypto.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {followedCryptos?.data?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your entire watchlist</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  📊 Bulk Sentiment Analysis
                </Button>
                <Button variant="outline" size="sm">
                  🔔 Set Alerts for All
                </Button>
                <Button variant="outline" size="sm">
                  📈 Export Watchlist
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                  🗑️ Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}