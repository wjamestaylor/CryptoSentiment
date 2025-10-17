"use client";

import { useState } from 'react';
import { api } from '@/lib/trpc/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Calculator } from 'lucide-react';
import { format } from 'date-fns';

interface PortfolioHolding {
  id: string;
  amount: number;
  purchasePrice: number | null;
  purchaseDate: Date | null;
  notes?: string | null;
  crypto: {
    id: string;
    symbol: string;
    name: string;
  };
}

export function PortfolioManager() {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    cryptoSymbol: '',
    amount: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Queries
  const { 
    data: holdingsData, 
    isLoading: holdingsLoading, 
    refetch: refetchHoldings 
  } = api.crypto.getPortfolioHoldings.useQuery();

  const holdings: PortfolioHolding[] = holdingsData?.data || [];

  // Mutations
  const addHoldingMutation = api.crypto.addPortfolioHolding.useMutation({
    onSuccess: () => {
      refetchHoldings();
      setShowAddForm(false);
      setFormData({
        cryptoSymbol: '',
        amount: '',
        purchasePrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      toast({
        title: "Success",
        description: "Portfolio holding added successfully",
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

  const deleteHoldingMutation = api.crypto.deletePortfolioHolding.useMutation({
    onSuccess: () => {
      refetchHoldings();
      toast({
        title: "Success",
        description: "Portfolio holding removed",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cryptoSymbol || !formData.amount || !formData.purchasePrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addHoldingMutation.mutate({
      cryptoSymbol: formData.cryptoSymbol.toUpperCase(),
      amount: parseFloat(formData.amount),
      purchasePrice: parseFloat(formData.purchasePrice),
      purchaseDate: new Date(formData.purchaseDate),
      notes: formData.notes || undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this holding?')) {
      deleteHoldingMutation.mutate({ id });
    }
  };

  const calculateHoldingValue = (holding: PortfolioHolding) => {
    // For now, just return purchase value since we need current prices
    return holding.amount * (holding.purchasePrice || 0);
  };

  const totalPortfolioValue = holdings.reduce((sum, holding) => {
    return sum + calculateHoldingValue(holding);
  }, 0);

  if (holdingsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Holdings</CardTitle>
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
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Portfolio Holdings</CardTitle>
            <CardDescription>
              Manage your cryptocurrency investments
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">${totalPortfolioValue.toLocaleString()}</p>
          </div>
        </CardHeader>
      </Card>

      {/* Holdings List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Holdings</CardTitle>
          <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Holding
          </Button>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cryptoSymbol">Cryptocurrency Symbol*</Label>
                  <Input
                    id="cryptoSymbol"
                    placeholder="BTC, ETH, etc."
                    value={formData.cryptoSymbol}
                    onChange={(e) => setFormData({ ...formData, cryptoSymbol: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount*</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="any"
                    placeholder="0.5"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="DCA purchase, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={addHoldingMutation.isPending}
                >
                  {addHoldingMutation.isPending ? 'Adding...' : 'Add Holding'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {holdings.length === 0 ? (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No portfolio holdings yet</p>
                <Button onClick={() => setShowAddForm(true)}>
                  Add Your First Holding
                </Button>
              </div>
            ) : (
              holdings.map((holding) => (
                <div key={holding.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">
                        {holding.crypto.symbol.substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{holding.crypto.symbol}</p>
                      <p className="text-sm text-muted-foreground">{holding.crypto.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {holding.amount} coins
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ${(holding.purchasePrice || 0).toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-medium">
                        ${calculateHoldingValue(holding).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {holding.purchaseDate ? format(new Date(holding.purchaseDate), 'MMM dd, yyyy') : 'No date'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(holding.id)}
                      disabled={deleteHoldingMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}