import {
  SubscriptionTier,
  SentimentLabel,
  AlertType,
  NotificationType,
  SubscriptionStatus,
  type User,
  type Cryptocurrency,
  type SentimentAnalysis,
  type Alert,
  type Notification,
} from '@/types';

describe('Type Definitions', () => {
  describe('User Interface', () => {
    it('should have correct structure', () => {
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      };

      expect(user.id).toBe('user123');
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.name).toBe('Test User');
      expect(user.image).toBe('https://example.com/avatar.jpg');
    });

    it('should handle optional fields', () => {
      const minimalUser: User = {
        id: 'user123',
        email: 'test@example.com',
      };

      expect(minimalUser.id).toBe('user123');
      expect(minimalUser.email).toBe('test@example.com');
      expect(minimalUser.username).toBeUndefined();
    });
  });

  describe('Cryptocurrency Interface', () => {
    it('should have correct structure', () => {
      const crypto: Cryptocurrency = {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        logoUrl: 'https://example.com/btc.png',
        marketCap: 1000000000,
        rank: 1,
        currentPrice: 50000,
        priceChange24h: 1000,
        volume24h: 30000000,
      };

      expect(crypto.id).toBe('bitcoin');
      expect(crypto.symbol).toBe('BTC');
      expect(crypto.name).toBe('Bitcoin');
      expect(crypto.currentPrice).toBe(50000);
    });
  });

  describe('SentimentAnalysis Interface', () => {
    it('should have correct structure', () => {
      const sentiment: SentimentAnalysis = {
        id: 'sentiment123',
        cryptoId: 'bitcoin',
        score: 0.75,
        label: SentimentLabel.BULLISH,
        confidence: 0.85,
        aiSummary: 'Positive sentiment detected',
        aiReasoning: 'Based on recent news and whale activity',
        modelUsed: 'openrouter/gpt-4',
        sources: [],
        whaleActivity: [],
        createdAt: new Date(),
      };

      expect(sentiment.id).toBe('sentiment123');
      expect(sentiment.cryptoId).toBe('bitcoin');
      expect(sentiment.score).toBe(0.75);
      expect(sentiment.label).toBe(SentimentLabel.BULLISH);
    });
  });

  describe('Alert Interface', () => {
    it('should have correct structure', () => {
      const alert: Alert = {
        id: 'alert123',
        userId: 'user123',
        cryptoId: 'bitcoin',
        type: AlertType.PRICE_CHANGE,
        condition: 'price > 50000',
        isActive: true,
        triggerCount: 0,
      };

      expect(alert.id).toBe('alert123');
      expect(alert.userId).toBe('user123');
      expect(alert.type).toBe(AlertType.PRICE_CHANGE);
      expect(alert.isActive).toBe(true);
    });
  });

  describe('Notification Interface', () => {
    it('should have correct structure', () => {
      const notification: Notification = {
        id: 'notif123',
        userId: 'user123',
        type: NotificationType.ALERT_TRIGGERED,
        title: 'Price Alert Triggered',
        content: 'Bitcoin has exceeded $50,000',
        isRead: false,
        createdAt: new Date(),
      };

      expect(notification.id).toBe('notif123');
      expect(notification.type).toBe(NotificationType.ALERT_TRIGGERED);
      expect(notification.isRead).toBe(false);
    });
  });

  describe('Enums', () => {
    describe('SubscriptionTier', () => {
      it('should contain expected values', () => {
        expect(SubscriptionTier.FREE).toBe('FREE');
        expect(SubscriptionTier.BASIC).toBe('BASIC');
        expect(SubscriptionTier.PRO).toBe('PRO');
        expect(SubscriptionTier.ENTERPRISE).toBe('ENTERPRISE');
      });
    });

    describe('SentimentLabel', () => {
      it('should contain expected values', () => {
        expect(SentimentLabel.VERY_BULLISH).toBe('VERY_BULLISH');
        expect(SentimentLabel.BULLISH).toBe('BULLISH');
        expect(SentimentLabel.NEUTRAL).toBe('NEUTRAL');
        expect(SentimentLabel.BEARISH).toBe('BEARISH');
        expect(SentimentLabel.VERY_BEARISH).toBe('VERY_BEARISH');
      });
    });

    describe('AlertType', () => {
      it('should contain expected values', () => {
        expect(AlertType.SENTIMENT_CHANGE).toBe('SENTIMENT_CHANGE');
        expect(AlertType.PRICE_CHANGE).toBe('PRICE_CHANGE');
        expect(AlertType.VOLUME_SPIKE).toBe('VOLUME_SPIKE');
        expect(AlertType.WHALE_ACTIVITY).toBe('WHALE_ACTIVITY');
        expect(AlertType.NEWS_MENTION).toBe('NEWS_MENTION');
      });
    });

    describe('NotificationType', () => {
      it('should contain expected values', () => {
        expect(NotificationType.ALERT_TRIGGERED).toBe('ALERT_TRIGGERED');
        expect(NotificationType.SUBSCRIPTION_UPDATE).toBe('SUBSCRIPTION_UPDATE');
        expect(NotificationType.SYSTEM_ANNOUNCEMENT).toBe('SYSTEM_ANNOUNCEMENT');
        expect(NotificationType.SECURITY_NOTICE).toBe('SECURITY_NOTICE');
      });
    });

    describe('SubscriptionStatus', () => {
      it('should contain expected values', () => {
        expect(SubscriptionStatus.ACTIVE).toBe('ACTIVE');
        expect(SubscriptionStatus.CANCELED).toBe('CANCELED');
        expect(SubscriptionStatus.PAST_DUE).toBe('PAST_DUE');
        expect(SubscriptionStatus.UNPAID).toBe('UNPAID');
      });
    });
  });
});