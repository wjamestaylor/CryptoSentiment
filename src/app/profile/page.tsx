"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BotConnection } from "@/components/profile/BotConnection";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div className="container mx-auto py-10">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Free Tier</span>
      </div>

      {/* User Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and subscription information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg">{session.user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg">{session.user?.name || 'Not set'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">Followed Coins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">Active Alerts</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Subscription</p>
              <p className="text-lg">Free</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bot Integration */}
      <BotConnection initialStatus={{
        discord: { connected: false, userId: null, notificationsEnabled: false },
        telegram: { connected: false, userId: null, notificationsEnabled: false }
      }} />

      {/* Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your CryptoSentiment experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-500">
                  Receive email alerts for price changes and sentiment updates
                </p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Alert Frequency</h4>
                <p className="text-sm text-gray-500">
                  How often you want to receive notifications
                </p>
              </div>
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="default"
        >
          Back to Dashboard
        </Button>
        <Button
          onClick={() => router.push('/watchlist')}
          variant="outline"
        >
          View Watchlist
        </Button>
      </div>
    </div>
  );
}
