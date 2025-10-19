import { AlertType } from '@prisma/client';

export interface AlertCondition {
  operator?: 'greater_than' | 'less_than' | 'equals' | 'percentage_change';
  value?: number;
  timeframe?: string;
  threshold?: number;
  percentage?: boolean;
  sentimentThreshold?: number;
  volumeThreshold?: number;
  priceThreshold?: number;
  direction?: 'bullish' | 'bearish' | 'above' | 'below';
  cooldownMinutes?: number;
  [key: string]: unknown; // Allow additional properties
}

export interface UserAlert {
  type: AlertType;
  tags?: string[];
  [key: string]: unknown;
}

export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  alertType: AlertType;
  condition: AlertCondition;
  tags: string[];
  isPopular: boolean;
  useCase: string;
}

export interface AlertTemplateCategory {
  name: string;
  description: string;
  templates: AlertTemplate[];
}

/**
 * Predefined Alert Templates Service
 * Provides common alert configurations for users
 */
export class AlertTemplateService {
  private templates: AlertTemplate[] = [
    // Price Alert Templates
    {
      id: 'btc-major-dip',
      name: 'Bitcoin Major Dip Alert',
      description: 'Alert when Bitcoin drops by 10% or more',
      alertType: AlertType.PRICE_CHANGE,
      condition: {
        percentage: true,
        priceThreshold: 10,
        direction: 'below',
        cooldownMinutes: 60,
      },
      tags: ['bitcoin', 'price', 'dip', 'buying-opportunity'],
      isPopular: true,
      useCase: 'Great for identifying potential buying opportunities during market corrections',
    },
    {
      id: 'alt-pump-alert',
      name: 'Altcoin Pump Alert',
      description: 'Alert when altcoins surge by 20% or more',
      alertType: AlertType.PRICE_CHANGE,
      condition: {
        percentage: true,
        priceThreshold: 20,
        direction: 'above',
        cooldownMinutes: 30,
      },
      tags: ['altcoin', 'pump', 'profit-taking'],
      isPopular: true,
      useCase: 'Perfect for catching breakout moments and profit-taking opportunities',
    },
    {
      id: 'conservative-price',
      name: 'Conservative Price Movement',
      description: 'Alert on modest 5% price changes',
      alertType: AlertType.PRICE_CHANGE,
      condition: {
        percentage: true,
        priceThreshold: 5,
        cooldownMinutes: 120,
      },
      tags: ['conservative', 'price', 'general'],
      isPopular: false,
      useCase: 'Ideal for conservative investors who want to track moderate price movements',
    },

    // Sentiment Alert Templates
    {
      id: 'strong-bullish',
      name: 'Strong Bullish Sentiment',
      description: 'Alert when sentiment becomes very bullish',
      alertType: AlertType.SENTIMENT_CHANGE,
      condition: {
        sentimentThreshold: 0.7,
        direction: 'bullish',
        cooldownMinutes: 180,
      },
      tags: ['sentiment', 'bullish', 'optimism'],
      isPopular: true,
      useCase: 'Catch waves of market optimism before they peak',
    },
    {
      id: 'bearish-warning',
      name: 'Bearish Sentiment Warning',
      description: 'Alert when sentiment turns bearish',
      alertType: AlertType.SENTIMENT_CHANGE,
      condition: {
        sentimentThreshold: -0.5,
        direction: 'bearish',
        cooldownMinutes: 240,
      },
      tags: ['sentiment', 'bearish', 'warning', 'risk'],
      isPopular: true,
      useCase: 'Early warning system for potential market downturns',
    },
    {
      id: 'sentiment-reversal',
      name: 'Sentiment Reversal Alert',
      description: 'Alert on any strong sentiment change',
      alertType: AlertType.SENTIMENT_CHANGE,
      condition: {
        sentimentThreshold: 0.6,
        cooldownMinutes: 90,
      },
      tags: ['sentiment', 'reversal', 'momentum'],
      isPopular: false,
      useCase: 'Track momentum shifts and sentiment reversals',
    },

    // Volume Alert Templates
    {
      id: 'volume-breakout',
      name: 'Volume Breakout Alert',
      description: 'Alert on unusual volume spikes (10x normal)',
      alertType: AlertType.VOLUME_SPIKE,
      condition: {
        volumeThreshold: 1000000000, // $1B volume
        cooldownMinutes: 60,
      },
      tags: ['volume', 'breakout', 'whale-activity'],
      isPopular: true,
      useCase: 'Detect potential breakouts and whale movements',
    },
    {
      id: 'institutional-volume',
      name: 'Institutional Volume Alert',
      description: 'Alert on massive volume indicating institutional activity',
      alertType: AlertType.VOLUME_SPIKE,
      condition: {
        volumeThreshold: 5000000000, // $5B volume
        cooldownMinutes: 120,
      },
      tags: ['volume', 'institutional', 'whale', 'major-movement'],
      isPopular: false,
      useCase: 'Monitor institutional trading and major market movements',
    },

    // Specialized Templates
    {
      id: 'dca-helper',
      name: 'DCA Helper Alert',
      description: 'Weekly DCA reminder with sentiment check',
      alertType: AlertType.SENTIMENT_CHANGE,
      condition: {
        sentimentThreshold: 0.3,
        direction: 'bullish',
        cooldownMinutes: 10080, // 1 week
      },
      tags: ['dca', 'investment', 'strategy', 'weekly'],
      isPopular: true,
      useCase: 'Perfect for dollar-cost averaging strategies with sentiment timing',
    },
    {
      id: 'scalping-assistant',
      name: 'Scalping Assistant',
      description: 'Quick 2% price movements for day trading',
      alertType: AlertType.PRICE_CHANGE,
      condition: {
        percentage: true,
        priceThreshold: 2,
        cooldownMinutes: 15,
      },
      tags: ['scalping', 'day-trading', 'quick-moves'],
      isPopular: false,
      useCase: 'High-frequency alerts for active day traders and scalpers',
    },
  ];

