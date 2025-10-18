import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin?error=missing-token', request.url));
    }

    // Find magic link token
    const magicToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!magicToken) {
      return NextResponse.redirect(new URL('/auth/signin?error=invalid-token', request.url));
    }

    // Check if token has expired
    if (magicToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.redirect(new URL('/auth/signin?error=expired-token', request.url));
    }

    // Extract email from identifier (format: "magic:email@example.com")
    const email = magicToken.identifier.replace('magic:', '');

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin?error=user-not-found', request.url));
    }

    if (!user.emailVerified) {
      return NextResponse.redirect(new URL('/auth/signin?error=email-not-verified', request.url));
    }

    // Clean up magic link token
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Create a session manually since we're bypassing NextAuth sign in flow
    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    // Create redirect response with session cookie
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // Set session cookie
    redirectResponse.cookies.set('next-auth.session-token', sessionToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return redirectResponse;

  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.redirect(new URL('/auth/signin?error=verification-failed', request.url));
  }
}