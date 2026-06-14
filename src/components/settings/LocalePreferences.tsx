"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/trpc/provider';
import { toast } from '@/hooks/use-toast';

interface LocalePreferencesProps {
  trigger?: React.ReactNode;
}

const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
];

const SUPPORTED_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Rome' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'Mumbai, Kolkata, New Delhi' },
  { value: 'Asia/Shanghai', label: 'Beijing, Shanghai' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Osaka' },
  { value: 'Asia/Seoul', label: 'Seoul' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne' },
  { value: 'Pacific/Auckland', label: 'Auckland' },
];

export function LocalePreferences({ trigger }: LocalePreferencesProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get current preferences
  const { data: preferences, isLoading } = api.auth.getPreferences.useQuery();

  // Update preferences mutation
  const updatePreferences = api.auth.updatePreferences.useMutation({
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Your locale preferences have been saved.",
      });
      setIsOpen(false);
      // Reload to apply new formatting
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update preferences: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const [localPreferences, setLocalPreferences] = useState({
    currency: preferences?.currency ?? 'USD',
    timezone: preferences?.timezone ?? 'UTC',
  });

  // Update local state when preferences load
  React.useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        currency: preferences.currency,
        timezone: preferences.timezone,
      });
    }
  }, [preferences]);

  const handleSave = () => {
    updatePreferences.mutate(localPreferences);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="w-full sm:w-auto">
      Configure
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Locale Preferences</DialogTitle>
          <DialogDescription>
            Set your preferred currency and timezone for displaying data.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={localPreferences.currency}
                onValueChange={(value) =>
                  setLocalPreferences(prev => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                All prices will be displayed in this currency
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={localPreferences.timezone}
                onValueChange={(value) =>
                  setLocalPreferences(prev => ({ ...prev, timezone: value }))
                }
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Timestamps will be displayed in this timezone
              </p>
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
            {updatePreferences.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
