"use client";

import { useState } from 'react';
import { api } from '@/lib/trpc/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  Wallet, 
  Plus, 
  Trash2, 
  TrendingUp,
  Search,
  Filter,
  Eye,
  DollarSign,
  Edit,
  Bell,
  BellPlus
} from 'lucide-react';
import Image from 'next/image';
import { FeatureGate } from '@/components/feature-gating/FeatureGate';
import { useUsageLimit } from '@/hooks/use-usage-limit';
import { useTrackUsage } from '@/hooks/use-track-usage';
import { UsageType } from '@prisma/client';

// Types for enhanced tracking with live prices
interface EnhancedCryptoTracking {
  id: string;
  isWatching: boolean;
  holdingAmount: number | null;
  averagePurchasePrice: number | null;
  totalInvested: number | null;
  firstPurchaseDate: Date | null;
  notes: string | null;
  tags: string[];
  lastViewedAt: Date;
  addedAt: Date;
  crypto: {
    id: string;
    symbol: string;
    name: string;
    coinGeckoId: string | null;
    logoUrl: string | null;
    marketCap: number | null;
    rank: number | null;
  };
  // Enhanced fields with live data
  currentPrice?: number;
  currentValue?: number;
  gainLoss?: number;
  gainLossPercentage?: number;
  priceChange24h?: number;
  priceChangePercentage24h?: number;
}

interface SearchCrypto {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
}

type TrackingType = 'WATCH_ONLY' | 'ADD_HOLDING';
type FilterType = 'ALL' | 'WATCHING_ONLY' | 'HOLDINGS_ONLY';

