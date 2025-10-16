import { AlertTemplateService, AlertTemplate } from '@/services/alerts/alert-template.service';
import { AlertType } from '@prisma/client';

describe('AlertTemplateService', () => {
  let alertTemplateService: AlertTemplateService;

  beforeEach(() => {
    alertTemplateService = new AlertTemplateService();
  });

  describe('getAllTemplates', () => {
    it('should return all available templates', () => {
      const templates = alertTemplateService.getAllTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      // Check that all templates have required properties
      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('alertType');
        expect(template).toHaveProperty('condition');
        expect(template).toHaveProperty('tags');
        expect(template).toHaveProperty('isPopular');
        expect(template).toHaveProperty('useCase');
      });
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return templates organized by category', () => {
      const categories = alertTemplateService.getTemplatesByCategory();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);

      // Check category structure
      categories.forEach(category => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('templates');
        expect(Array.isArray(category.templates)).toBe(true);
      });

      // Verify we have expected categories
      const categoryNames = categories.map(c => c.name);
      expect(categoryNames).toContain('Price Alerts');
      expect(categoryNames).toContain('Sentiment Alerts');
      expect(categoryNames).toContain('Volume Alerts');
    });

    it('should categorize templates correctly by alert type', () => {
      const categories = alertTemplateService.getTemplatesByCategory();
      
      const priceCategory = categories.find(c => c.name === 'Price Alerts');
      const sentimentCategory = categories.find(c => c.name === 'Sentiment Alerts');
      const volumeCategory = categories.find(c => c.name === 'Volume Alerts');

      expect(priceCategory).toBeDefined();
      expect(sentimentCategory).toBeDefined();
      expect(volumeCategory).toBeDefined();

      // All price templates should have PRICE_CHANGE type
      priceCategory!.templates.forEach(template => {
        expect(template.alertType).toBe(AlertType.PRICE_CHANGE);
      });

      // All sentiment templates should have SENTIMENT_CHANGE type
      sentimentCategory!.templates.forEach(template => {
        expect(template.alertType).toBe(AlertType.SENTIMENT_CHANGE);
      });

      // All volume templates should have VOLUME_SPIKE type
      volumeCategory!.templates.forEach(template => {
        expect(template.alertType).toBe(AlertType.VOLUME_SPIKE);
      });
    });
  });

  describe('getPopularTemplates', () => {
    it('should return only popular templates', () => {
      const popularTemplates = alertTemplateService.getPopularTemplates();
      const allTemplates = alertTemplateService.getAllTemplates();

      expect(Array.isArray(popularTemplates)).toBe(true);
      expect(popularTemplates.length).toBeGreaterThan(0);
      expect(popularTemplates.length).toBeLessThan(allTemplates.length);

      // All returned templates should be marked as popular
      popularTemplates.forEach(template => {
        expect(template.isPopular).toBe(true);
      });
    });
  });

  describe('getTemplateById', () => {
    it('should return the correct template by ID', () => {
      const allTemplates = alertTemplateService.getAllTemplates();
      const firstTemplate = allTemplates[0];

      const foundTemplate = alertTemplateService.getTemplateById(firstTemplate.id);

      expect(foundTemplate).toBeDefined();
      expect(foundTemplate).toEqual(firstTemplate);
    });

    it('should return undefined for non-existent ID', () => {
      const foundTemplate = alertTemplateService.getTemplateById('non-existent-id');
      expect(foundTemplate).toBeUndefined();
    });
  });

  describe('searchTemplates', () => {
    it('should find templates by name', () => {
      const results = alertTemplateService.searchTemplates('bitcoin');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Should find the Bitcoin-related template
      const bitcoinTemplate = results.find(t => t.name.toLowerCase().includes('bitcoin'));
      expect(bitcoinTemplate).toBeDefined();
    });

    it('should find templates by description', () => {
      const results = alertTemplateService.searchTemplates('pump');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find templates by tags', () => {
      const results = alertTemplateService.searchTemplates('dca');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const dcaTemplate = results.find(t => t.tags.includes('dca'));
      expect(dcaTemplate).toBeDefined();
    });

    it('should return empty array for non-matching query', () => {
      const results = alertTemplateService.searchTemplates('nonexistentquery123456');
      expect(results).toEqual([]);
    });

    it('should be case insensitive', () => {
      const lowerResults = alertTemplateService.searchTemplates('bitcoin');
      const upperResults = alertTemplateService.searchTemplates('BITCOIN');
      const mixedResults = alertTemplateService.searchTemplates('BiTcOiN');

      expect(lowerResults).toEqual(upperResults);
      expect(upperResults).toEqual(mixedResults);
    });
  });

  describe('getTemplatesByUseCase', () => {
    it('should return conservative templates', () => {
      const templates = alertTemplateService.getTemplatesByUseCase('conservative');
      
      expect(Array.isArray(templates)).toBe(true);
      templates.forEach(template => {
        expect(
          template.tags.some(tag => ['conservative', 'dca', 'long-term'].includes(tag))
        ).toBe(true);
      });
    });

    it('should return aggressive templates', () => {
      const templates = alertTemplateService.getTemplatesByUseCase('aggressive');
      
      expect(Array.isArray(templates)).toBe(true);
      templates.forEach(template => {
        expect(
          template.tags.some(tag => ['pump', 'scalping', 'quick-moves'].includes(tag))
        ).toBe(true);
      });
    });

    it('should return day-trading templates', () => {
      const templates = alertTemplateService.getTemplatesByUseCase('day-trading');
      
      expect(Array.isArray(templates)).toBe(true);
      templates.forEach(template => {
        expect(
          template.tags.some(tag => ['scalping', 'day-trading', 'quick-moves', 'breakout'].includes(tag))
        ).toBe(true);
      });
    });

    it('should return long-term templates', () => {
      const templates = alertTemplateService.getTemplatesByUseCase('long-term');
      
      expect(Array.isArray(templates)).toBe(true);
      templates.forEach(template => {
        expect(
          template.tags.some(tag => ['dca', 'major-movement', 'conservative', 'institutional'].includes(tag))
        ).toBe(true);
      });
    });
  });

  describe('createAlertFromTemplate', () => {
    it('should create alert data from template', () => {
      const templates = alertTemplateService.getAllTemplates();
      const template = templates[0];

      const alertData = alertTemplateService.createAlertFromTemplate(
        template.id,
        'btc',
        'Bitcoin'
      );

      expect(alertData).toEqual({
        cryptoSymbol: 'btc',
        cryptoName: 'Bitcoin',
        type: template.alertType,
        condition: template.condition,
        templateId: template.id,
        templateName: template.name,
      });
    });

    it('should convert crypto symbol to lowercase', () => {
      const templates = alertTemplateService.getAllTemplates();
      const template = templates[0];

      const alertData = alertTemplateService.createAlertFromTemplate(
        template.id,
        'BTC'
      );

      expect(alertData.cryptoSymbol).toBe('btc');
    });

    it('should use uppercase symbol as name if name not provided', () => {
      const templates = alertTemplateService.getAllTemplates();
      const template = templates[0];

      const alertData = alertTemplateService.createAlertFromTemplate(
        template.id,
        'btc'
      );

      expect(alertData.cryptoName).toBe('BTC');
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        alertTemplateService.createAlertFromTemplate(
          'non-existent-template',
          'btc',
          'Bitcoin'
        );
      }).toThrow('Template not found: non-existent-template');
    });
  });

  describe('getRecommendedTemplates', () => {
    it('should recommend popular templates for new users', () => {
      const recommendations = alertTemplateService.getRecommendedTemplates([]);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      
      // All recommendations should be popular templates
      recommendations.forEach(template => {
        expect(template.isPopular).toBe(true);
      });
    });

    it('should limit recommendations based on existing alert types', () => {
      const existingAlerts = [
        { type: AlertType.PRICE_CHANGE },
        { type: AlertType.PRICE_CHANGE },
        { type: AlertType.PRICE_CHANGE },
        { type: AlertType.PRICE_CHANGE }, // 4 price alerts (over limit)
      ];

      const recommendations = alertTemplateService.getRecommendedTemplates(existingAlerts);
      
      // Should not recommend many price alert templates since user already has many
      const priceRecommendations = recommendations.filter(
        template => template.alertType === AlertType.PRICE_CHANGE
      );
      
      expect(priceRecommendations.length).toBeLessThanOrEqual(1);
    });

    it('should return limited number of recommendations', () => {
      const recommendations = alertTemplateService.getRecommendedTemplates([]);
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('template data validation', () => {
    it('should have valid alert types for all templates', () => {
      const templates = alertTemplateService.getAllTemplates();
      const validAlertTypes = Object.values(AlertType);

      templates.forEach(template => {
        expect(validAlertTypes).toContain(template.alertType);
      });
    });

    it('should have unique IDs for all templates', () => {
      const templates = alertTemplateService.getAllTemplates();
      const ids = templates.map(t => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have non-empty required fields for all templates', () => {
      const templates = alertTemplateService.getAllTemplates();

      templates.forEach(template => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.useCase).toBeTruthy();
        expect(Array.isArray(template.tags)).toBe(true);
        expect(template.tags.length).toBeGreaterThan(0);
        expect(typeof template.isPopular).toBe('boolean');
      });
    });

    it('should have valid condition objects for all templates', () => {
      const templates = alertTemplateService.getAllTemplates();

      templates.forEach(template => {
        expect(typeof template.condition).toBe('object');
        expect(template.condition).not.toBeNull();
        
        // Validate condition based on alert type
        if (template.alertType === AlertType.PRICE_CHANGE) {
          expect(template.condition).toHaveProperty('priceThreshold');
        } else if (template.alertType === AlertType.SENTIMENT_CHANGE) {
          expect(template.condition).toHaveProperty('sentimentThreshold');
        } else if (template.alertType === AlertType.VOLUME_SPIKE) {
          expect(template.condition).toHaveProperty('volumeThreshold');
        }
      });
    });
  });
});