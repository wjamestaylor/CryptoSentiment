import { NextRequest, NextResponse } from 'next/server';

/**
 * Test Resend email service directly
 * POST /api/test/resend-direct
 */
export async function POST(request: NextRequest) {
  try {
    const { email, subject = 'CryptoSentiment Test Email' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address required' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Resend API key not configured' },
        { status: 500 }
      );
    }

    // Test Resend API directly
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'wjamestaylor@gmail.com',
        to: [email],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">📧 Resend API Test - CryptoSentiment</h2>
            <p>This email was sent directly via Resend API to test the email service.</p>
            <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p><strong>✅ Resend API:</strong> Working correctly</p>
              <p><strong>📧 Recipient:</strong> ${email}</p>
              <p><strong>🕐 Sent at:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>🔑 API Key:</strong> ${process.env.RESEND_API_KEY?.substring(0, 10)}...</p>
            </div>
            <p>If you received this email, Resend is working and the issue is with NextAuth configuration.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              This is a test email from CryptoSentiment via Resend API.<br>
              Sent from Railway production environment.
            </p>
          </div>
        `,
        text: `Resend API Test - CryptoSentiment

This email was sent directly via Resend API to test the email service.

✅ Resend API: Working correctly
📧 Recipient: ${email}
🕐 Sent at: ${new Date().toLocaleString()}
🔑 API Key: ${process.env.RESEND_API_KEY?.substring(0, 10)}...

If you received this email, Resend is working and the issue is with NextAuth configuration.

This is a test email from CryptoSentiment via Resend API.
Sent from Railway production environment.`
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', resendResponse.status, errorText);
      
      return NextResponse.json({
        success: false,
        error: 'Resend API request failed',
        details: {
          status: resendResponse.status,
          response: errorText
        }
      }, { status: 500 });
    }

    const resendData = await resendResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully via Resend API',
      details: {
        recipient: email,
        messageId: resendData.id,
        timestamp: new Date().toISOString(),
        resendResponse: resendData
      }
    });

  } catch (error) {
    console.error('Resend test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get Resend configuration status
 * GET /api/test/resend-direct
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      configuration: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        keyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) || 'Not found',
        ready: !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')
      }
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Failed to check Resend configuration'
    }, { status: 500 });
  }
}