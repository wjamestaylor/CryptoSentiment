import { NextRequest, NextResponse } from 'next/server';

/**
 * Mobile Google OAuth callback endpoint
 * Exchanges authorization code for access tokens and user info
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Exchange code for tokens with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: 'cryptosentiment://', // Mobile app redirect URI
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to exchange authorization code' },
        { status: 400 }
      );
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to get user info' },
        { status: 400 }
      );
    }

    const userInfo = await userInfoResponse.json();

    // Here you would typically:
    // 1. Check if user exists in database
    // 2. Create user if they don't exist
    // 3. Generate your own JWT token for the mobile app
    // 4. Return user data and tokens

    // For now, returning user info and Google tokens
    return NextResponse.json({
      success: true,
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        image: userInfo.picture,
      },
    });
  } catch (error) {
    console.error('Mobile OAuth error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
