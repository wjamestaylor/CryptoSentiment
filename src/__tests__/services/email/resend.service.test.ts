import { jest } from '@jest/globals';

// Use manual mock
jest.mock('resend');

// Import service after mocking
import { ResendEmailService, resendEmailService } from '@/services/email/resend.service';
import { mockEmailsSend } from '../../__mocks__/resend';

describe('ResendEmailService', () => {
  let service: ResendEmailService;

  beforeEach(() => {
    service = new ResendEmailService();
    // Reset the resend instance to ensure fresh mock setup
    (service as any).resend = null;
    
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.EMAIL_FROM = 'test@cryptosentiment.app';
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.NEXTAUTH_URL;
    delete process.env.EMAIL_FROM;
  });

  describe('Basic functionality tests', () => {
    it('should create ResendEmailService instance', () => {
      expect(service).toBeInstanceOf(ResendEmailService);
    });

    it('should have access to environment variables', () => {
      expect(process.env.RESEND_API_KEY).toBe('test-api-key');
      expect(process.env.NEXTAUTH_URL).toBe('http://localhost:3000');
      expect(process.env.EMAIL_FROM).toBe('test@cryptosentiment.app');
    });

    it('should throw error when RESEND_API_KEY is missing', () => {
      delete process.env.RESEND_API_KEY;
      const newService = new ResendEmailService();
      
      expect(() => (newService as any).getResend()).toThrow('RESEND_API_KEY environment variable is required');
    });

    it('should create Resend instance when API key is present', () => {
      const resendInstance = (service as any).getResend();
      
      expect(resendInstance).toBeDefined();
      expect(resendInstance.emails).toBeDefined();
      expect(resendInstance.emails.send).toBeDefined();
    });

    it('should send verification email successfully', async () => {
      // Mock successful email send
      mockEmailsSend.mockResolvedValueOnce({ id: 'test-id' });
      
      console.log('API Key:', process.env.RESEND_API_KEY);
      console.log('Mock setup:', mockEmailsSend.getMockName());
      
      try {
        await service.sendVerificationEmail('test@example.com', 'token123');
        console.log('Email sent successfully');
      } catch (error) {
        console.log('Error sending email:', error);
      }
      
      console.log('Mock calls:', mockEmailsSend.mock.calls.length);
      
      expect(mockEmailsSend).toHaveBeenCalledTimes(1);
      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@cryptosentiment.app',
          to: 'test@example.com',
          subject: 'Verify your CryptoSentiment account',
          html: expect.stringContaining('token123'),
        })
      );
    });

    it('should handle welcome email errors gracefully', async () => {
      // Mock email send to reject with an error
      mockEmailsSend.mockRejectedValueOnce(new Error('Network error'));
      
      // Welcome emails should not throw errors (they're non-critical)
      await expect(service.sendWelcomeEmail('test@example.com')).resolves.not.toThrow();
    });

    it('should throw error for alert email failures', async () => {
      // Mock email send to reject with an error
      mockEmailsSend.mockRejectedValueOnce(new Error('Network error'));
      
      // Alert emails should throw errors (they're critical)
      await expect(service.sendAlertEmail('test@example.com', 'BTC', 'Alert', 50000, 'Details'))
        .rejects.toThrow('Failed to send alert email');
    });
  });

  describe('Email sending functionality', () => {
    it('should send password reset email', async () => {
      // Mock successful email send
      mockEmailsSend.mockResolvedValueOnce({ id: 'reset-id' });
      
      await service.sendPasswordResetEmail('user@example.com', 'reset-token');
      
      expect(mockEmailsSend).toHaveBeenCalledTimes(1);
      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@cryptosentiment.app',
          to: 'user@example.com',
          subject: 'Reset your CryptoSentiment password',
          html: expect.stringContaining('reset-token'),
        })
      );
    });

    it('should send magic link email', async () => {
      // Mock successful email send
      mockEmailsSend.mockResolvedValueOnce({ id: 'magic-id' });
      
      await service.sendMagicLinkEmail('user@example.com', 'http://localhost:3000/auth/magic?token=abc');
      
      expect(mockEmailsSend).toHaveBeenCalledTimes(1);
      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@cryptosentiment.app',
          to: 'user@example.com',
          subject: 'Sign in to CryptoSentiment',
          html: expect.stringContaining('http://localhost:3000/auth/magic?token=abc'),
        })
      );
    });

    it('should send notification email', async () => {
      // Mock successful email send
      mockEmailsSend.mockResolvedValueOnce({ id: 'notification-id' });
      
      await service.sendNotificationEmail('user@example.com', 'Alice', 'System Update', 'The system will be updated tonight');
      
      expect(mockEmailsSend).toHaveBeenCalledTimes(1);
      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@cryptosentiment.app',
          to: 'user@example.com',
          subject: 'CryptoSentiment: System Update',
          html: expect.stringContaining('Alice'),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle verification email errors', async () => {
      mockEmailsSend.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(service.sendVerificationEmail('user@example.com', 'token'))
        .rejects.toThrow('Failed to send verification email');
    });

    it('should handle password reset email errors', async () => {
      mockEmailsSend.mockRejectedValueOnce(new Error('Network Error'));
      
      await expect(service.sendPasswordResetEmail('user@example.com', 'token'))
        .rejects.toThrow('Failed to send password reset email');
    });

    it('should handle magic link email errors', async () => {
      mockEmailsSend.mockRejectedValueOnce(new Error('Service Error'));
      
      await expect(service.sendMagicLinkEmail('user@example.com', 'http://test.com'))
        .rejects.toThrow('Failed to send magic link email');
    });

    it('should not throw on welcome email errors', async () => {
      mockEmailsSend.mockRejectedValueOnce(new Error('Service Error'));
      
      await expect(service.sendWelcomeEmail('user@example.com')).resolves.not.toThrow();
    });

    it('should handle alert email errors', async () => {
      mockEmailsSend.mockRejectedValueOnce(new Error('Alert Error'));
      
      await expect(service.sendAlertEmail('user@example.com', 'BTC', 'Alert', 50000, 'Details'))
        .rejects.toThrow('Failed to send alert email');
    });

    it('should handle notification email errors', async () => {
      mockEmailsSend.mockRejectedValueOnce(new Error('Notification Error'));
      
      await expect(service.sendNotificationEmail('user@example.com', 'John', 'Title', 'Content'))
        .rejects.toThrow('Failed to send notification email');
    });
  });

  describe('Template validation', () => {
    it('should generate verification email template', () => {
      const template = (service as any).getVerificationEmailTemplate('http://test.com/verify');
      
      expect(template).toContain('CryptoSentiment');
      expect(template).toContain('Verify Your Email Address');
      expect(template).toContain('http://test.com/verify');
    });

    it('should generate welcome email template', () => {
      const template = (service as any).getWelcomeEmailTemplate('Alice');
      
      expect(template).toContain('CryptoSentiment');
      expect(template).toContain('Welcome to');
      expect(template).toContain('Alice');
    });

    it('should generate alert email template', () => {
      const template = (service as any).getAlertEmailTemplate('BTC', 'Price Alert', 50000, 'Price reached $50,000');
      
      expect(template).toContain('CryptoSentiment');
      expect(template).toContain('BTC');
      expect(template).toContain('Price Alert');
      expect(template).toContain('$50,000');
    });

    it('should include responsive design elements', () => {
      const template = (service as any).getVerificationEmailTemplate('http://test.com');
      
      expect(template).toContain('max-width: 600px');
      expect(template).toContain('viewport');
    });

    it('should include brand colors', () => {
      const html = (service as any).getWelcomeEmailTemplate('Test User');
      expect(html).toContain('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    });
  });

  describe('Default sender addresses', () => {
    beforeEach(() => {
      delete process.env.EMAIL_FROM;
    });

    it('should use default verification sender when EMAIL_FROM not set', async () => {
      mockEmailsSend.mockResolvedValueOnce({ id: 'test-id' });
      
      await service.sendVerificationEmail('user@example.com', 'token');
      
      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'CryptoSentiment <noreply@cryptosentiment.app>',
          to: 'user@example.com',
        })
      );
    });

    it('should use default welcome sender when EMAIL_FROM not set', async () => {
      mockEmailsSend.mockResolvedValueOnce({ id: 'test-id' });
      
      await service.sendWelcomeEmail('user@example.com');
      
      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'CryptoSentiment <welcome@cryptosentiment.app>',
          to: 'user@example.com',
        })
      );
    });

    it('should use default alert sender when EMAIL_FROM not set', async () => {
      mockEmailsSend.mockResolvedValueOnce({ id: 'test-id' });
      
      await service.sendAlertEmail('user@example.com', 'BTC', 'Alert', 50000, 'Details');
      
      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'CryptoSentiment <alerts@cryptosentiment.app>',
          to: 'user@example.com',
        })
      );
    });
  });

  describe('Singleton instance', () => {
    it('should export singleton instance', () => {
      expect(resendEmailService).toBeInstanceOf(ResendEmailService);
    });
  });
});