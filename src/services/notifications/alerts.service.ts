import { prisma as db } from '@/lib/db/prisma';
import { AlertType, SentimentLabel } from '@prisma/client';
import { NotificationService } from './notification.service';

export interface AlertCondition {
  // Sentiment alert conditions
  sentimentThreshold?: number;
  direction?: 'bullish' | 'bearish' | 'above' | 'below';
  
  // Price alert conditions
  priceThreshold?: number;
  percentage?: boolean;
  
  // Volume alert conditions
  volumeThreshold?: number;
  
  // General settings
  notificationMethods?: string[];
  cooldownMinutes?: number;
}

export interface CreateAlertData {
  userId: string;
  cryptoId: string;
  type: AlertType;
  condition: AlertCondition;
}

export interface UpdateAlertData {
  condition?: AlertCondition;
  isActive?: boolean;
}

export interface SentimentData {
  cryptoId: string;
  score: number;
  label: SentimentLabel;
  confidence: number;
}

export interface PriceData {
  cryptoId: string;
  price: number;
  change24h: number;
  volume24h?: number;
}

export class AlertService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new alert for a user
   */
  async createAlert(data: CreateAlertData) {
    try {
      // Validate the alert condition
      this.validateAlertCondition(data.type, data.condition);

      const alert = await db.alert.create({
        data: {
          userId: data.userId,
          cryptoId: data.cryptoId,
          type: data.type,
          condition: JSON.stringify(data.condition),
          isActive: true,
        },
        include: {
          crypto: true,
          user: true,
        },
      });

      return alert;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create alert: ${message}`);
    }
  }

  /**
   * Get all alerts for a user
   */
  async getUserAlerts(userId: string, activeOnly: boolean = false) {
    const whereClause: any = { userId };
    if (activeOnly) {
      whereClause.isActive = true;
    }

    return await db.alert.findMany({
      where: whereClause,
      include: {
        crypto: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update an existing alert
   */
  async updateAlert(alertId: string, data: UpdateAlertData) {
    try {
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      if (data.condition !== undefined) {
        updateData.condition = JSON.stringify(data.condition);
      }

      const alert = await db.alert.update({
        where: { id: alertId },
        data: updateData,
        include: {
          crypto: true,
          user: true,
        },
      });

      return alert;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update alert: ${message}`);
    }
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: string) {
    try {
      await db.alert.delete({
        where: { id: alertId },
      });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete alert: ${message}`);
    }
  }

  /**
   * Check alerts for a specific cryptocurrency and trigger if conditions are met
   */
  async checkAlerts(cryptoId: string, data: SentimentData | PriceData) {
    try {
      // Get all active alerts for this cryptocurrency
      const activeAlerts = await db.alert.findMany({
        where: {
          cryptoId,
          isActive: true,
        },
        include: {
          crypto: true,
          user: true,
        },
      });

      for (const alert of activeAlerts) {
        const condition: AlertCondition = JSON.parse(alert.condition);
        
        // Check if alert should trigger based on type and condition
        let shouldTrigger = false;

        if (alert.type === AlertType.SENTIMENT_CHANGE && 'score' in data) {
          shouldTrigger = this.checkSentimentCondition(condition, data as SentimentData);
        } else if (alert.type === AlertType.PRICE_CHANGE && 'price' in data) {
          shouldTrigger = this.checkPriceCondition(condition, data as PriceData);
        } else if (alert.type === AlertType.VOLUME_SPIKE && 'volume24h' in data) {
          shouldTrigger = this.checkVolumeCondition(condition, data as PriceData);
        }

        if (shouldTrigger) {
          await this.triggerAlert(alert, data);
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to check alerts: ${message}`);
    }
  }

  /**
   * Check if sentiment conditions are met
   */
  private checkSentimentCondition(condition: AlertCondition, data: SentimentData): boolean {
    const { sentimentThreshold = 0.5, direction } = condition;

    if (direction === 'bullish') {
      return data.score >= sentimentThreshold && 
             (data.label === SentimentLabel.BULLISH || data.label === SentimentLabel.VERY_BULLISH);
    } else if (direction === 'bearish') {
      return data.score <= -sentimentThreshold && 
             (data.label === SentimentLabel.BEARISH || data.label === SentimentLabel.VERY_BEARISH);
    }

    // Default: check if absolute score exceeds threshold
    return Math.abs(data.score) >= sentimentThreshold;
  }

  /**
   * Check if price conditions are met
   */
  private checkPriceCondition(condition: AlertCondition, data: PriceData): boolean {
    const { priceThreshold, direction, percentage = false } = condition;

    if (!priceThreshold) return false;

    if (percentage) {
      // Check percentage change
      const changePercent = Math.abs(data.change24h);
      return changePercent >= priceThreshold;
    } else {
      // Check absolute price
      if (direction === 'above') {
        return data.price >= priceThreshold;
      } else if (direction === 'below') {
        return data.price <= priceThreshold;
      }
    }

    return false;
  }

  /**
   * Check if volume conditions are met
   */
  private checkVolumeCondition(condition: AlertCondition, data: PriceData): boolean {
    const { volumeThreshold } = condition;
    
    if (!volumeThreshold || !data.volume24h) return false;

    // Check if volume is above threshold (could be enhanced with historical comparison)
    return data.volume24h >= volumeThreshold;
  }

  /**
   * Trigger an alert by sending notifications and updating the alert record
   */
  private async triggerAlert(alert: any, data: SentimentData | PriceData) {
    try {
      // Update alert trigger information
      await db.alert.update({
        where: { id: alert.id },
        data: {
          lastTriggered: new Date(),
          triggerCount: alert.triggerCount + 1,
        },
      });

      // Create notification content
      const notificationContent = this.createNotificationContent(alert, data);

      // Send notification
      await this.notificationService.sendNotification({
        userId: alert.userId,
        type: 'ALERT_TRIGGERED',
        title: notificationContent.title,
        content: notificationContent.message,
        alertId: alert.id,
      });

      console.log(`Alert triggered for user ${alert.userId}: ${notificationContent.title}`);
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  /**
   * Create notification content based on alert type and data
   */
  private createNotificationContent(alert: any, data: SentimentData | PriceData) {
    const cryptoName = alert.crypto?.name || alert.cryptoId;
    
    if (alert.type === AlertType.SENTIMENT_CHANGE && 'score' in data) {
      const sentimentData = data as SentimentData;
      return {
        title: `${cryptoName} Sentiment Alert`,
        message: `${cryptoName} sentiment is now ${sentimentData.label} with a confidence of ${(sentimentData.confidence * 100).toFixed(1)}% and score of ${sentimentData.score.toFixed(2)}.`,
      };
    } else if (alert.type === AlertType.PRICE_CHANGE && 'price' in data) {
      const priceData = data as PriceData;
      return {
        title: `${cryptoName} Price Alert`,
        message: `${cryptoName} price is now $${priceData.price.toLocaleString()} with a 24h change of ${priceData.change24h.toFixed(2)}%.`,
      };
    } else if (alert.type === AlertType.VOLUME_SPIKE && 'volume24h' in data) {
      const volumeData = data as PriceData;
      return {
        title: `${cryptoName} Volume Alert`,
        message: `${cryptoName} has unusual volume activity: $${volumeData.volume24h?.toLocaleString()} in 24h trading volume.`,
      };
    }

    return {
      title: `${cryptoName} Alert`,
      message: `Alert triggered for ${cryptoName}`,
    };
  }

  /**
   * Validate alert condition based on type
   */
  validateAlertCondition(type: AlertType, condition: AlertCondition) {
    switch (type) {
      case AlertType.SENTIMENT_CHANGE:
        if (condition.sentimentThreshold !== undefined) {
          if (condition.sentimentThreshold < -1 || condition.sentimentThreshold > 1) {
            throw new Error('Invalid sentiment threshold: must be between -1 and 1');
          }
        }
        if (condition.direction && !['bullish', 'bearish'].includes(condition.direction)) {
          throw new Error('Invalid direction: must be "bullish" or "bearish"');
        }
        break;

      case AlertType.PRICE_CHANGE:
        if (condition.priceThreshold !== undefined && condition.priceThreshold <= 0) {
          throw new Error('Invalid price threshold: must be positive');
        }
        if (condition.direction && !['above', 'below'].includes(condition.direction)) {
          throw new Error('Invalid direction: must be "above" or "below"');
        }
        break;

      case AlertType.VOLUME_SPIKE:
        if (condition.volumeThreshold !== undefined && condition.volumeThreshold <= 0) {
          throw new Error('Invalid volume threshold: must be positive');
        }
        break;

      default:
        throw new Error(`Unsupported alert type: ${type}`);
    }
  }
}