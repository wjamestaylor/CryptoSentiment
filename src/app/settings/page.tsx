"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";
import { NotificationPreferences } from "@/components/profile/NotificationPreferences";
import { AlertSettings } from "@/components/profile/AlertSettings";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function SettingsPage() {
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
    <div className="container mx-auto py-6 px-4 sm:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
      </div>

      {/* User Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-base sm:text-lg break-words">{session.user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-base sm:text-lg">{session.user?.name || 'Not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status with Usage Details */}
      <SubscriptionStatus />

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-medium">Theme</h4>
                <p className="text-sm text-gray-500">
                  Choose your preferred color theme
                </p>
              </div>
              <ThemeToggle />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-500">
                  Receive email alerts for price changes and sentiment updates
                </p>
              </div>
              <NotificationPreferences />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-medium">Alert Frequency</h4>
                <p className="text-sm text-gray-500">
                  How often you want to receive notifications
                </p>
              </div>
              <AlertSettings />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="default"
          className="w-full sm:w-auto"
        >
          Back to Dashboard
        </Button>
        <Button
          onClick={() => router.push('/watchlist')}
          variant="outline"
          className="w-full sm:w-auto"
        >
          View Watchlist
        </Button>
      </div>
    </div>
  );
}
