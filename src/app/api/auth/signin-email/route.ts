import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { randomBytes } from 'crypto';
import { resendEmailService } from '@/services/email/resend.service';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = signInSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address. Please sign up first.' },
        { status: 404 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email address before signing in. Check your inbox for a verification link.' },
        { status: 400 }
      );
    }

    // Generate magic link token
    const magicToken = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store magic link token (reuse verification token table for simplicity)
    await prisma.verificationToken.create({
      data: {
        identifier: `magic:${email.toLowerCase()}`,
        token: magicToken,
        expires,
      },
    });

    // Send magic link email
    const magicLinkUrl = `${process.env.NEXTAUTH_URL}/auth/magic?token=${magicToken}`;
    
    try {
      await resendEmailService.sendMagicLinkEmail(email, magicLinkUrl);
    } catch (error) {
      console.error('Failed to send magic link email:', error);
      // Clean up token if email fails
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: `magic:${email.toLowerCase()}`,
          token: magicToken,
        },
      });
      
      return NextResponse.json(
        { error: 'Failed to send magic link. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Magic link sent! Check your email and click the link to sign in.',
    });

  } catch (error) {
    console.error('Magic link signin error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}