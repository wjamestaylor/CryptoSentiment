"use client";

import { api } from '@/lib/trpc/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  Target,
  BarChart3,
  Clock,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, description, icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelVisualization({ data }: { data: Array<{ step: string; count: number; percentage: number }> }) {
  if (!data || data.length === 0) {
    return <div className="text-muted-foreground">No data available</div>;
  }

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.step} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{item.step}</span>
            <span className="text-muted-foreground">
              {item.count} ({item.percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="relative h-8 bg-muted rounded-md overflow-hidden">
            <div
              className="absolute h-full bg-primary transition-all duration-300"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            >
              <div className="h-full flex items-center justify-center text-xs text-primary-foreground font-medium">
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RetentionChart({ data }: { data: Array<{ days: number; retainedCount: number; totalCount: number; retentionRate: number }> }) {
  if (!data || data.length === 0) {
    return <div className="text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.days} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Day {item.days}</span>
            <span className="text-muted-foreground">
              {item.retainedCount} / {item.totalCount} ({item.retentionRate.toFixed(1)}%)
            </span>
          </div>
          <div className="relative h-6 bg-muted rounded-md overflow-hidden">
            <div
              className="absolute h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${item.retentionRate}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeatureUsageTable({ data }: { data: Array<{ feature: string; count: number }> }) {
  if (!data || data.length === 0) {
    return <div className="text-muted-foreground">No data available</div>;
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="border rounded-md">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 text-sm font-medium">Feature</th>
            <th className="text-right p-3 text-sm font-medium">Usage Count</th>
            <th className="text-right p-3 text-sm font-medium">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.feature} className="border-t">
              <td className="p-3 text-sm">{item.feature.replace(/_/g, ' ')}</td>
              <td className="p-3 text-sm text-right">{item.count.toLocaleString()}</td>
              <td className="p-3 text-sm text-right">
                {((item.count / total) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboard() {
  const [timeframe, setTimeframe] = useState<number>(30);
  
  const overviewQuery = api.admin.getOverviewStats.useQuery();
  const funnelQuery = api.admin.getUserActivationFunnel.useQuery({ days: timeframe });
  const conversionQuery = api.admin.getConversionRates.useQuery({ days: timeframe });
  const retentionQuery = api.admin.getRetentionMetrics.useQuery({ cohortDays: timeframe });
  const featureUsageQuery = api.admin.getFeatureUsage.useQuery({ days: timeframe });
  // Note: getUserGrowth endpoint available for future growth charts
  // const growthQuery = api.admin.getUserGrowth.useQuery({ days: timeframe });

  const isLoading = overviewQuery.isLoading;
  const error = overviewQuery.error;

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error loading admin dashboard: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overviewData = overviewQuery.data?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Platform-wide metrics and insights for data-driven optimization
          </p>
        </div>
        <Select value={timeframe.toString()} onValueChange={(v) => setTimeframe(Number(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Metrics */}
      {isLoading ? (
        <div className="text-muted-foreground">Loading metrics...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Users"
              value={overviewData?.totalUsers?.toLocaleString() || 0}
              description="All registered users"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Active Users (30d)"
              value={overviewData?.activeUsers?.toLocaleString() || 0}
              description="Users with recent activity"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Active Subscriptions"
              value={overviewData?.totalSubscriptions?.toLocaleString() || 0}
              description="Paid subscription count"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Total Alerts"
              value={overviewData?.totalAlerts?.toLocaleString() || 0}
              description="Active alert configurations"
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          {/* Subscription Breakdown */}
          {overviewData?.subscriptionBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Subscription Breakdown</CardTitle>
                <CardDescription>Active subscriptions by tier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Free</p>
                    <p className="text-2xl font-bold">
                      {overviewData.subscriptionBreakdown.FREE || 0}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pro</p>
                    <p className="text-2xl font-bold">
                      {overviewData.subscriptionBreakdown.PRO || 0}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Business</p>
                    <p className="text-2xl font-bold">
                      {overviewData.subscriptionBreakdown.BUSINESS || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Analytics Tabs */}
          <Tabs defaultValue="funnel" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="funnel">Activation Funnel</TabsTrigger>
              <TabsTrigger value="conversion">Conversion</TabsTrigger>
              <TabsTrigger value="retention">Retention</TabsTrigger>
              <TabsTrigger value="features">Feature Usage</TabsTrigger>
            </TabsList>

            <TabsContent value="funnel" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    User Activation Funnel
                  </CardTitle>
                  <CardDescription>
                    Track user progression through key activation steps (last {timeframe} days)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {funnelQuery.isLoading ? (
                    <div className="text-muted-foreground">Loading funnel data...</div>
                  ) : funnelQuery.data?.data?.funnel ? (
                    <FunnelVisualization data={funnelQuery.data.data.funnel} />
                  ) : (
                    <div className="text-muted-foreground">No funnel data available</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversion" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Conversion Metrics
                  </CardTitle>
                  <CardDescription>
                    Free to paid conversion rates (last {timeframe} days)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {conversionQuery.isLoading ? (
                    <div className="text-muted-foreground">Loading conversion data...</div>
                  ) : conversionQuery.data?.data ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Total Users</p>
                          <p className="text-2xl font-bold">
                            {conversionQuery.data.data.totalUsers}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Paid Users</p>
                          <p className="text-2xl font-bold">
                            {conversionQuery.data.data.paidUsers}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Conversion Rate</p>
                          <p className="text-2xl font-bold">
                            {conversionQuery.data.data.conversionRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      {conversionQuery.data.data.tierBreakdown && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-3">Tier Distribution</h4>
                          <div className="space-y-3">
                            {conversionQuery.data.data.tierBreakdown.map((tier: { tier: string; count: number; percentage: number }) => (
                              <div key={tier.tier} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{tier.tier}</span>
                                  <span>{tier.count} ({tier.percentage.toFixed(1)}%)</span>
                                </div>
                                <div className="relative h-4 bg-muted rounded-md overflow-hidden">
                                  <div
                                    className="absolute h-full bg-primary"
                                    style={{ width: `${tier.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No conversion data available</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="retention" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Retention Analysis
                  </CardTitle>
                  <CardDescription>
                    User retention rates over time (cohort from last {timeframe} days)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {retentionQuery.isLoading ? (
                    <div className="text-muted-foreground">Loading retention data...</div>
                  ) : retentionQuery.data?.data ? (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Cohort size: {retentionQuery.data.data.cohortSize} users
                      </div>
                      <RetentionChart data={retentionQuery.data.data.retentionData} />
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No retention data available</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Feature Usage Analytics
                  </CardTitle>
                  <CardDescription>
                    Most used features and engagement patterns (last {timeframe} days)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {featureUsageQuery.isLoading ? (
                    <div className="text-muted-foreground">Loading feature usage data...</div>
                  ) : featureUsageQuery.data?.data?.usageByType ? (
                    <FeatureUsageTable data={featureUsageQuery.data.data.usageByType} />
                  ) : (
                    <div className="text-muted-foreground">No feature usage data available</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
