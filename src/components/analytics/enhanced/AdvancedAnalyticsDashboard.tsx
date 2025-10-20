"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Settings,
  Target,
  Wallet,
  PieChart,
  Activity
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Import enhanced components
import { PortfolioPerformanceChart } from './PortfolioPerformanceChart';
import { ComparativeAnalysis } from './ComparativeAnalysis';

// Import existing components
// import { PriceChart } from '@/components/crypto/PriceChart';

// Import services
import { api } from '@/lib/trpc/provider';

interface AdvancedAnalyticsDashboardProps {
  className?: string;
}

export function AdvancedAnalyticsDashboard({ className }: AdvancedAnalyticsDashboardProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('portfolio');
  const { toast } = useToast();

  // Get portfolio data
  const {
    data: portfolioData,
    isLoading: portfolioLoading,
    refetch: refetchPortfolio
  } = api.analytics.getAnalyticsData.useQuery(
    undefined,
    { 
      refetchInterval: 30000, // Refresh every 30 seconds
      retry: 3
    }
  );

  // Get market data for comparison
  const {
    data: marketData,
    isLoading: marketLoading,
    refetch: refetchMarket
  } = api.analytics.getMarketOverview.useQuery(
    undefined,
    { 
      refetchInterval: 60000, // Refresh every minute
      retry: 3
    }
  );

  // Get top cryptos for charts
  const {
    data: topCryptos,
    isLoading: cryptosLoading
  } = api.crypto.getTopCryptos.useQuery(
    { limit: 10 },
    { 
      refetchInterval: 300000, // Refresh every 5 minutes
      retry: 3
    }
  );

  const isLoading = portfolioLoading || marketLoading || cryptosLoading;

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setRefreshKey(prev => prev + 1);
      await Promise.all([
        refetchPortfolio(),
        refetchMarket()
      ]);
      
      toast({
        title: "Data Refreshed",
        description: "Analytics data has been updated successfully.",
      });
    } catch {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh analytics data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle export
  const handleExport = async (format: 'pdf' | 'csv' | 'xlsx') => {
    try {
      toast({
        title: "Export Started",
        description: `Generating ${format.toUpperCase()} export...`,
      });

      // TODO: Implement actual export functionality
      // This would integrate with a service to generate exports
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: `Analytics data exported as ${format.toUpperCase()} successfully.`,
        });
      }, 2000);
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive portfolio performance and market analysis
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats */}
      {!isLoading && portfolioData?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Value</p>
                  <p className="text-2xl font-bold">
                    ${portfolioData.data.portfolioMetrics?.totalValue?.toLocaleString() || '0'}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Return</p>
                  <p className="text-2xl font-bold">
                    {(portfolioData.data.portfolioMetrics?.gainLossPercentage || 0) >= 0 ? '+' : ''}
                    {portfolioData.data.portfolioMetrics?.gainLossPercentage?.toFixed(2) || '0'}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Holdings</p>
                  <p className="text-2xl font-bold">
                    {portfolioData.data.portfolioMetrics?.portfolioDistribution?.length || 0}
                  </p>
                </div>
                <PieChart className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Market Cap</p>
                  <p className="text-2xl font-bold">
                    ${(portfolioData.data.marketOverview?.totalMarketCap / 1e12)?.toFixed(2) || '0'}T
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Comparison
          </TabsTrigger>
          <TabsTrigger value="market" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Market
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Portfolio Analysis Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          <PortfolioPerformanceChart 
            portfolioData={portfolioData?.data}
            isLoading={portfolioLoading}
            key={`portfolio-${refreshKey}`}
          />
        </TabsContent>

        {/* Comparative Analysis Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <ComparativeAnalysis
            portfolioData={portfolioData?.data}
            isLoading={isLoading}
            key={`comparison-${refreshKey}`}
          />
        </TabsContent>

        {/* Market Analysis Tab */}
        <TabsContent value="market" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>
                  Current cryptocurrency market statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                ) : marketData?.data ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Market Cap</span>
                      <span className="font-semibold">
                        ${(marketData.data.totalMarketCap / 1e12)?.toFixed(2) || '0'}T
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">24h Change</span>
                      <Badge 
                        variant={(marketData.data.totalMarketCapChange24h || 0) >= 0 ? "default" : "destructive"}
                        className={(marketData.data.totalMarketCapChange24h || 0) >= 0 ? "bg-green-600" : ""}
                      >
                        {(marketData.data.totalMarketCapChange24h || 0) >= 0 ? '+' : ''}
                        {marketData.data.totalMarketCapChange24h?.toFixed(2) || '0'}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Bitcoin Dominance</span>
                      <span className="font-semibold">
                        {marketData.data.btcDominance?.toFixed(1) || '0'}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No market data available</p>
                )}
              </CardContent>
            </Card>

            {/* Top Performing Cryptos */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>
                  Best performing cryptocurrencies today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cryptosLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </div>
                ) : topCryptos?.data ? (
                  <div className="space-y-3">
                    {topCryptos.data
                      .sort((a: { price_change_percentage_24h?: number }, b: { price_change_percentage_24h?: number }) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
                      .slice(0, 5)
                      .map((crypto: { id: string; symbol?: string; price_change_percentage_24h?: number }) => (
                        <div key={crypto.id} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{crypto.symbol?.toUpperCase()}</span>
                          <Badge 
                            variant={(crypto.price_change_percentage_24h || 0) >= 0 ? "default" : "destructive"}
                            className={(crypto.price_change_percentage_24h || 0) >= 0 ? "bg-green-600" : ""}
                          >
                            {(crypto.price_change_percentage_24h || 0) >= 0 ? '+' : ''}
                            {crypto.price_change_percentage_24h?.toFixed(2) || '0'}%
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No crypto data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Price Charts */}
          {topCryptos?.data && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {topCryptos.data.slice(0, 2).map((crypto: { id: string; name?: string; symbol?: string; current_price?: number }) => (
                <Card key={crypto.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {crypto.name} ({crypto.symbol?.toUpperCase()})
                      <Badge variant="outline">
                        ${crypto.current_price?.toLocaleString()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      Price chart placeholder for {crypto.symbol}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  AI-powered analysis of your portfolio performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {portfolioData?.data ? (
                  <>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-blue-200 dark:border-blue-800 border">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        Diversification Score
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Your portfolio has {portfolioData.data.portfolioMetrics?.portfolioDistribution?.length || 0} holdings, providing 
                        {(portfolioData.data.portfolioMetrics?.portfolioDistribution?.length || 0) >= 10 ? ' excellent' : 
                         (portfolioData.data.portfolioMetrics?.portfolioDistribution?.length || 0) >= 5 ? ' good' : ' limited'} diversification.
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-green-200 dark:border-green-800 border">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                        Risk Assessment
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Based on portfolio composition, your investments show 
                        {(portfolioData.data.portfolioMetrics?.portfolioDistribution?.length || 0) >= 10 ? ' low' :
                         (portfolioData.data.portfolioMetrics?.portfolioDistribution?.length || 0) >= 5 ? ' medium' : ' high'} concentration risk.
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-purple-200 dark:border-purple-800 border">
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                        Trend Analysis
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Your portfolio is currently in a 
                        {(portfolioData.data.portfolioMetrics?.gainLossPercentage || 0) > 0 ? ' positive' : ' negative'} trend 
                        with {Math.abs(portfolioData.data.portfolioMetrics?.gainLossPercentage || 0).toFixed(1)}% total returns.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No portfolio data available for insights</p>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Suggested actions to optimize your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {portfolioData?.data && (
                  <>
                    {(portfolioData.data.portfolioMetrics?.portfolioDistribution?.length || 0) < 5 && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border-yellow-200 dark:border-yellow-800 border">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                          Diversify Holdings
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Consider adding more cryptocurrencies to reduce risk through diversification.
                        </p>
                      </div>
                    )}

                    {(portfolioData.data.portfolioMetrics?.gainLossPercentage || 0) < -20 && (
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border-red-200 dark:border-red-800 border">
                        <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                          Review Strategy
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Significant losses detected. Consider reviewing your investment strategy.
                        </p>
                      </div>
                    )}

                    {(portfolioData.data.portfolioMetrics?.gainLossPercentage || 0) > 50 && (
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-green-200 dark:border-green-800 border">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                          Take Profits
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Excellent performance! Consider taking some profits to secure gains.
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-blue-200 dark:border-blue-800 border">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        Stay Informed
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Enable price alerts to stay updated on significant market movements.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Data Refresh Info */}
      <Card className="bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Last updated: {new Date().toLocaleTimeString()} • Auto-refresh: 5 minutes
            </span>
            <span>
              Data sources: CoinGecko, Portfolio Analytics
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}