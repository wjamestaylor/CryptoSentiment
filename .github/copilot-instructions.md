# CryptoSentiment AI Development Assistant

## Project Context & Identity
**CryptoSentiment** is a production-ready cryptocurrency sentiment analysis platform deployed on Railway with Google OAuth authentication. The platform prioritizes **live data accuracy**, **type safety**, and **production reliability**.

**Current Status**: ✅ Google OAuth working, ❌ Email auth disabled (NextAuth issues), 606+ tests passing
**Live URL**: https://lavish-patience-production-f0a0.up.railway.app
**Tech Stack**: Next.js 15 + App Router, TypeScript, Prisma, PostgreSQL, tRPC, Tailwind CSS + shadcn/ui, Jest, Turbopack  
**Core Principle**: NEVER use sample/fake data - all information must come from live APIs

## 🏗️ Architecture Rules

### Service Layer Pattern (MANDATORY)
**Reference**: `/src/services/crypto/coinGecko.service.ts` - Use as template for ALL external API integrations
- Private `request()` method for error handling
- Optional API keys (supports free tiers)
- Zod validation for external responses
- TypeScript generics for return types

### tRPC Integration (REQUIRED)
**Reference**: `/src/server/api/routers/crypto.ts` - Pattern for all API endpoints
- Input validation with Zod schemas
- Use `publicProcedure` for data, `protectedProcedure` for user actions
- Service classes for external APIs (not direct fetch)
- Database operations with Prisma includes

### Testing Strategy (MANDATORY)
**Reference**: `/src/__tests__/services/` - Follow these exact patterns
- Global fetch mocking: `global.fetch = jest.fn()`
- Test success AND error scenarios
- Use `jest-mock-extended` for Prisma
- Current status: 606+ tests, 42 suites, 100% passing

## 🚀 Development Commands

```bash
npm run dev          # Start with Turbopack
npm test             # Run all 606+ tests
npm run db:studio    # Database admin
npm run lint         # ESLint with auto-fix
```

## 🔐 Environment Variables (Required)

```bash
DATABASE_URL="postgresql://..."           # Required
NEXTAUTH_SECRET="your-secret"            # Required  
GOOGLE_CLIENT_ID="google-oauth-id"       # Required (email auth disabled)
GOOGLE_CLIENT_SECRET="google-secret"     # Required
OPENROUTER_API_KEY="sk-or-..."          # AI analysis
COINGECKO_API_KEY="CG-..."              # Crypto data (optional)
```

## ✅ Do This / ❌ Avoid This

**✅ Follow Patterns:**
- Use service classes from `/src/services/` for external APIs
- Follow tRPC patterns from `/src/server/api/routers/`
- Test patterns from `/src/__tests__/services/`
- Component patterns using shadcn/ui + TypeScript interfaces

**❌ Never Do:**
- Use sample/fake data (project policy)
- Skip error handling in services
- Direct database queries in components  
- Commit API keys to version control

## 📚 Detailed References

For comprehensive patterns and examples:
- **[Development Setup](DEVELOPMENT_SETUP.md)**: Environment setup and troubleshooting
- **[Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md)**: Current progress and priorities
- **[Test Coverage Report](docs/TEST_COVERAGE_REPORT.md)**: Testing patterns and coverage metrics
- **[Security Setup](SECURITY-SETUP.md)**: Security patterns and best practices