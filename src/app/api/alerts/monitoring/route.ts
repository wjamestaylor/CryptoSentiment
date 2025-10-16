import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { alertMonitor } from '@/services/monitoring/alert-monitor.service';
import { AlertService } from '@/services/notifications/alerts.service';
import { prisma } from '@/lib/db/prisma';

const alertService = new AlertService();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get monitoring status
    const status = alertMonitor.getStatus();
    
    // Get user's alert statistics
    const userAlerts = await alertService.getUserAlerts(session.user.id);
    const activeAlerts = userAlerts.filter(alert => alert.isActive);
    const totalTriggers = userAlerts.reduce((sum, alert) => sum + alert.triggerCount, 0);

    return NextResponse.json({
      success: true,
      monitoring: status,
      userStats: {
        totalAlerts: userAlerts.length,
        activeAlerts: activeAlerts.length,
        totalTriggers,
        lastTrigger: Math.max(
          ...userAlerts
            .filter(alert => alert.lastTriggered)
            .map(alert => alert.lastTriggered ? new Date(alert.lastTriggered).getTime() : 0)
        ) || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting alert monitoring status:', error);
    return NextResponse.json(
      { error: 'Failed to get monitoring status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, cryptoSymbol, ...params } = body;

    switch (action) {
      case 'start':
        await alertMonitor.start();
        return NextResponse.json({
          success: true,
          message: 'Alert monitoring started',
          status: alertMonitor.getStatus(),
        });

      case 'stop':
        alertMonitor.stop();
        return NextResponse.json({
          success: true,
          message: 'Alert monitoring stopped',
          status: alertMonitor.getStatus(),
        });

      case 'force-check':
        if (!cryptoSymbol) {
          return NextResponse.json(
            { error: 'Cryptocurrency symbol is required for force check' },
            { status: 400 }
          );
        }
        
        const result = await alertMonitor.forceCheck(cryptoSymbol);
        return NextResponse.json({
          success: result.success,
          message: result.message,
          timestamp: new Date().toISOString(),
        });

      case 'add-monitoring':
        if (!cryptoSymbol) {
          return NextResponse.json(
            { error: 'Cryptocurrency symbol is required' },
            { status: 400 }
          );
        }
        
        // Add crypto to monitoring
        await alertMonitor.addToMonitoring(
          params.cryptoId || cryptoSymbol,
          cryptoSymbol,
          params.coinGeckoId
        );
        
        return NextResponse.json({
          success: true,
          message: `Added ${cryptoSymbol} to monitoring`,
          status: alertMonitor.getStatus(),
        });

      case 'remove-monitoring':
        if (!cryptoSymbol) {
          return NextResponse.json(
            { error: 'Cryptocurrency symbol is required' },
            { status: 400 }
          );
        }
        
        alertMonitor.removeFromMonitoring(params.cryptoId || cryptoSymbol);
        
        return NextResponse.json({
          success: true,
          message: `Removed ${cryptoSymbol} from monitoring`,
          status: alertMonitor.getStatus(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in alert monitoring API:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Alert monitoring failed: ${message}` },
      { status: 500 }
    );
  }
}