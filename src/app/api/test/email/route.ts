import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/services/email/email.service';
import { NotificationService } from '@/services/notifications/notification.service';
import { UserRegistrationService } from '@/services/notifications/user-registration.service';
import { AlertType } from '@prisma/client';

const emailService = new EmailService();
const notificationService = new NotificationService();
const userRegistrationService = new UserRegistrationService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'test-connection':
        return await testEmailConnection();
      
      case 'send-welcome':
        return await sendTestWelcomeEmail(params);
      
      case 'send-alert':
        return await sendTestAlertEmail(params);
      
      case 'send-generic':
        return await sendTestGenericEmail(params);
      
      case 'handle-registration':
        return await testUserRegistration(params);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Available actions: test-connection, send-welcome, send-alert, send-generic, handle-registration' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Email test error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to test email: ${message}` },
      { status: 500 }
    );
  }
}

async function testEmailConnection() {
  const isConnected = await emailService.testConnection();
  
  return NextResponse.json({
    success: isConnected,
    message: isConnected ? 'Email service connection successful' : 'Email service connection failed',
    timestamp: new Date().toISOString(),
  });
}

async function sendTestWelcomeEmail(params: any) {
  const { email, name } = params;
  
  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  const success = await emailService.sendWelcomeEmail(email, name);
  
  return NextResponse.json({
    success,
    message: success ? 'Welcome email sent successfully' : 'Failed to send welcome email',
    email,
    timestamp: new Date().toISOString(),
  });
}

async function sendTestAlertEmail(params: any) {
  const { 
    email, 
    name, 
    cryptoName = 'Bitcoin', 
    cryptoSymbol = 'BTC', 
    alertType = AlertType.SENTIMENT_CHANGE,
    title = 'Test Alert Triggered',
    message = 'This is a test alert notification to verify email functionality.',
    triggerCount = 1
  } = params;
  
  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  const alertEmailData = {
    userEmail: email,
    userName: name,
    cryptoName,
    cryptoSymbol,
    alertType,
    alertDetails: {
      title,
      message,
      timestamp: new Date(),
      triggerCount,
    },
    dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
  };

  const success = await emailService.sendAlertEmail(alertEmailData);
  
  return NextResponse.json({
    success,
    message: success ? 'Alert email sent successfully' : 'Failed to send alert email',
    email,
    alertType,
    timestamp: new Date().toISOString(),
  });
}

async function sendTestGenericEmail(params: any) {
  const { 
    email, 
    subject = 'Test Notification from CryptoSentiment',
    title = 'Test Notification',
    content = 'This is a test notification to verify email functionality.'
  } = params;
  
  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #2563eb;">📊 CryptoSentiment</h1>
        <h2>${title}</h2>
        <p>${content}</p>
        <p><em>This is a test email sent at ${new Date().toLocaleString()}</em></p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
            <p>CryptoSentiment - AI-Powered Cryptocurrency Sentiment Analysis</p>
        </div>
    </div>
</body>
</html>
  `;

  const success = await emailService.sendEmail({
    to: email,
    subject,
    html,
  });
  
  return NextResponse.json({
    success,
    message: success ? 'Generic email sent successfully' : 'Failed to send generic email',
    email,
    subject,
    timestamp: new Date().toISOString(),
  });
}

async function testUserRegistration(params: any) {
  const { userId } = params;
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  const result = await userRegistrationService.handleNewUserRegistration(userId);
  
  return NextResponse.json({
    success: result.success,
    message: 'User registration handling completed',
    userId,
    timestamp: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'Email testing endpoint',
    usage: {
      method: 'POST',
      actions: [
        {
          action: 'test-connection',
          description: 'Test email service connection',
          params: {},
        },
        {
          action: 'send-welcome',
          description: 'Send welcome email',
          params: { email: 'required', name: 'optional' },
        },
        {
          action: 'send-alert',
          description: 'Send alert notification email',
          params: { 
            email: 'required',
            name: 'optional',
            cryptoName: 'optional (default: Bitcoin)',
            cryptoSymbol: 'optional (default: BTC)',
            alertType: 'optional',
            title: 'optional',
            message: 'optional',
            triggerCount: 'optional (default: 1)'
          },
        },
        {
          action: 'send-generic',
          description: 'Send generic notification email',
          params: { 
            email: 'required',
            subject: 'optional',
            title: 'optional',
            content: 'optional'
          },
        },
        {
          action: 'handle-registration',
          description: 'Test user registration flow',
          params: { userId: 'required' },
        },
      ],
    },
    environment: {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasEmailConfig: !!(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER),
      fromEmail: process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@cryptosentiment.com',
    },
  });
}