import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { resendEmailService } from '@/services/email/resend.service';
import { randomBytes } from 'crypto';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = signUpSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 400 }
        );
      } else {
        // User exists but not verified - resend verification
        const verificationToken = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verificationToken.upsert({
          where: {
            identifier_token: {
              identifier: email.toLowerCase(),
              token: verificationToken,
            },
          },
          update: {
            expires,
          },
          create: {
            identifier: email.toLowerCase(),
            token: verificationToken,
            expires,
          },
        });

        await resendEmailService.sendVerificationEmail(email, verificationToken);

        return NextResponse.json({
          message: 'Verification email sent! Please check your inbox.',
        });
      }
    }

    // Create new user (unverified)
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        emailVerified: null,
      },
    });

    // Create verification token
    const verificationToken = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: verificationToken,
        expires,
      },
    });

    // Send verification email
    await resendEmailService.sendVerificationEmail(email, verificationToken);

    return NextResponse.json({
      message: 'Account created! Please check your email to verify your account.',
    });

  } catch (error) {
    console.error('Email signup error:', error);

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