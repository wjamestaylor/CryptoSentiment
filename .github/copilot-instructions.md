# CryptoSentiment AI Development Assistant

## Project Overview
**CryptoSentiment** is a production-ready cryptocurrency sentiment analysis platform built with Next.js 15, TypeScript, and PostgreSQL. The platform combines AI-powered sentiment analysis with real-time crypto data to provide actionable trading insights.

**Tech Stack**: Next.js 15 + App Router, TypeScript, Prisma, PostgreSQL, tRPC, Tailwind CSS + shadcn/ui, Jest, Turbopack  

## Architecture & Patterns

### Service Layer Architecture
```
App Router Pages → tRPC Procedures → Service Classes → External APIs
                ↘ Prisma ORM → PostgreSQL Database
```

**Key Service Classes** (follow these patterns):
- **`CoinGeckoService`**: API client with error handling, optional API key, rate limiting awareness
- **`OpenRouterService`**: AI service with Zod validation, comprehensive prompt building
- **Service Pattern**: Private `request()` method, public domain methods, singleton export

```typescript
export class ApiService {
  private baseUrl = 'https://api.example.com';
  private apiKey?: string;
  
  private async request<T>(endpoint: string): Promise<T> {
    // Standard error handling with logging
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      throw new Error(`API error: ${response.statusText}`);
    }
  }
}
```

### tRPC Router Patterns
All API routes use tRPC for type safety. Pattern: `input` validation → `query`/`mutation` → database operations.

```typescript
export const routerName = createTRPCRouter({
  methodName: publicProcedure
    .input(z.object({ param: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.model.findMany({ where: input });
    }),
});
```

### Testing Patterns
**Established Mock Patterns**:
```typescript
// Service testing with global fetch mock
global.fetch = jest.fn();
const mockFetch = fetch as jest.Mock;

describe('ServiceName', () => {
  beforeEach(() => jest.clearAllMocks());
  
  it('should handle success cases', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    });
    // Test implementation
  });
});
```

**Test Structure**: `/src/__tests__/` mirrors `/src/` structure. Use `jest-mock-extended` for Prisma mocking.

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

## Key File Patterns

### External API Integration
**Location**: `/src/lib/api/` and `/src/services/`
- Use service classes with error handling
- Optional API keys for free tier support
- Zod schemas for response validation
- Comprehensive test coverage (CoinGecko: 95%, OpenRouter: 92%)

### Database Schema (Prisma)
**11 models** including User, Cryptocurrency, SentimentAnalysis, Alert, etc.
- Use `upsert` for crypto data (handles duplicates)
- Proper foreign key relationships
- Enum types for sentiment labels and alert types

### Component Architecture
**shadcn/ui base** + custom extensions in `/src/components/ui/`
- Server/client component separation (Next.js App Router)
- Tailwind CSS with responsive design
- TypeScript interfaces for all props

### Authentication
**NextAuth.js** with database sessions:
- Email and Google providers configured
- Database adapter with Prisma
- Protected tRPC procedures with middleware

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