  /**
   * Get all available templates
   */
  getAllTemplates(): AlertTemplate[] {
    return this.templates;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(): AlertTemplateCategory[] {
    return [
      {
        name: 'Price Alerts',
        description: 'Monitor significant price movements and trading opportunities',
        templates: this.templates.filter(t => t.alertType === AlertType.PRICE_CHANGE),
      },
      {
        name: 'Sentiment Alerts',
        description: 'Track market sentiment changes and investor mood shifts',
        templates: this.templates.filter(t => t.alertType === AlertType.SENTIMENT_CHANGE),
      },
      {
        name: 'Volume Alerts',
        description: 'Detect unusual trading volume and potential breakouts',
        templates: this.templates.filter(t => t.alertType === AlertType.VOLUME_SPIKE),
      },
    ];
  }

  /**
   * Get popular templates
   */
  getPopularTemplates(): AlertTemplate[] {
    return this.templates.filter(t => t.isPopular);
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): AlertTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  /**
   * Search templates by tags or name
   */
  searchTemplates(query: string): AlertTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return this.templates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      template.useCase.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get templates for specific use cases
   */
  getTemplatesByUseCase(useCase: 'conservative' | 'aggressive' | 'day-trading' | 'long-term'): AlertTemplate[] {
    const useCaseMap = {
      'conservative': ['conservative', 'dca', 'long-term'],
      'aggressive': ['pump', 'scalping', 'quick-moves'],
      'day-trading': ['scalping', 'day-trading', 'quick-moves', 'breakout'],
      'long-term': ['dca', 'major-movement', 'conservative', 'institutional'],
    };

    const relevantTags = useCaseMap[useCase] || [];
    
    return this.templates.filter(template =>
      template.tags.some(tag => relevantTags.includes(tag))
    );
  }

  /**
   * Create alert from template
   */
  createAlertFromTemplate(templateId: string, cryptoSymbol: string, cryptoName?: string) {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return {
      cryptoSymbol: cryptoSymbol.toLowerCase(),
      cryptoName: cryptoName || cryptoSymbol.toUpperCase(),
      type: template.alertType,
      condition: { ...template.condition },
      templateId: templateId,
      templateName: template.name,
    };
  }

  /**
   * Get recommended templates for a user based on their existing alerts
   */
  getRecommendedTemplates(userAlerts: UserAlert[]): AlertTemplate[] {
    // Simple recommendation algorithm
    const userAlertTypes = new Set(userAlerts.map(alert => alert.type));
    const userTags = new Set();
    
    // Extract tags from user's existing alerts (if we had this data)
    // For now, recommend popular templates they don't have
    
    return this.templates.filter(template => {
      if (!template.isPopular) return false;
      // Don't recommend if user already has many alerts of this type
      const typeCount = userAlerts.filter(alert => alert.type === template.alertType).length;
      return typeCount < 3; // Max 3 alerts per type recommended
    }).slice(0, 5); // Top 5 recommendations
  }
}

// Singleton instance
export const alertTemplateService = new AlertTemplateService();