# CryptoSentiment AI Development Assistant

## Project Overview
**CryptoSentiment** is a production-ready cryptocurrency sentiment analysis platform that prioritizes **live data accuracy** and **type safety**. The platform combines AI-powered sentiment analysis with real-time crypto data to provide actionable trading insights.

**Tech Stack**: Next.js 15 + App Router, TypeScript, Prisma, PostgreSQL, tRPC, Tailwind CSS + shadcn/ui, Jest, Turbopack  
**Key Principle**: Never use sample/fake data - all information must come from live APIs

## Architecture & Critical Patterns

### Service Layer (Key: `/src/services/crypto/price.service.ts`, `/src/lib/api/openrouter.ts`)
**Why**: Centralized API management with consistent error handling and rate limiting
```
App Router → tRPC → Service Classes → External APIs
          ↘ Prisma → PostgreSQL
```

**Required Pattern**: All external APIs use service classes with:
- Private `request()` method for error handling
- Optional API keys (supports free tiers)
- Zod validation for responses
- Comprehensive logging

```typescript
// Follow this pattern from CoinGeckoService
export class ApiService {
  private async request<T>(endpoint: string): Promise<T> {
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      throw new Error(`API error: ${response.statusText}`);
    }
  }
}
```

### tRPC Integration (Key: `/src/server/api/routers/`)
**Why**: End-to-end type safety from database to UI components
- Pattern: `input` validation → `query`/`mutation` → Prisma operations
- Use `publicProcedure` for data fetching, `protectedProcedure` for user actions
- Always include error handling in procedures

### Testing Strategy (Key: `/src/__tests__/services/`)
**Why**: 45.38% coverage ensures reliability; services have 95%+ coverage as reference

**Critical Pattern**: Global fetch mocking for all service tests
```typescript
// Standard in all service tests
global.fetch = jest.fn();
const mockFetch = fetch as jest.Mock;

describe('ServiceName', () => {
  beforeEach(() => jest.clearAllMocks());
  // Always test both success AND error cases
});
```

**Database Testing**: Use `jest-mock-extended` for Prisma (see `/src/__tests__/database/prisma.test.ts`)

## Development Workflows

### Essential Commands
```bash
# Development with Turbopack
npm run dev                 # Start dev server (Next.js 15 + Turbopack)

# Database operations
npm run db:generate        # Generate Prisma client
npm run db:push           # Push schema to DB (development)
npm run db:migrate        # Run migrations (production)
npm run db:studio         # Open Prisma Studio

# Testing
npm test                  # Run Jest tests
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report

# Code quality
npm run lint              # ESLint with auto-fix
npm run type-check        # TypeScript compilation check
```

### Environment Setup
**Required**: Copy `.env.template` to `.env.local` and configure:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Authentication secret
- `OPENROUTER_API_KEY`: AI sentiment analysis (optional for development)
- `COINGECKO_API_KEY`: Crypto data (optional, free tier available)

## Critical File Patterns

### API Integration (Key: Follow `CoinGeckoService` pattern)
**Location**: `/src/services/` for business logic, `/src/lib/api/` for clients
- Service classes with private `request()` method
- Optional API keys (free tier support crucial)
- Zod validation for ALL external responses
- Error logging with URL and status codes

### Database Operations (Key: Follow Prisma patterns in `/src/server/api/routers/`)
**Why**: 11 models with complex relationships require careful handling
- Use `upsert` for cryptocurrency data (prevents duplicates)
- Include related data with `include` for UI needs
- Protect user operations with `protectedProcedure`

### Component Architecture (Key: shadcn/ui + project customs)
**Location**: `/src/components/ui/` for base, `/src/components/` for features
- Server components for data fetching, client for interactions
- TypeScript interfaces for ALL props
- Responsive design with Tailwind classes

## Testing Strategy

### High Coverage Areas (Follow These Patterns)
- **Services**: 95%+ coverage - comprehensive API mocking, error scenarios
- **Utilities**: 100% coverage - format functions, type guards  
- **Components**: 89%+ coverage - React Testing Library, user interactions
- **Database**: 100% coverage - Prisma operations with `jest-mock-extended`

### Priority Testing Patterns
1. **Mock external APIs** globally: `global.fetch = jest.fn()`
2. **Test error scenarios**: Network failures, invalid responses
3. **Validate TypeScript types**: Zod schema testing
4. **Database operations**: Mock Prisma with proper types

## Common Patterns & Anti-Patterns

### ✅ Do This
- Use `coinGeckoService.getTopCryptos()` for live crypto data
- Validate API responses with Zod schemas
- Include comprehensive error handling in services
- Use tRPC for type-safe client-server communication
- Test both success and error scenarios

### ❌ Avoid This
- Never use sample/fake data (project policy)
- Don't skip error handling in API services
- Avoid direct database queries in components
- Don't test implementation details
- Never commit API keys to version control

## Code Generation Guidelines

When generating code:
1. **Follow established service patterns** from `CoinGeckoService`/`OpenRouterService`
2. **Include comprehensive tests** with proper mocking strategies
3. **Use strict TypeScript** with Zod validation for external data
4. **Implement proper error handling** with logging and graceful failures
5. **Consider rate limiting** for external API calls
6. **Test edge cases** including network failures and invalid responses

The codebase is production-ready with live data integration, comprehensive service layer testing, and type-safe APIs throughout the stack.