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
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

// Types for unified tracking
interface CryptoTracking {
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

  // Queries
  const { 
    data: trackingData, 
    isLoading: trackingLoading, 
    refetch: refetchTracking 
  } = api.crypto.getUserCryptoTracking.useQuery({ filter: filterType });

  const trackingEntries: CryptoTracking[] = trackingData?.data?.trackingEntries || [];
  const summary = trackingData?.data?.summary;

  // Search cryptocurrencies
  const { data: searchResults, isLoading: isSearchLoading } = api.crypto.searchCryptos.useQuery(
    { query: searchQuery },
    { 
      enabled: searchQuery.length > 2 && searchQuery.trim() !== '',
      retry: false,
      refetchOnWindowFocus: false
    }
  );

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
        description: "Please select a cryptocurrency",
        variant: "destructive",
      });
      return;
    }

    if (trackingType === 'ADD_HOLDING' && (!formData.holdingAmount || !formData.purchasePrice)) {
      toast({
        title: "Error",
        description: "Please enter holding amount and purchase price",
        variant: "destructive",
      });
      return;
    }

    const baseData = {
      cryptoSymbol: formData.cryptoSymbol.toUpperCase(),
      cryptoName: formData.cryptoName,
      trackingType,
      notes: formData.notes || undefined,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : undefined,
    };

    if (trackingType === 'ADD_HOLDING') {
      addTrackingMutation.mutate({
        ...baseData,
        holdingAmount: parseFloat(formData.holdingAmount),
        purchasePrice: parseFloat(formData.purchasePrice),
        purchaseDate: new Date(formData.purchaseDate),
      });
    } else {
      addTrackingMutation.mutate(baseData);
    }
  };

  const handleRemove = (id: string, cryptoSymbol: string) => {
    if (confirm(`Are you sure you want to stop tracking ${cryptoSymbol}?`)) {
      removeTrackingMutation.mutate({ id });
    }
  };

  const handleConvertToHolding = (tracking: CryptoTracking) => {
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

  const handleConvertToWatching = (tracking: CryptoTracking) => {
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

  const calculateCurrentValue = (tracking: CryptoTracking) => {
    // For now, return purchase value since we need current prices integration
    if (tracking.holdingAmount && tracking.averagePurchasePrice) {
      return tracking.holdingAmount * tracking.averagePurchasePrice;
    }
    return 0;
  };

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
            <div className="text-right">
              <div className="flex gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Watching</p>
                  <p className="text-lg font-bold">
                    {summary?.totalWatching || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Holdings</p>
                  <p className="text-lg font-bold">
                    {summary?.totalHoldings || 0}
                  </p>
                </div>
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
                    const currentValue = calculateCurrentValue(tracking);
                    
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
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {hasHoldings && (
                            <div className="text-right">
                              <p className="font-medium">${currentValue.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">
                                {tracking.firstPurchaseDate ? 
                                  format(new Date(tracking.firstPurchaseDate), 'MMM dd, yyyy') : 
                                  'No date'
                                }
                              </p>
                            </div>
                          )}
                          
                          <div className="flex gap-1">
                            {hasHoldings ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConvertToWatching(tracking)}
                                title="Convert to watch-only"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
          {/* Add New Crypto */}
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
                        <Label htmlFor="purchasePrice">Purchase Price (USD)*</Label>
                        <Input
                          id="purchasePrice"
                          type="number"
                          step="any"
                          placeholder="50000"
                          value={formData.purchasePrice}
                          onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                          required
                        />
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

          {/* Edit Form for Converting Watch to Holdings */}
          {editingId && (
            <Card>
              <CardHeader>
                <CardTitle>Add Holdings for {formData.cryptoSymbol}</CardTitle>
                <CardDescription>
                  Convert from watch-only to portfolio holding
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
                      <Label htmlFor="editPurchasePrice">Purchase Price (USD)*</Label>
                      <Input
                        id="editPurchasePrice"
                        type="number"
                        step="any"
                        placeholder="50000"
                        value={formData.purchasePrice}
                        onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                        required
                      />
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
                      {updateTrackingMutation.isPending ? 'Adding...' : 'Add Holdings'}
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