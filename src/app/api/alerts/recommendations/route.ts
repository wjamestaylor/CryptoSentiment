import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { alertTemplateService } from '@/services/alerts/alert-template.service';
import { AlertService } from '@/services/notifications/alerts.service';

const alertService = new AlertService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's existing alerts
    const userAlerts = await alertService.getUserAlerts(session.user.id);

    // Get personalized recommendations
    const recommendations = alertTemplateService.getRecommendedTemplates(userAlerts);

    // Get user statistics
    const stats = {
      totalAlerts: userAlerts.length,
      activeAlerts: userAlerts.filter(alert => alert.isActive).length,
      alertsByType: {
        sentiment: userAlerts.filter(alert => alert.type === 'SENTIMENT_CHANGE').length,
        price: userAlerts.filter(alert => alert.type === 'PRICE_CHANGE').length,
        volume: userAlerts.filter(alert => alert.type === 'VOLUME_SPIKE').length,
      },
      totalTriggers: userAlerts.reduce((sum, alert) => sum + alert.triggerCount, 0),
    };

    // Generate insights based on user's alert patterns
    const insights = generateUserInsights(userAlerts, stats);

    return NextResponse.json({
      success: true,
      recommendations,
      userStats: stats,
      insights,
      recommendationReason: getRecommendationReason(userAlerts),
    });
  } catch (error) {
    console.error('Error getting alert recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

function generateUserInsights(userAlerts: any[], stats: any) {
  const insights = [];

  // Check if user has no alerts
  if (userAlerts.length === 0) {
    insights.push({
      type: 'getting_started',
      title: 'Get Started with Alerts',
      message: 'Set up your first alert to stay informed about market movements!',
      actionable: true,
      priority: 'high',
    });
    return insights;
  }

  // Check alert diversity
  const alertTypes = Object.values(stats.alertsByType);
  const nonZeroTypes = alertTypes.filter((count: any) => count > 0).length;
  
  if (nonZeroTypes === 1) {
    insights.push({
      type: 'diversification',
      title: 'Diversify Your Alert Types',
      message: 'Consider adding different types of alerts for a more comprehensive monitoring strategy.',
      actionable: true,
      priority: 'medium',
    });
  }

  // Check for inactive alerts
  const inactiveAlerts = userAlerts.filter(alert => !alert.isActive);
  if (inactiveAlerts.length > 0) {
    insights.push({
      type: 'inactive_alerts',
      title: 'Inactive Alerts Detected',
      message: `You have ${inactiveAlerts.length} inactive alert${inactiveAlerts.length > 1 ? 's' : ''}. Consider reactivating or removing them.`,
      actionable: true,
      priority: 'low',
    });
  }

  // Check trigger frequency
  const highTriggerAlerts = userAlerts.filter(alert => alert.triggerCount > 10);
  if (highTriggerAlerts.length > 0) {
    insights.push({
      type: 'high_frequency',
      title: 'High-Frequency Alerts',
      message: `${highTriggerAlerts.length} of your alerts trigger frequently. Consider adjusting thresholds to reduce noise.`,
      actionable: true,
      priority: 'medium',
    });
  }

  // Check for alerts with no triggers
  const neverTriggeredAlerts = userAlerts.filter(alert => alert.triggerCount === 0);
  if (neverTriggeredAlerts.length > 0) {
    insights.push({
      type: 'never_triggered',
      title: 'Some Alerts Never Triggered',
      message: `${neverTriggeredAlerts.length} alert${neverTriggeredAlerts.length > 1 ? 's' : ''} haven't triggered yet. Consider adjusting sensitivity.`,
      actionable: true,
      priority: 'low',
    });
  }

  // Performance insight
  if (stats.totalTriggers > 50) {
    insights.push({
      type: 'active_user',
      title: 'Active Alert User',
      message: `Your alerts have triggered ${stats.totalTriggers} times! You're staying well-informed about market movements.`,
      actionable: false,
      priority: 'info',
    });
  }

  return insights;
}

function getRecommendationReason(userAlerts: any[]) {
  if (userAlerts.length === 0) {
    return 'These popular templates are perfect for getting started with cryptocurrency alerts.';
  }

  const sentimentAlerts = userAlerts.filter(alert => alert.type === 'SENTIMENT_CHANGE').length;
  const priceAlerts = userAlerts.filter(alert => alert.type === 'PRICE_CHANGE').length;
  const volumeAlerts = userAlerts.filter(alert => alert.type === 'VOLUME_SPIKE').length;

  if (sentimentAlerts === 0) {
    return 'Consider adding sentiment alerts to track market mood and investor psychology.';
  }
  
  if (priceAlerts === 0) {
    return 'Price alerts can help you catch important market movements and trading opportunities.';
  }
  
  if (volumeAlerts === 0) {
    return 'Volume alerts help detect unusual trading activity and potential breakouts.';
  }

  return 'Based on your current alerts, these templates could enhance your monitoring strategy.';
}