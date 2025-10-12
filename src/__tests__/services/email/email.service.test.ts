import { EmailService, AlertEmailData } from '@/services/email/email.service';
import { AlertType } from '@prisma/client';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
    verify: jest.fn(),
  })),
}));

interface MockTransporter {
  sendMail: jest.Mock;
  verify: jest.Mock;
}

describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: MockTransporter;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.FROM_EMAIL = 'test@cryptosentiment.com';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    
    emailService = new EmailService();
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_SERVER_HOST;
    delete process.env.EMAIL_SERVER_USER;
    delete process.env.EMAIL_SERVER_PASSWORD;
    delete process.env.FROM_EMAIL;
    delete process.env.NEXTAUTH_URL;
  });

  describe('constructor', () => {
    it('should create transporter with Resend configuration when API key is available', () => {
      process.env.RESEND_API_KEY = 'test-resend-key';
      
      new EmailService();
      
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: 'test-resend-key',
        },
      });
    });

    it('should create transporter with SMTP configuration when no Resend key', () => {
      process.env.EMAIL_SERVER_HOST = 'smtp.example.com';
      process.env.EMAIL_SERVER_PORT = '587';
      process.env.EMAIL_SERVER_USER = 'test@example.com';
      process.env.EMAIL_SERVER_PASSWORD = 'password123';
      
      new EmailService();
      
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
      });
    });

    it('should use default SMTP configuration when no environment variables', () => {
      new EmailService();
      
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'localhost',
        port: 587,
        secure: false,
        auth: {
          user: undefined,
          pass: undefined,
        },
      });
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>',
        text: 'Test text',
      };

      const result = await emailService.sendEmail(emailData);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@cryptosentiment.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>',
        text: 'Test text',
      });
    });

    it('should convert HTML to text when text is not provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1><p>Some content</p>',
      };

      await emailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@cryptosentiment.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1><p>Some content</p>',
        text: 'Test HTMLSome content',
      });
    });

    it('should handle email sending failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>',
      };

      const result = await emailService.sendEmail(emailData);

      expect(result).toBe(false);
    });

    it('should use fallback from email when FROM_EMAIL is not set', async () => {
      delete process.env.FROM_EMAIL;
      process.env.EMAIL_FROM = 'fallback@cryptosentiment.com';
      
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML</h1>',
      };

      await emailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'fallback@cryptosentiment.com',
        })
      );
    });
  });

  describe('sendAlertEmail', () => {
    it('should send alert email with proper formatting', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const alertData: AlertEmailData = {
        userEmail: 'user@example.com',
        userName: 'John Doe',
        cryptoName: 'Bitcoin',
        cryptoSymbol: 'BTC',
        alertType: AlertType.SENTIMENT_CHANGE,
        alertDetails: {
          title: 'Bitcoin Sentiment Alert',
          message: 'Bitcoin sentiment has changed to bullish',
          timestamp: new Date('2025-01-01T12:00:00Z'),
          triggerCount: 5,
        },
        dashboardUrl: 'http://localhost:3000/dashboard',
      };

      const result = await emailService.sendAlertEmail(alertData);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: '🚨 Bitcoin Alert Triggered - CryptoSentiment',
          html: expect.stringContaining('Bitcoin Sentiment Alert'),
          text: expect.stringContaining('Bitcoin sentiment has changed to bullish'),
        })
      );
    });

    it('should handle different alert types', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const alertData: AlertEmailData = {
        userEmail: 'user@example.com',
        cryptoName: 'Ethereum',
        cryptoSymbol: 'ETH',
        alertType: AlertType.PRICE_CHANGE,
        alertDetails: {
          title: 'Ethereum Price Alert',
          message: 'Ethereum price has increased by 10%',
          timestamp: new Date(),
          triggerCount: 1,
        },
      };

      const result = await emailService.sendAlertEmail(alertData);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '🚨 Ethereum Alert Triggered - CryptoSentiment',
          html: expect.stringContaining('Price Change'),
        })
      );
    });

    it('should handle alert email sending failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const alertData: AlertEmailData = {
        userEmail: 'user@example.com',
        cryptoName: 'Bitcoin',
        cryptoSymbol: 'BTC',
        alertType: AlertType.SENTIMENT_CHANGE,
        alertDetails: {
          title: 'Test Alert',
          message: 'Test message',
          timestamp: new Date(),
          triggerCount: 1,
        },
      };

      const result = await emailService.sendAlertEmail(alertData);

      expect(result).toBe(false);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await emailService.sendWelcomeEmail('user@example.com', 'John Doe');

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Welcome to CryptoSentiment! 🚀',
          html: expect.stringContaining('Welcome John Doe!'),
        })
      );
    });

    it('should send welcome email without name', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await emailService.sendWelcomeEmail('user@example.com');

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Welcome to CryptoSentiment! 🚀',
          html: expect.stringContaining('Welcome to CryptoSentiment!'),
        })
      );
    });

    it('should handle welcome email sending failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await emailService.sendWelcomeEmail('user@example.com');

      expect(result).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.testConnection();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const result = await emailService.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('formatAlertType', () => {
    it('should format all alert types correctly', () => {
      // This tests the private method through the public sendAlertEmail method
      const alertTypes = [
        { type: AlertType.SENTIMENT_CHANGE, expected: 'Sentiment Change' },
        { type: AlertType.PRICE_CHANGE, expected: 'Price Change' },
        { type: AlertType.VOLUME_SPIKE, expected: 'Volume Spike' },
        { type: AlertType.WHALE_ACTIVITY, expected: 'Whale Activity' },
        { type: AlertType.NEWS_MENTION, expected: 'News Mention' },
      ];

      alertTypes.forEach(({ type, expected }) => {
        mockTransporter.sendMail.mockClear();
        mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

        const alertData: AlertEmailData = {
          userEmail: 'test@example.com',
          cryptoName: 'Bitcoin',
          cryptoSymbol: 'BTC',
          alertType: type,
          alertDetails: {
            title: 'Test Alert',
            message: 'Test message',
            timestamp: new Date(),
            triggerCount: 1,
          },
        };

        emailService.sendAlertEmail(alertData);

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            html: expect.stringContaining(expected),
          })
        );
      });
    });
  });

  describe('htmlToText conversion', () => {
    it('should properly convert HTML to text', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const htmlContent = `
        <h1>Title</h1>
        <p>This is a <strong>test</strong> with &amp; symbols &lt;script&gt;alert('xss')&lt;/script&gt;</p>
        <div>Multiple   spaces</div>
      `;

      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: htmlContent,
      });

      const textContent = mockTransporter.sendMail.mock.calls[0][0].text;
      expect(textContent).not.toContain('<script>'); // Script tags should be removed
      expect(textContent).not.toContain('</script>');
      expect(textContent).toContain('Title');
      expect(textContent).toContain('test with & symbols');
      expect(textContent).not.toContain('  '); // Multiple spaces should be collapsed
    });
  });
});