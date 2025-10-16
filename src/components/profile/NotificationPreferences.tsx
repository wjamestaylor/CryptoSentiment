"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/trpc/provider';
import { toast } from '@/hooks/use-toast';

interface NotificationPreferencesProps {
  trigger?: React.ReactNode;
}

export function NotificationPreferences({ trigger }: NotificationPreferencesProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get current preferences
  const { data: preferences, isLoading } = api.auth.getPreferences.useQuery();

  // Update preferences mutation
  const updatePreferences = api.auth.updatePreferences.useMutation({
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
      setIsOpen(false);
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
    emailNotifications: preferences?.emailNotifications ?? true,
    pushNotifications: preferences?.pushNotifications ?? true,
    discordNotifications: preferences?.discordNotifications ?? false,
    telegramNotifications: preferences?.telegramNotifications ?? false,
  });

  // Update local state when preferences load
  React.useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        discordNotifications: preferences.discordNotifications,
        telegramNotifications: preferences.telegramNotifications,
      });
    }
  }, [preferences]);

  const handleSave = () => {
    updatePreferences.mutate(localPreferences);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
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
          <DialogTitle>Notification Preferences</DialogTitle>
          <DialogDescription>
            Configure how you want to receive alerts and notifications.
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Receive alerts via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={localPreferences.emailNotifications}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Browser push notifications
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={localPreferences.pushNotifications}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="discord-notifications">Discord Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Alerts via Discord bot
                  </p>
                </div>
                <Switch
                  id="discord-notifications"
                  checked={localPreferences.discordNotifications}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, discordNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="telegram-notifications">Telegram Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Alerts via Telegram bot
                  </p>
                </div>
                <Switch
                  id="telegram-notifications"
                  checked={localPreferences.telegramNotifications}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, telegramNotifications: checked }))
                  }
                />
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
            {updatePreferences.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Import React properly
import React from 'react';