"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/trpc/provider';
import { toast } from '@/hooks/use-toast';

interface AlertSettingsProps {
  trigger?: React.ReactNode;
}

export function AlertSettings({ trigger }: AlertSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get current preferences
  const { data: preferences, isLoading } = api.auth.getPreferences.useQuery();

  // Update preferences mutation
  const updatePreferences = api.auth.updatePreferences.useMutation({
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your alert settings have been saved.",
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const [localSettings, setLocalSettings] = useState({
    sentimentThreshold: preferences?.sentimentThreshold ?? 0.7,
    priceChangeThreshold: preferences?.priceChangeThreshold ?? 0.1,
    volumeThreshold: preferences?.volumeThreshold ?? 0.5,
  });

  // Update local state when preferences load
  React.useEffect(() => {
    if (preferences) {
      setLocalSettings({
        sentimentThreshold: preferences.sentimentThreshold,
        priceChangeThreshold: preferences.priceChangeThreshold,
        volumeThreshold: preferences.volumeThreshold,
      });
    }
  }, [preferences]);

  const handleSave = () => {
    updatePreferences.mutate(localSettings);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      Settings
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Alert Settings</DialogTitle>
          <DialogDescription>
            Configure when and how you receive alerts.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sentiment-threshold">Sentiment Alert Threshold</Label>
                <p className="text-sm text-gray-500">
                  Trigger alerts when sentiment score reaches this level
                </p>
                <Select
                  value={Math.round(localSettings.sentimentThreshold * 100).toString()}
                  onValueChange={(value) =>
                    setLocalSettings(prev => ({ ...prev, sentimentThreshold: parseInt(value) / 100 }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50% - Very Low</SelectItem>
                    <SelectItem value="60">60% - Low</SelectItem>
                    <SelectItem value="70">70% - Medium</SelectItem>
                    <SelectItem value="80">80% - High</SelectItem>
                    <SelectItem value="90">90% - Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price-threshold">Price Change Threshold</Label>
                <p className="text-sm text-gray-500">
                  Alert on price changes above this percentage
                </p>
                <Select
                  value={Math.round(localSettings.priceChangeThreshold * 100).toString()}
                  onValueChange={(value) =>
                    setLocalSettings(prev => ({ ...prev, priceChangeThreshold: parseInt(value) / 100 }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5% - Very Sensitive</SelectItem>
                    <SelectItem value="10">10% - Sensitive</SelectItem>
                    <SelectItem value="15">15% - Moderate</SelectItem>
                    <SelectItem value="20">20% - Conservative</SelectItem>
                    <SelectItem value="30">30% - Very Conservative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume-threshold">Volume Change Threshold</Label>
                <p className="text-sm text-gray-500">
                  Alert on volume changes above this percentage
                </p>
                <Select
                  value={Math.round(localSettings.volumeThreshold * 100).toString()}
                  onValueChange={(value) =>
                    setLocalSettings(prev => ({ ...prev, volumeThreshold: parseInt(value) / 100 }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25% - Very Sensitive</SelectItem>
                    <SelectItem value="50">50% - Sensitive</SelectItem>
                    <SelectItem value="75">75% - Moderate</SelectItem>
                    <SelectItem value="100">100% - Conservative</SelectItem>
                    <SelectItem value="150">150% - Very Conservative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updatePreferences.isPending}
          >
            {updatePreferences.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}