"use client";

import { useState, useMemo } from 'react';
import { api } from '@/lib/trpc/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw, Eye, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner } from '@/components/ui/loading';

interface PriceChartProps {
  cryptoId: string;
  cryptoName?: string;
  cryptoSymbol?: string;
  className?: string;
  enableMultiView?: boolean; // Enable watched/held switching
}

interface PricePoint {
  timestamp: string;
  price: number;
  marketCap: number;
  volume: number;
}

export function PriceChart({ 
  cryptoId, 
  cryptoName, 
  cryptoSymbol, 
  className,
  enableMultiView = false,
}: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<number>(30);
  const [viewMode, setViewMode] = useState<'watched' | 'held'>('watched');
  const [selectedCryptoId, setSelectedCryptoId] = useState<string>(cryptoId);

  // Fetch watched coins (only when multi-view is enabled)
  const { 
    data: watchedCoins, 
    isLoading: isLoadingWatched 
  } = api.crypto.getWatchedCoins.useQuery(undefined, {
    enabled: enableMultiView,
  });

  // Fetch held coins (only when multi-view is enabled)
  const { 
    data: heldCoins, 
    isLoading: isLoadingHeld 
  } = api.crypto.getHeldCoins.useQuery(undefined, {
    enabled: enableMultiView,
  });

  // Fetch price history for selected crypto
  const { 
    data: priceData, 
    isLoading: isLoadingPrice, 
    error,
    refetch
  } = api.analytics.getPriceHistory.useQuery({
    cryptoId: selectedCryptoId,
    days: timeframe,
  });

  const isLoading = isLoadingPrice || (enableMultiView && (isLoadingWatched || isLoadingHeld));

  // Calculate price statistics
  const priceStats = useMemo(() => {
    if (!priceData?.data || priceData.data.length === 0) {
      return null;
    }

    const prices = priceData.data.map((point: PricePoint) => point.price);
    const volumes = priceData.data.map((point: PricePoint) => point.volume);
    
    const currentPrice = prices[prices.length - 1];
    const initialPrice = prices[0];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    const priceChange = currentPrice - initialPrice;
    const priceChangePercentage = ((priceChange / initialPrice) * 100);
    
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const maxVolume = Math.max(...volumes);

    return {
      currentPrice,
      initialPrice,
      minPrice,
      maxPrice,
      priceChange,
      priceChangePercentage,
      avgVolume,
      maxVolume,
      dataPoints: priceData.data.length,
    };
  }, [priceData]);

  // Simple line chart data processing
  const chartData = useMemo(() => {
    if (!priceData?.data || priceData.data.length === 0) {
      return { pricePoints: [], volumePoints: [] };
    }

    const data = priceData.data;
    const pricePoints = data.map((point: PricePoint, index: number) => ({
      x: (index / (data.length - 1)) * 100, // Percentage of chart width
      y: point.price,
      timestamp: point.timestamp,
    }));

    const volumePoints = data.map((point: PricePoint, index: number) => ({
      x: (index / (data.length - 1)) * 100,
      y: point.volume,
      timestamp: point.timestamp,
    }));

    return { pricePoints, volumePoints };
  }, [priceData]);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BarChart3 className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chart Error</h3>
          <p className="text-muted-foreground text-center mb-4">
            Failed to load price data: {error.message}
          </p>
          <Button onClick={() => refetch()} variant="outline">
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {cryptoName || 'Price Chart'}
                {cryptoSymbol && (
                  <Badge variant="outline">{cryptoSymbol.toUpperCase()}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Price history and market data analysis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeframe.toString()} onValueChange={(value) => setTimeframe(Number(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1D</SelectItem>
                  <SelectItem value="7">7D</SelectItem>
                  <SelectItem value="30">30D</SelectItem>
                  <SelectItem value="90">90D</SelectItem>
                  <SelectItem value="365">1Y</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                {isLoadingPrice ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Multi-View Tabs (if enabled) */}
          {enableMultiView && (watchedCoins?.data || heldCoins?.data) && (
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'watched' | 'held')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="watched" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Watched ({watchedCoins?.data?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="held" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Held ({heldCoins?.data?.length || 0})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="watched" className="mt-4">
                {watchedCoins?.data && watchedCoins.data.length > 0 ? (
                  <CoinSelector
                    coins={watchedCoins.data}
                    selectedCoinId={selectedCryptoId}
                    onSelectCoin={setSelectedCryptoId}
                  />
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No watched coins yet. Add coins to your watchlist to see them here.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="held" className="mt-4">
                {heldCoins?.data && heldCoins.data.length > 0 ? (
                  <CoinSelector
                    coins={heldCoins.data}
                    selectedCoinId={selectedCryptoId}
                    onSelectCoin={setSelectedCryptoId}
                  />
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No held coins yet. Add holdings to your portfolio to see them here.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Price Statistics */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : priceStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-lg font-bold">
                  ${priceStats.currentPrice.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {timeframe}D Change
                </p>
                <div className={`flex items-center gap-1 ${
                  priceStats.priceChangePercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {priceStats.priceChangePercentage >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-bold">
                    {priceStats.priceChangePercentage >= 0 ? '+' : ''}
                    {priceStats.priceChangePercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High / Low</p>
                <p className="text-sm font-medium">
                  ${priceStats.maxPrice.toLocaleString()} / ${priceStats.minPrice.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Volume</p>
                <p className="text-sm font-medium">
                  ${(priceStats.avgVolume / 1e6).toFixed(1)}M
                </p>
              </div>
            </div>
          ) : null}

          {/* Simple Chart Visualization */}
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : chartData.pricePoints.length > 0 ? (
            <div className="space-y-4">
              {/* Price Chart */}
              <div className="relative">
                <div className="text-sm font-medium mb-2">Price Trend</div>
                <div className="relative h-64 border rounded-lg bg-muted/20 overflow-hidden">
                  <SimplePriceChart 
                    data={chartData.pricePoints}
                    minPrice={priceStats?.minPrice || 0}
                    maxPrice={priceStats?.maxPrice || 0}
                    isPositive={priceStats ? priceStats.priceChangePercentage >= 0 : true}
                  />
                </div>
              </div>

              {/* Volume Chart */}
              <div className="relative">
                <div className="text-sm font-medium mb-2">Volume Trend</div>
                <div className="relative h-16 border rounded-lg bg-muted/20 overflow-hidden">
                  <SimpleVolumeChart 
                    data={chartData.volumePoints}
                    maxVolume={priceStats?.maxVolume || 0}
                  />
                </div>
              </div>

              {/* Data Points Info */}
              <div className="text-xs text-muted-foreground text-center">
                Showing {priceStats?.dataPoints || 0} data points over {timeframe} day{timeframe !== 1 ? 's' : ''}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Chart Data</h3>
              <p className="text-muted-foreground text-center">
                Price history data is not available for this cryptocurrency
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}

// Simple Price Chart Component (SVG-based)
function SimplePriceChart({ 
  data, 
  minPrice, 
  maxPrice, 
  isPositive 
}: { 
  data: Array<{ x: number; y: number; timestamp: string }>; 
  minPrice: number; 
  maxPrice: number; 
  isPositive: boolean;
}) {
  const priceRange = maxPrice - minPrice;
  const chartHeight = 256; // 64 * 4 (h-64 in Tailwind)

  if (data.length === 0 || priceRange === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available
      </div>
    );
  }

  // Convert price data to chart coordinates
  const points = data.map(point => ({
    x: point.x,
    y: ((maxPrice - point.y) / priceRange) * (chartHeight - 40) + 20, // 20px margin
    timestamp: point.timestamp,
  }));

  // Create SVG path
  const pathData = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  // Create area path for gradient fill
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <div className="relative w-full h-full">
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox={`0 0 100 ${chartHeight}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop 
              offset="0%" 
              stopColor={isPositive ? "rgb(34 197 94)" : "rgb(239 68 68)"} 
              stopOpacity="0.3" 
            />
            <stop 
              offset="100%" 
              stopColor={isPositive ? "rgb(34 197 94)" : "rgb(239 68 68)"} 
              stopOpacity="0.05" 
            />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#priceGradient)"
        />
        
        {/* Price line */}
        <path
          d={pathData}
          fill="none"
          stroke={isPositive ? "rgb(34 197 94)" : "rgb(239 68 68)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            fill={isPositive ? "rgb(34 197 94)" : "rgb(239 68 68)"}
            strokeWidth="0"
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <title>
              ${data[index].y.toLocaleString()} at {new Date(point.timestamp).toLocaleDateString()}
            </title>
          </circle>
        ))}
      </svg>
      
      {/* Price labels */}
      <div className="absolute top-2 left-2 text-xs text-muted-foreground">
        ${maxPrice.toLocaleString()}
      </div>
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
        ${minPrice.toLocaleString()}
      </div>
    </div>
  );
}

// Simple Volume Chart Component (Bar chart)
function SimpleVolumeChart({ 
  data, 
  maxVolume 
}: { 
  data: Array<{ x: number; y: number; timestamp: string }>; 
  maxVolume: number;
}) {
  const chartHeight = 64;
  
  if (data.length === 0 || maxVolume === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        No volume data
      </div>
    );
  }

  const barWidth = 100 / data.length;

  return (
    <div className="relative w-full h-full">
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox={`0 0 100 ${chartHeight}`}
        preserveAspectRatio="none"
      >
        {data.map((point, index) => {
          const barHeight = (point.y / maxVolume) * (chartHeight - 4);
          const x = index * barWidth;
          const y = chartHeight - barHeight;
          
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={barWidth * 0.8} // 80% width for spacing
              height={barHeight}
              fill="rgb(99 102 241)" // indigo-500
              opacity="0.6"
              className="hover:opacity-100 transition-opacity"
            >
              <title>
                Volume: ${(point.y / 1e6).toFixed(1)}M on {new Date(point.timestamp).toLocaleDateString()}
              </title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}

// Coin Selector Component for multi-view
interface CoinData {
  coinGeckoId: string;
  symbol: string;
  name: string;
  currentPrice?: number;
  priceChangePercentage24h?: number;
}

function CoinSelector({
  coins,
  selectedCoinId,
  onSelectCoin,
}: {
  coins: CoinData[];
  selectedCoinId: string;
  onSelectCoin: (coinId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {coins.map((coin) => {
        const isSelected = coin.coinGeckoId === selectedCoinId;
        const priceChange = coin.priceChangePercentage24h || 0;
        
        return (
          <button
            key={coin.coinGeckoId}
            onClick={() => onSelectCoin(coin.coinGeckoId)}
            className={`
              p-3 rounded-lg border transition-all text-left
              ${isSelected 
                ? 'border-primary bg-primary/10 shadow-sm' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">{coin.symbol.toUpperCase()}</span>
              {coin.priceChangePercentage24h !== undefined && (
                <Badge 
                  variant={priceChange >= 0 ? "default" : "destructive"}
                  className="text-xs px-1 py-0"
                >
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">{coin.name}</div>
            {coin.currentPrice && (
              <div className="text-xs font-medium mt-1">
                ${coin.currentPrice.toLocaleString()}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}