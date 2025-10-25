import { Resend } from 'resend';

export class ResendEmailService {
  private resend: Resend | null = null;

  private getResend(): Resend {
    if (!this.resend) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error('RESEND_API_KEY environment variable is required');
      }
      this.resend = new Resend(apiKey);
    }
    return this.resend;
  }

  /**
   * Send email verification link to user
   */
  async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${verificationToken}`;
    
    try {
      await this.getResend().emails.send({
        from: process.env.EMAIL_FROM || 'CryptoSentiment <noreply@cryptosentiment.app>',
        to: email,
        subject: 'Verify your CryptoSentiment account',
        html: this.getVerificationEmailTemplate(verificationUrl),
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
    
    try {
      await this.getResend().emails.send({
        from: process.env.EMAIL_FROM || 'CryptoSentiment <noreply@cryptosentiment.app>',
        to: email,
        subject: 'Reset your CryptoSentiment password',
        html: this.getPasswordResetEmailTemplate(resetUrl),
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send magic link email for passwordless sign in
   */
  async sendMagicLinkEmail(email: string, magicLinkUrl: string): Promise<void> {
    try {
      await this.getResend().emails.send({
        from: process.env.EMAIL_FROM || 'CryptoSentiment <signin@cryptosentiment.app>',
        to: email,
        subject: 'Sign in to CryptoSentiment',
        html: this.getMagicLinkEmailTemplate(magicLinkUrl),
      });
    } catch (error) {
      console.error('Failed to send magic link email:', error);
      throw new Error('Failed to send magic link email');
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    try {
      await this.getResend().emails.send({
        from: process.env.EMAIL_FROM || 'CryptoSentiment <welcome@cryptosentiment.app>',
        to: email,
        subject: 'Welcome to CryptoSentiment! 🚀',
        html: this.getWelcomeEmailTemplate(name || 'there'),
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw error for welcome emails - they're not critical
    }
  }

  /**
   * Send alert notification email
   */
  async sendAlertEmail(
    email: string, 
    cryptoSymbol: string, 
    alertType: string, 
    currentPrice: number, 
    alertDetails: string
  ): Promise<void> {
    try {
      await this.getResend().emails.send({
        from: process.env.EMAIL_FROM || 'CryptoSentiment <alerts@cryptosentiment.app>',
        to: email,
        subject: `🚨 CryptoSentiment Alert: ${cryptoSymbol} ${alertType}`,
        html: this.getAlertEmailTemplate(cryptoSymbol, alertType, currentPrice, alertDetails),
      });
    } catch (error) {
      console.error('Failed to send alert email:', error);
      throw new Error('Failed to send alert email');
    }
  }

  /**
   * Send alert triggered email with enhanced context
   */
  async sendAlertTriggeredEmail(
    email: string, 
    userName: string | undefined,
    alertContext: {
      cryptoName: string;
      cryptoSymbol: string;
      alertType: any;
      alertDetails: {
        title: string;
        message: string;
        timestamp: Date;
        triggerCount: number;
      };
    }
  ): Promise<void> {
    try {
      await this.getResend().emails.send({
        from: process.env.EMAIL_FROM || 'CryptoSentiment <alerts@cryptosentiment.app>',
        to: email,
        subject: `🚨 ${alertContext.cryptoName} Alert Triggered - CryptoSentiment`,
        html: this.getAlertTriggeredEmailTemplate(userName, alertContext),
      });
    } catch (error) {
      console.error('Failed to send alert triggered email:', error);
      throw new Error('Failed to send alert triggered email');
    }
  }

  /**
   * Send generic notification email
   */
  async sendNotificationEmail(
    email: string,
    userName: string | undefined,
    title: string,
    content: string
  ): Promise<void> {
    try {
      await this.getResend().emails.send({
        from: process.env.EMAIL_FROM || 'CryptoSentiment <noreply@cryptosentiment.app>',
        to: email,
        subject: `CryptoSentiment: ${title}`,
        html: this.getNotificationEmailTemplate(userName, title, content),
      });
    } catch (error) {
      console.error('Failed to send notification email:', error);
      throw new Error('Failed to send notification email');
    }
  }

  /**
   * Magic link email template
   */
  private getMagicLinkEmailTemplate(magicLinkUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign in to CryptoSentiment</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">CryptoSentiment</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Sign in to your account</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">Sign in to CryptoSentiment</h2>
              
              <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px;">
                Click the button below to sign in to your CryptoSentiment account. This link is secure and will expire in 10 minutes.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${magicLinkUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Sign In Now
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                If you didn't request this sign in link, you can safely ignore this email.
              </p>
              
              <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
                This sign in link will expire in 10 minutes for security reasons.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; font-size: 12px; margin: 0;">
                © 2025 CryptoSentiment. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Email verification template
   */
  private getVerificationEmailTemplate(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - CryptoSentiment</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">CryptoSentiment</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">AI-Powered Crypto Analysis</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
              
              <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px;">
                Welcome to CryptoSentiment! Please click the button below to verify your email address and complete your account setup.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                If you didn't create an account with CryptoSentiment, you can safely ignore this email.
              </p>
              
              <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
                This verification link will expire in 24 hours.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; font-size: 12px; margin: 0;">
                © 2025 CryptoSentiment. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Password reset email template
   */
  private getPasswordResetEmailTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - CryptoSentiment</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">CryptoSentiment</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
              
              <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>
              
              <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
                This reset link will expire in 1 hour for security reasons.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; font-size: 12px; margin: 0;">
                © 2025 CryptoSentiment. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Welcome email template
   */
  private getWelcomeEmailTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to CryptoSentiment!</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to CryptoSentiment! 🚀</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">AI-Powered Crypto Analysis Platform</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">Hi ${name}! 👋</h2>
              
              <p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px;">
                Welcome to CryptoSentiment! We're excited to have you join our community of smart crypto investors.
              </p>
              
              <h3 style="color: #2d3748; margin: 30px 0 15px 0; font-size: 18px;">🎯 What you can do now:</h3>
              <ul style="color: #4a5568; margin: 0 0 30px 20px; font-size: 16px;">
                <li style="margin: 0 0 10px 0;">Track your favorite cryptocurrencies</li>
                <li style="margin: 0 0 10px 0;">Get AI-powered sentiment analysis</li>
                <li style="margin: 0 0 10px 0;">Set up price alerts and notifications</li>
                <li style="margin: 0 0 10px 0;">View comprehensive portfolio analytics</li>
              </ul>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Start Tracking Crypto
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                Need help getting started? Check out our <a href="${process.env.NEXTAUTH_URL}/help" style="color: #667eea;">help center</a> or reply to this email.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; font-size: 12px; margin: 0;">
                © 2025 CryptoSentiment. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Alert email template
   */
  private getAlertEmailTemplate(
    cryptoSymbol: string, 
    alertType: string, 
    currentPrice: number, 
    alertDetails: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Crypto Alert - ${cryptoSymbol}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f56565 0%, #c53030 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🚨 Crypto Alert</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">${cryptoSymbol} ${alertType}</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">${cryptoSymbol} Alert Triggered</h2>
              
              <div style="background-color: #fed7d7; border: 1px solid #feb2b2; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
                <p style="color: #742a2a; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">
                  Current Price: $${currentPrice.toLocaleString()}
                </p>
                <p style="color: #742a2a; margin: 0; font-size: 16px;">
                  ${alertDetails}
                </p>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  View Dashboard
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                This alert was sent based on your CryptoSentiment notification preferences. You can manage your alerts in your dashboard.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; font-size: 12px; margin: 0;">
                © 2025 CryptoSentiment. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Enhanced alert triggered email template
   */
  private getAlertTriggeredEmailTemplate(
    userName: string | undefined,
    alertContext: {
      cryptoName: string;
      cryptoSymbol: string;
      alertType: any;
      alertDetails: {
        title: string;
        message: string;
        timestamp: Date;
        triggerCount: number;
      };
    }
  ): string {
    const formatAlertType = (type: any): string => {
      if (typeof type === 'string') return type;
      return type?.toString() || 'Alert';
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>🚨 ${alertContext.cryptoName} Alert Triggered</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f56565 0%, #c53030 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🚨 Alert Triggered</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">${alertContext.cryptoSymbol} ${formatAlertType(alertContext.alertType)}</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              ${userName ? `<h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}! 👋</h2>` : ''}
              
              <p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px;">
                Your alert for <strong>${alertContext.cryptoName} (${alertContext.cryptoSymbol})</strong> has been triggered!
              </p>
              
              <div style="background-color: #fed7d7; border: 1px solid #feb2b2; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #742a2a; margin: 0 0 15px 0; font-size: 18px;">${alertContext.alertDetails.title}</h3>
                <p style="color: #742a2a; margin: 0 0 15px 0; font-size: 16px;">
                  ${alertContext.alertDetails.message}
                </p>
                <div style="font-size: 14px; color: #a0aec0;">
                  <p style="margin: 0;">
                    Triggered: ${alertContext.alertDetails.timestamp.toLocaleString()}
                  </p>
                  <p style="margin: 5px 0 0 0;">
                    Total Triggers: ${alertContext.alertDetails.triggerCount}
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  View Dashboard
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                This alert was sent based on your CryptoSentiment notification preferences. You can manage your alerts and notification settings in your dashboard.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; font-size: 12px; margin: 0;">
                © 2025 CryptoSentiment. All rights reserved.<br>
                <a href="${process.env.NEXTAUTH_URL}/settings" style="color: #667eea; text-decoration: none;">Manage Preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generic notification email template
   */
  private getNotificationEmailTemplate(
    userName: string | undefined,
    title: string,
    content: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CryptoSentiment Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">📊 CryptoSentiment</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Notification</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              ${userName ? `<h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}! 👋</h2>` : ''}
              
              <h3 style="color: #2d3748; margin: 0 0 20px 0; font-size: 20px;">${title}</h3>
              
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #4a5568; margin: 0; font-size: 16px;">
                  ${content}
                </p>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  View Dashboard
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                You're receiving this notification because you have notifications enabled. You can manage your notification preferences in your dashboard.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; font-size: 12px; margin: 0;">
                © 2025 CryptoSentiment. All rights reserved.<br>
                <a href="${process.env.NEXTAUTH_URL}/settings" style="color: #667eea; text-decoration: none;">Manage Preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const resendEmailService = new ResendEmailService();