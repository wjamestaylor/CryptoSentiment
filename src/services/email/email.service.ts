import nodemailer from 'nodemailer';
import { AlertType } from '@prisma/client';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface AlertEmailData {
  userEmail: string;
  userName?: string;
  cryptoName: string;
  cryptoSymbol: string;
  alertType: AlertType;
  alertDetails: {
    title: string;
    message: string;
    timestamp: Date;
    triggerCount: number;
  };
  dashboardUrl?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = this.createTransporter();
  }

  /**
   * Create nodemailer transporter with configuration
   */
  private createTransporter() {
    // Check if we're using Resend (recommended) or SMTP
    if (process.env.RESEND_API_KEY) {
      return nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      });
    }

    // Fallback to standard SMTP configuration
    const config = {
      host: process.env.EMAIL_SERVER_HOST || 'localhost',
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      secure: process.env.EMAIL_SERVER_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    };

    return nodemailer.createTransport(config);
  }

  /**
   * Send a generic email
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const from = process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@cryptosentiment.com';

      const mailOptions = {
        from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.htmlToText(emailData.html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`Email sent successfully to ${emailData.to}:`, result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send alert notification email
   */
  async sendAlertEmail(alertData: AlertEmailData): Promise<boolean> {
    try {
      const subject = `🚨 ${alertData.cryptoName} Alert Triggered - CryptoSentiment`;
      const html = this.generateAlertEmailHTML(alertData);
      const text = this.generateAlertEmailText(alertData);

      return await this.sendEmail({
        to: alertData.userEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('Failed to send alert email:', error);
      return false;
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(userEmail: string, userName?: string): Promise<boolean> {
    try {
      const subject = 'Welcome to CryptoSentiment! 🚀';
      const html = this.generateWelcomeEmailHTML(userEmail, userName);

      return await this.sendEmail({
        to: userEmail,
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Generate HTML content for alert emails
   */
  private generateAlertEmailHTML(alertData: AlertEmailData): string {
    const { userName, cryptoName, cryptoSymbol, alertType, alertDetails, dashboardUrl } = alertData;
    
    const alertTypeDisplay = this.formatAlertType(alertType);
    const dashboardLink = dashboardUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CryptoSentiment Alert</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .alert-badge {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .crypto-info {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .crypto-name {
            font-size: 20px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 5px;
        }
        .crypto-symbol {
            color: #64748b;
            font-size: 14px;
            text-transform: uppercase;
        }
        .alert-details {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 20px 0;
        }
        .alert-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 8px;
        }
        .alert-message {
            color: #78350f;
            margin-bottom: 12px;
        }
        .alert-meta {
            font-size: 12px;
            color: #a16207;
        }
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            text-align: center;
        }
        .unsubscribe {
            color: #64748b;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📊 CryptoSentiment</div>
            <div class="alert-badge">🚨 ALERT TRIGGERED</div>
        </div>

        ${userName ? `<p>Hi ${userName},</p>` : '<p>Hello,</p>'}

        <p>Your ${alertTypeDisplay} alert for <strong>${cryptoName}</strong> has been triggered!</p>

        <div class="crypto-info">
            <div class="crypto-name">${cryptoName}</div>
            <div class="crypto-symbol">${cryptoSymbol}</div>
        </div>

        <div class="alert-details">
            <div class="alert-title">${alertDetails.title}</div>
            <div class="alert-message">${alertDetails.message}</div>
            <div class="alert-meta">
                Triggered: ${alertDetails.timestamp.toLocaleString()} | 
                Total Triggers: ${alertDetails.triggerCount}
            </div>
        </div>

        <p>This alert was set up to notify you when specific conditions are met for ${cryptoName}. 
        You can manage your alerts and view detailed analysis in your dashboard.</p>

        <div style="text-align: center;">
            <a href="${dashboardLink}" class="cta-button">View Dashboard</a>
        </div>

        <div class="footer">
            <p>You're receiving this email because you have alert notifications enabled.<br>
            <a href="${dashboardLink}/profile" class="unsubscribe">Manage notification preferences</a></p>
            
            <p>CryptoSentiment - AI-Powered Cryptocurrency Sentiment Analysis<br>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" class="unsubscribe">cryptosentiment.com</a></p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text content for alert emails
   */
  private generateAlertEmailText(alertData: AlertEmailData): string {
    const { userName, cryptoName, cryptoSymbol, alertType, alertDetails, dashboardUrl } = alertData;
    
    const alertTypeDisplay = this.formatAlertType(alertType);
    const dashboardLink = dashboardUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`;

    return `
🚨 CRYPTOSENTIMENT ALERT TRIGGERED

${userName ? `Hi ${userName},` : 'Hello,'}

Your ${alertTypeDisplay} alert for ${cryptoName} (${cryptoSymbol}) has been triggered!

ALERT DETAILS:
${alertDetails.title}
${alertDetails.message}

Triggered: ${alertDetails.timestamp.toLocaleString()}
Total Triggers: ${alertDetails.triggerCount}

This alert was set up to notify you when specific conditions are met for ${cryptoName}. 
You can manage your alerts and view detailed analysis in your dashboard.

View Dashboard: ${dashboardLink}

---
CryptoSentiment - AI-Powered Cryptocurrency Sentiment Analysis
Manage preferences: ${dashboardLink}/profile
Website: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}
    `;
  }

  /**
   * Generate welcome email HTML
   */
  private generateWelcomeEmailHTML(userEmail: string, userName?: string): string {
    const dashboardLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CryptoSentiment</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .welcome-badge {
            background: #16a34a;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
        }
        .feature-list {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .feature-item {
            margin: 12px 0;
            padding-left: 20px;
            position: relative;
        }
        .feature-item::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #16a34a;
            font-weight: bold;
        }
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📊 CryptoSentiment</div>
            <div class="welcome-badge">🎉 WELCOME ABOARD</div>
        </div>

        ${userName ? `<h2>Welcome ${userName}!</h2>` : '<h2>Welcome to CryptoSentiment!</h2>'}

        <p>Thank you for joining CryptoSentiment, the premier AI-powered cryptocurrency sentiment analysis platform. 
        We're excited to help you make smarter trading decisions with real-time sentiment insights!</p>

        <h3>🚀 What you can do now:</h3>
        <div class="feature-list">
            <div class="feature-item">Set up custom alerts for your favorite cryptocurrencies</div>
            <div class="feature-item">Get AI-powered sentiment analysis in real-time</div>
            <div class="feature-item">Track whale movements and market sentiment</div>
            <div class="feature-item">Build your personalized crypto watchlist</div>
            <div class="feature-item">Receive instant notifications for market changes</div>
        </div>

        <p>Ready to get started? Head to your dashboard to explore all the features and set up your first alerts!</p>

        <div style="text-align: center;">
            <a href="${dashboardLink}" class="cta-button">Go to Dashboard</a>
        </div>

        <p><strong>Pro Tip:</strong> Set up email notifications in your profile settings to never miss important market movements!</p>

        <div class="footer">
            <p>Need help getting started? Check out our <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/docs">documentation</a> or 
            <a href="mailto:support@cryptosentiment.com">contact support</a>.</p>
            
            <p>CryptoSentiment - AI-Powered Cryptocurrency Sentiment Analysis<br>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}">cryptosentiment.com</a></p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Format alert type for display
   */
  private formatAlertType(alertType: AlertType): string {
    switch (alertType) {
      case AlertType.SENTIMENT_CHANGE:
        return 'Sentiment Change';
      case AlertType.PRICE_CHANGE:
        return 'Price Change';
      case AlertType.VOLUME_SPIKE:
        return 'Volume Spike';
      case AlertType.WHALE_ACTIVITY:
        return 'Whale Activity';
      case AlertType.NEWS_MENTION:
        return 'News Mention';
      default:
        return 'Alert';
    }
  }

  /**
   * Convert HTML to plain text (basic implementation)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags first
      .replace(/&lt;[^&]*&gt;/g, '') // Remove HTML entities that look like tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim();
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}