import { type NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/services/email/email.service';

/**
 * Test email functionality endpoint
 * POST /api/test/email-config
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address required' },
        { status: 400 }
      );
    }

    // Test email service configuration
    const emailService = new EmailService();
    
    // Check connection
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        error: 'Email service connection failed - check configuration',
        details: 'Verify RESEND_API_KEY or SMTP settings'
      }, { status: 500 });
    }

    // Send test email
    const testEmail = await emailService.sendEmail({
      to: email,
      subject: '✅ CryptoSentiment Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📊 CryptoSentiment Email Test</h2>
          <p>Congratulations! Your email configuration is working correctly.</p>
          <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>✅ Email service:</strong> Connected successfully</p>
            <p><strong>📧 Test email:</strong> Delivered to ${email}</p>
            <p><strong>🕐 Sent at:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Your authentication system is ready for production use!</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This is a test email from your CryptoSentiment application.<br>
            If you didn't request this test, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `CryptoSentiment Email Test

Congratulations! Your email configuration is working correctly.

✅ Email service: Connected successfully  
📧 Test email: Delivered to ${email}
🕐 Sent at: ${new Date().toLocaleString()}

Your authentication system is ready for production use!`
    });

    if (testEmail) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        details: {
          recipient: email,
          timestamp: new Date().toISOString(),
          service: process.env.RESEND_API_KEY ? 'Resend' : 'SMTP'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        details: 'Check email service logs for more information'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Email test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Email test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      configuration: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasSmtpHost: !!process.env.EMAIL_SERVER_HOST,
        hasSmtpUser: !!process.env.EMAIL_SERVER_USER,
        fromEmail: process.env.FROM_EMAIL || process.env.EMAIL_FROM
      }
    }, { status: 500 });
  }
}

/**
 * Get email configuration status
 * GET /api/test/email-config  
 */
export async function GET() {
  try {
    const config = {
      emailConfigured: !!(process.env.RESEND_API_KEY || 
        (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER)),
      provider: process.env.RESEND_API_KEY ? 'Resend' : 
        process.env.EMAIL_SERVER_HOST ? 'SMTP' : 'None',
      fromEmail: process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'Not configured',
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasSmtpConfig: !!(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER),
    };

    return NextResponse.json({
      success: true,
      configuration: config,
      ready: config.emailConfigured
    });
  } catch (error) {
    console.error('Email config check error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check email configuration'
    }, { status: 500 });
  }
}