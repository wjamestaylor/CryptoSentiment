import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { alertTemplateService } from '@/services/alerts/alert-template.service';
import { AlertService } from '@/services/notifications/alerts.service';
import { FeatureGateService } from '@/services/feature-gating/feature-gate.service';
import { UsageType } from '@prisma/client';

const alertService = new AlertService();
const featureGateService = new FeatureGateService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const useCase = searchParams.get('useCase') as 'conservative' | 'aggressive' | 'day-trading' | 'long-term' | null;
    const search = searchParams.get('search');
    const popular = searchParams.get('popular') === 'true';

    let templates;

    if (search) {
      templates = alertTemplateService.searchTemplates(search);
    } else if (popular) {
      templates = alertTemplateService.getPopularTemplates();
    } else if (useCase) {
      templates = alertTemplateService.getTemplatesByUseCase(useCase);
    } else if (category) {
      const categories = alertTemplateService.getTemplatesByCategory();
      const foundCategory = categories.find(c => c.name.toLowerCase() === category.toLowerCase());
      templates = foundCategory ? foundCategory.templates : [];
    } else {
      // Get organized by category
      const categories = alertTemplateService.getTemplatesByCategory();
      return NextResponse.json({
        success: true,
        categories,
        totalTemplates: alertTemplateService.getAllTemplates().length,
      });
    }

    return NextResponse.json({
      success: true,
      templates,
      totalCount: templates.length,
    });
  } catch (error) {
    console.error('Error fetching alert templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert templates' },
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
    const { templateId, cryptoSymbol, cryptoName, customization } = body;

    if (!templateId || !cryptoSymbol) {
      return NextResponse.json(
        { error: 'Template ID and cryptocurrency symbol are required' },
        { status: 400 }
      );
    }

    // Check if user can create more alerts
    const usageCheck = await featureGateService.canCreateAlert(session.user.id);
    
    if (!usageCheck.allowed) {
      return NextResponse.json({
        error: `Alert limit reached (${usageCheck.currentUsage}/${usageCheck.limit}). Upgrade your subscription to create more alerts.`,
        code: 'ALERT_LIMIT_REACHED',
        currentUsage: usageCheck.currentUsage,
        limit: usageCheck.limit,
      }, { status: 403 });
    }

    // Get the template
    const template = alertTemplateService.getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: `Template not found: ${templateId}` },
        { status: 404 }
      );
    }

    // Create alert data from template
    const alertData = alertTemplateService.createAlertFromTemplate(
      templateId, 
      cryptoSymbol, 
      cryptoName
    );

    // Apply any customizations
    if (customization) {
      alertData.condition = { ...alertData.condition, ...customization };
    }

    // Create the alert
    const alert = await alertService.createAlertWithSymbol({
      userId: session.user.id,
      cryptoSymbol: alertData.cryptoSymbol,
      cryptoName: alertData.cryptoName,
      type: alertData.type,
      condition: alertData.condition,
    });

    // Track usage
    await featureGateService.trackUsage(session.user.id, UsageType.ALERT_CREATION, {
      cryptoSymbol: alertData.cryptoSymbol,
      alertType: alertData.type,
      templateId,
      templateName: template.name,
    });

    return NextResponse.json({
      success: true,
      alert: {
        id: alert.id,
        cryptoSymbol: alertData.cryptoSymbol,
        cryptoName: alertData.cryptoName,
        type: alertData.type,
        condition: alertData.condition,
        templateUsed: {
          id: templateId,
          name: template.name,
        },
      },
      message: `Alert created from template: ${template.name}`,
    });
  } catch (error) {
    console.error('Error creating alert from template:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create alert from template: ${message}` },
      { status: 500 }
    );
  }
}