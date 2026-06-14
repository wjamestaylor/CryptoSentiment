import { type GetServerSidePropsContext } from 'next'
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
  type AuthOptions,
} from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { prisma } from '@/lib/db/prisma'

// Runtime validation flag - set to false during build
let runtimeValidationDone = false;

/**
 * Check if all required email/SMTP environment variables are present
 */
const hasEmailConfig = (): boolean => {
  return !!(
    process.env.EMAIL_SERVER_HOST &&
    process.env.EMAIL_SERVER_PORT &&
    process.env.EMAIL_SERVER_USER &&
    process.env.EMAIL_SERVER_PASSWORD &&
    process.env.EMAIL_FROM
  );
};

/**
 * Validate critical environment variables required for authentication.
 * This runs at runtime (request time) rather than at module import.
 */
const validateCriticalEnvVariables = () => {
  if (runtimeValidationDone || process.env.SKIP_ENV_VALIDATION === 'true') {
    return;
  }

  const criticalVars = {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  };

  const missing = Object.entries(criticalVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for authentication: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.\n' +
      'See .env.example for the complete list of required variables.'
    );
  }

  runtimeValidationDone = true;
};

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role?: string
      // ...other properties
      // role: UserRole;
    } & DefaultSession['user']
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

// Build providers array conditionally
const buildProviders = (): AuthOptions['providers'] => {
  const providers: AuthOptions['providers'] = [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ];

  // Only add EmailProvider if all SMTP environment variables are configured
  if (hasEmailConfig()) {
    providers.push(
      EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST!,
          port: Number(process.env.EMAIL_SERVER_PORT!),
          auth: {
            user: process.env.EMAIL_SERVER_USER!,
            pass: process.env.EMAIL_SERVER_PASSWORD!,
          },
        },
        from: process.env.EMAIL_FROM!,
      })
    );
  }

  return providers;
};

export const authOptions: NextAuthOptions = {
  callbacks: {
    session: async ({ session, user }) => {
      // Validate critical env vars at runtime (first request)
      validateCriticalEnvVariables();

      // Fetch user role from database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });
      
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role: dbUser?.role,
        },
      };
    },
    async signIn() {
      // Validate critical env vars at runtime (first request)
      validateCriticalEnvVariables();
      // Allow all sign-ins for now - we can add restrictions later
      return true;
    },
  },
  adapter: PrismaAdapter(prisma),
  get providers() {
    // Build providers lazily to respect environment variables set in tests
    return buildProviders();
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  session: {
    strategy: 'database',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext['req']
  res: GetServerSidePropsContext['res']
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions)
}