export function CryptoManager() {
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'manage'>('overview');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [trackingType, setTrackingType] = useState<TrackingType>('WATCH_ONLY');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    cryptoSymbol: '',
    cryptoName: '',
    holdingAmount: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    tags: '',
  });

  // Queries - use enhanced tracking with live prices
  const { 
    data: enhancedTrackingData, 
    isLoading: trackingLoading, 
    refetch: refetchTracking 
  } = api.crypto.getEnhancedCryptoTracking.useQuery({ filter: filterType });

  const trackingEntries = enhancedTrackingData?.data?.trackingEntries || [];
  const summary = enhancedTrackingData?.data?.summary;

  // Search cryptocurrencies
  const { data: searchResults, isLoading: isSearchLoading } = api.crypto.searchCryptos.useQuery(
    { query: searchQuery },
    { 
      enabled: searchQuery.length > 2 && searchQuery.trim() !== '',
      retry: false,
      refetchOnWindowFocus: false
    }
  );

  // Alerts integration - fetch user's alerts
  const { data: userAlerts, refetch: refetchAlerts } = api.alerts.getUserAlerts.useQuery({});

  // Feature gating integration
  const watchlistUsage = useUsageLimit(UsageType.WATCHLIST_ADD);
  const alertUsage = useUsageLimit(UsageType.ALERT_CREATION);
  const trackUsage = useTrackUsage();

  // Mutations
  const addTrackingMutation = api.crypto.addCryptoToTracking.useMutation({
    onSuccess: () => {
      refetchTracking();
      resetForm();
      toast({
        title: "Success",
        description: trackingType === 'WATCH_ONLY' 
          ? "Added to watchlist successfully" 
          : "Portfolio holding added successfully",
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

  const updateTrackingMutation = api.crypto.updateCryptoTracking.useMutation({
    onSuccess: () => {
      refetchTracking();
      setEditingId(null);
      toast({
        title: "Success",
        description: "Tracking updated successfully",
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

  const removeTrackingMutation = api.crypto.removeCryptoTracking.useMutation({
    onSuccess: () => {
      refetchTracking();
      toast({
        title: "Success",
        description: "Removed from tracking",
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

  // Alert creation mutation


  // Helper functions
  const resetForm = () => {
    setFormData({
      cryptoSymbol: '',
      cryptoName: '',
      holdingAmount: '',
      purchasePrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: '',
      tags: '',
    });
    setShowAddForm(false);
    setIsSearching(false);
    setSearchQuery('');
  };

  const handleAddFromSearch = (crypto: SearchCrypto) => {
    setFormData(prev => ({
      ...prev,
      cryptoSymbol: crypto.symbol,
      cryptoName: crypto.name,
    }));
    setSearchQuery('');
    setIsSearching(false);
    setShowAddForm(true);
  };

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cryptoSymbol || !formData.cryptoName) {
      toast({
        title: "Error",
        description: "Please select a cryptocurrency from the search results",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits for new additions
    if (!editingId && !watchlistUsage.allowed) {
      toast({
        title: "Limit Reached",
        description: `You've reached your watchlist limit (${watchlistUsage.currentUsage}/${watchlistUsage.limit}). Upgrade to track more cryptocurrencies.`,
        variant: "destructive",
      });
      return;
    }

    const data = {
      cryptoSymbol: formData.cryptoSymbol,
      cryptoName: formData.cryptoName,
      trackingType,
      holdingAmount: trackingType === 'ADD_HOLDING' ? parseFloat(formData.holdingAmount) || 0 : undefined,
      purchasePrice: trackingType === 'ADD_HOLDING' ? parseFloat(formData.purchasePrice) || 0 : undefined,
      purchaseDate: trackingType === 'ADD_HOLDING' ? (formData.purchaseDate ? new Date(formData.purchaseDate) : undefined) : undefined,
      notes: formData.notes || undefined,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
    };

    if (editingId) {
      // Update existing tracking entry
      updateTrackingMutation.mutate({
        id: editingId,
        ...data,
        trackingType: data.trackingType as 'WATCH_ONLY' | 'ADD_HOLDING' | 'REMOVE_HOLDING',
      });
    } else {
      // Add new tracking entry and track usage
      addTrackingMutation.mutate(data);
      // Track usage for analytics
      trackUsage(UsageType.WATCHLIST_ADD, {
        cryptoSymbol: data.cryptoSymbol,
        trackingType: data.trackingType,
      });
    }
  };

  const handleRemove = (id: string, cryptoSymbol: string) => {
    if (confirm(`Are you sure you want to stop tracking ${cryptoSymbol}?`)) {
      removeTrackingMutation.mutate({ id });
    }
  };

  const handleEditHolding = (tracking: EnhancedCryptoTracking) => {
    if (tracking.holdingAmount && tracking.averagePurchasePrice) {
      setEditingId(tracking.id);
      setFormData({
        cryptoSymbol: tracking.crypto.symbol,
        cryptoName: tracking.crypto.name,
        holdingAmount: tracking.holdingAmount.toString(),
        purchasePrice: tracking.averagePurchasePrice.toString(),
        purchaseDate: tracking.firstPurchaseDate ? new Date(tracking.firstPurchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: tracking.notes || '',
        tags: tracking.tags.join(', '),
      });
      // Switch to manage tab to show the edit form
      setActiveTab('manage');
    }
  };

  const handleConvertToHolding = (tracking: EnhancedCryptoTracking) => {
    if (!tracking.holdingAmount) {
      // Convert from watching to holding
      setEditingId(tracking.id);
      setFormData({
        cryptoSymbol: tracking.crypto.symbol,
        cryptoName: tracking.crypto.name,
        holdingAmount: '',
        purchasePrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: tracking.notes || '',
        tags: tracking.tags.join(', '),
      });
    }
  };

  const handleConvertToWatching = (tracking: EnhancedCryptoTracking) => {
    if (tracking.holdingAmount) {
      // Convert from holding to watching
      if (confirm(`Convert ${tracking.crypto.symbol} from holding to watch-only? This will remove your portfolio data.`)) {
        updateTrackingMutation.mutate({
          id: tracking.id,
          trackingType: 'REMOVE_HOLDING',
          notes: `Converted to watch-only on ${new Date().toLocaleDateString()}`,
        });
      }
    }
  };

  // Alert helper functions
  const getAlertsForCrypto = (symbol: string) => {
    return userAlerts?.alerts?.filter((alert: { crypto: { symbol: string }; isActive: boolean }) => 
      alert.crypto.symbol === symbol && alert.isActive
    ) || [];
  };

  const handleCreateQuickAlert = (tracking: EnhancedCryptoTracking, direction: 'above' | 'below') => {
    // Check alert usage limits
    if (!alertUsage.allowed) {
      toast({
        title: "Alert Limit Reached",
        description: `You've reached your alert limit (${alertUsage.currentUsage}/${alertUsage.limit}). Upgrade to create more alerts.`,
        variant: "destructive",
      });
      return;
    }

    const currentPrice = tracking.currentPrice;
    if (!currentPrice) {
      toast({
        title: "Error",
        description: "Current price not available",
        variant: "destructive",
      });
      return;
    }

    // Calculate suggested target price (5% above/below current price)
    const percentage = 0.05;
    const suggestedPrice = direction === 'above' 
      ? currentPrice * (1 + percentage)
      : currentPrice * (1 - percentage);

    // Show helpful toast with suggested price
    toast({
      title: `Create ${direction} alert for ${tracking.crypto.symbol}`,
      description: `Current: $${currentPrice.toFixed(2)} | Suggested: $${suggestedPrice.toFixed(2)} (${direction === 'above' ? '+' : '-'}5%)`,
    });

    // Open alerts page in new tab
    window.open('/alerts', '_blank');
  };

  // Enhanced tracking now provides live currentValue from API

  const filterOptions = [
    { value: 'ALL' as const, label: 'All Tracked', icon: Filter },
    { value: 'WATCHING_ONLY' as const, label: 'Watch Only', icon: Eye },
    { value: 'HOLDINGS_ONLY' as const, label: 'Holdings', icon: Wallet },
  ];

  if (trackingLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Crypto Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div>
                    <div className="w-16 h-4 bg-muted rounded" />
                    <div className="w-12 h-3 bg-muted rounded mt-1" />
                  </div>
                </div>
                <div className="w-20 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="crypto-manager">
      {/* Header with Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Crypto Manager
              </CardTitle>
              <CardDescription>
                Unified tracking for all your cryptocurrency interests
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {/* Usage Indicators */}
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Watchlist: {watchlistUsage.currentUsage}/{watchlistUsage.limit}</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span>Alerts: {alertUsage.currentUsage}/{alertUsage.limit}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Watching</p>
                  <p className="text-lg font-bold">
                    {summary?.totalWatching || 0}
                  </p>
                  {watchlistUsage.limit > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {watchlistUsage.limit - watchlistUsage.currentUsage} slots remaining
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Holdings</p>
                  <p className="text-lg font-bold">
                    {summary?.totalHoldings || 0}
                  </p>
                </div>
                {summary?.currentPortfolioValue !== undefined && summary.currentPortfolioValue > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Portfolio Value</p>
                    <p className="text-lg font-bold text-green-600">
                      ${summary.currentPortfolioValue.toLocaleString()}
                    </p>
                  </div>
                )}
                {summary?.totalGainLoss !== undefined && summary?.totalGainLossPercentage !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
                    <p className={`text-lg font-bold ${
                      summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {summary.totalGainLoss >= 0 ? '+' : ''}${summary.totalGainLoss.toLocaleString()}
                      <span className="text-sm ml-1">
                        ({summary.totalGainLossPercentage >= 0 ? '+' : ''}{summary.totalGainLossPercentage.toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'manage')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Manage
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Filter Controls */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Tracked Cryptocurrencies</CardTitle>
                <div className="flex gap-2">
                  {filterOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        variant={filterType === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterType(option.value)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {trackingEntries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No tracked cryptocurrencies</h3>
                  <p className="text-gray-500 mb-4">Start tracking cryptocurrencies to monitor prices and manage your portfolio</p>
                  <Button onClick={() => setActiveTab('manage')}>
                    Start Tracking
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {trackingEntries.map((tracking) => {
                    const hasHoldings = tracking.holdingAmount !== null;
                    const currentValue = tracking.currentValue || 0;
                    
                    return (
                      <div key={tracking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold">
                              {tracking.crypto.symbol.substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{tracking.crypto.symbol}</p>
                              {hasHoldings ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Wallet className="h-3 w-3 mr-1" />
                                  Holdings
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Watching
                                </Badge>
                              )}
                              {/* Alert indicator */}
                              {getAlertsForCrypto(tracking.crypto.symbol).length > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  <Bell className="h-3 w-3 mr-1" />
                                  {getAlertsForCrypto(tracking.crypto.symbol).length} alert{getAlertsForCrypto(tracking.crypto.symbol).length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{tracking.crypto.name}</p>
                            {hasHoldings && (
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {tracking.holdingAmount} coins
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Avg: ${tracking.averagePurchasePrice?.toLocaleString()}
                                </Badge>
                              </div>
                            )}
                            
                            {/* Active alerts for this crypto */}
                            {getAlertsForCrypto(tracking.crypto.symbol).length > 0 && (
                              <div className="mt-2 space-y-1">
                                {getAlertsForCrypto(tracking.crypto.symbol).slice(0, 2).map((alert: { id: string; type: string }) => (
                                  <div key={alert.id} className="flex items-center text-xs text-muted-foreground">
                                    <Bell className="h-3 w-3 mr-1" />
                                    <span className="truncate">
                                      {alert.type} Alert - {tracking.crypto.symbol}
                                    </span>
                                  </div>
                                ))}
                                {getAlertsForCrypto(tracking.crypto.symbol).length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{getAlertsForCrypto(tracking.crypto.symbol).length - 2} more alerts
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {/* Live Price Display */}
                          {tracking.currentPrice && (
                            <div className="text-right">
                              <p className="font-medium">${tracking.currentPrice.toLocaleString()}</p>
                              {tracking.priceChangePercentage24h !== undefined && (
                                <p className={`text-xs flex items-center ${
                                  tracking.priceChangePercentage24h >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  <TrendingUp className={`h-3 w-3 mr-1 ${
                                    tracking.priceChangePercentage24h < 0 ? 'rotate-180' : ''
                                  }`} />
                                  {tracking.priceChangePercentage24h >= 0 ? '+' : ''}
                                  {tracking.priceChangePercentage24h.toFixed(2)}%
                                </p>
                              )}
                            </div>
                          )}

                          {/* Portfolio Value & Performance */}
                          {hasHoldings && (
                            <div className="text-right">
                              <p className="font-medium">${currentValue.toLocaleString()}</p>
                              {tracking.gainLoss !== undefined && tracking.gainLossPercentage !== undefined && (
                                <div className="flex items-center">
                                  <p className={`text-sm ${
                                    tracking.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {tracking.gainLoss >= 0 ? '+' : ''}${tracking.gainLoss.toLocaleString()} 
                                    ({tracking.gainLossPercentage >= 0 ? '+' : ''}{tracking.gainLossPercentage.toFixed(1)}%)
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex gap-1">
                            {/* Quick alert buttons */}
                            {tracking.currentPrice && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCreateQuickAlert(tracking, 'above')}
                                  title="Create alert above current price"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <BellPlus className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCreateQuickAlert(tracking, 'below')}
                                  title="Create alert below current price"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <BellPlus className="h-4 w-4 rotate-180" />
                                </Button>
                              </>
                            )}
                            
                            {hasHoldings ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditHolding(tracking)}
                                  title="Edit holdings"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleConvertToWatching(tracking)}
                                  title="Convert to watch-only"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConvertToHolding(tracking)}
                                title="Add holdings"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemove(tracking.id, tracking.crypto.symbol)}
                              disabled={removeTrackingMutation.isPending}
                              title="Remove from tracking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage" className="space-y-4">
          {/* Add New Crypto with Feature Gating */}
          <FeatureGate 
            usageType={UsageType.WATCHLIST_ADD} 
            showUsage={true}
            fallback={
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <CardHeader>
                  <CardTitle className="text-orange-900 dark:text-orange-100">Watchlist Limit Reached</CardTitle>
                  <CardDescription className="text-orange-700 dark:text-orange-300">
                    You&apos;ve reached your cryptocurrency tracking limit. Upgrade to track more cryptocurrencies.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <a href="/pricing">Upgrade Now</a>
                  </Button>
                </CardContent>
              </Card>
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>Add Cryptocurrency</CardTitle>
                <CardDescription>
                  Add a cryptocurrency to your watchlist or portfolio
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Interface */}
              {!showAddForm && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search cryptocurrency (e.g., bitcoin, ethereum)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setIsSearching(!isSearching)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  {searchQuery.length > 2 && (
                    <div className="space-y-2">
                      {isSearchLoading ? (
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 bg-muted rounded-full"></div>
                                <div>
                                  <div className="h-4 w-16 bg-muted rounded mb-1"></div>
                                  <div className="h-3 w-12 bg-muted rounded"></div>
                                </div>
                              </div>
                              <div className="h-8 w-20 bg-muted rounded"></div>
                            </div>
                          ))}
                        </div>
                      ) : searchResults?.data?.coins?.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {searchResults?.data?.coins?.slice(0, 10).map((crypto: SearchCrypto) => (
                            <div
                              key={crypto.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center space-x-3">
                                <Image
                                  src={crypto.thumb}
                                  alt={crypto.name}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div>
                                  <div className="font-medium">{crypto.name}</div>
                                  <div className="text-sm text-gray-500">{crypto.symbol?.toUpperCase()}</div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAddFromSearch(crypto)}
                                disabled={addTrackingMutation.isPending}
                              >
                                Add to Tracking
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : searchQuery.length > 2 ? (
                        <div className="text-center py-4 text-gray-500">
                          No cryptocurrencies found matching &quot;{searchQuery}&quot;
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* Add Form */}
              {showAddForm && (
                <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Add {formData.cryptoName} ({formData.cryptoSymbol})</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                      ✕
                    </Button>
                  </div>

                  {/* Tracking Type Selection */}
                  <div className="space-y-2">
                    <Label>Tracking Type</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={trackingType === 'WATCH_ONLY' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTrackingType('WATCH_ONLY')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Watch Only
                      </Button>
                      <Button
                        type="button"
                        variant={trackingType === 'ADD_HOLDING' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTrackingType('ADD_HOLDING')}
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Add Holdings
                      </Button>
                    </div>
                  </div>

                  {/* Holdings Fields */}
                  {trackingType === 'ADD_HOLDING' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="holdingAmount">Amount*</Label>
                        <Input
                          id="holdingAmount"
                          type="number"
                          step="any"
                          placeholder="0.5"
                          value={formData.holdingAmount}
                          onChange={(e) => setFormData({ ...formData, holdingAmount: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="purchasePrice">Price per Coin (USD)*</Label>
                        <Input
                          id="purchasePrice"
                          type="number"
                          step="any"
                          placeholder="3884 (price per ETH)"
                          value={formData.purchasePrice}
                          onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter the price you paid per individual coin (not total amount spent)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="purchaseDate">Purchase Date</Label>
                        <Input
                          id="purchaseDate"
                          type="date"
                          value={formData.purchaseDate}
                          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Optional Fields */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Input
                        id="notes"
                        placeholder="DCA purchase, long-term hold, etc."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (optional)</Label>
                      <Input
                        id="tags"
                        placeholder="long-term, DCA, trading (comma-separated)"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={addTrackingMutation.isPending}
                    >
                      {addTrackingMutation.isPending ? 'Adding...' : 
                       trackingType === 'WATCH_ONLY' ? 'Add to Watchlist' : 'Add to Portfolio'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
          </FeatureGate>

          {/* Edit Form for Holdings */}
          {editingId && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {(() => {
                    const tracking = trackingEntries.find(t => t.id === editingId);
                    const isEditing = tracking?.holdingAmount !== null;
                    return isEditing ? 
                      `Edit Holdings for ${formData.cryptoSymbol}` : 
                      `Add Holdings for ${formData.cryptoSymbol}`;
                  })()}
                </CardTitle>
                <CardDescription>
                  {(() => {
                    const tracking = trackingEntries.find(t => t.id === editingId);
                    const isEditing = tracking?.holdingAmount !== null;
                    return isEditing ? 
                      "Update your portfolio holding information" : 
                      "Convert from watch-only to portfolio holding";
                  })()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!formData.holdingAmount || !formData.purchasePrice) {
                    toast({
                      title: "Error",
                      description: "Please enter holding amount and purchase price",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  updateTrackingMutation.mutate({
                    id: editingId,
                    trackingType: 'ADD_HOLDING',
                    holdingAmount: parseFloat(formData.holdingAmount),
                    purchasePrice: parseFloat(formData.purchasePrice),
                    purchaseDate: new Date(formData.purchaseDate),
                    notes: formData.notes || undefined,
                  });
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editHoldingAmount">Amount*</Label>
                      <Input
                        id="editHoldingAmount"
                        type="number"
                        step="any"
                        placeholder="0.5"
                        value={formData.holdingAmount}
                        onChange={(e) => setFormData({ ...formData, holdingAmount: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editPurchasePrice">Price per Coin (USD)*</Label>
                      <Input
                        id="editPurchasePrice"
                        type="number"
                        step="any"
                        placeholder="3884 (price per coin)"
                        value={formData.purchasePrice}
                        onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the price you paid per individual coin (not total amount spent)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="editPurchaseDate">Purchase Date</Label>
                      <Input
                        id="editPurchaseDate"
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="editNotes">Notes (optional)</Label>
                    <Input
                      id="editNotes"
                      placeholder="DCA purchase, etc."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={updateTrackingMutation.isPending}
                    >
                      {(() => {
                        const tracking = trackingEntries.find(t => t.id === editingId);
                        const isEditing = tracking?.holdingAmount !== null;
                        if (updateTrackingMutation.isPending) {
                          return isEditing ? 'Updating...' : 'Adding...';
                        }
                        return isEditing ? 'Update Holdings' : 'Add Holdings';
                      })()}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}