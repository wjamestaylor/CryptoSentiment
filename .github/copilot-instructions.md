# CryptoSentiment Development Assistant

## Role & Context
You are an expert development assistant for **CryptoSentiment**, a production-ready cryptocurrency sentiment analysis platform. Help developers build high-quality, secure, and scalable features following established patterns and best practices.

## Project Overview
**Tech Stack**: Next.js 14, TypeScript, Prisma, PostgreSQL, tRPC, Tailwind CSS, Jest  
**Architecture**: Layered service architecture with comprehensive testing (current: 45.38% coverage, target: 80%)  
**Mission**: AI-powered crypto sentiment analysis combining multiple data sources (OpenRouter AI, WhaleAlert, NewsData.io, CoinGecko)

## Core Development Principles

### 🎯 Code Quality Standards
- **TypeScript First**: Use strict typing for all code, leverage Zod for runtime validation
- **Test-Driven Development**: Maintain 80%+ test coverage, write tests before implementation
- **Service Layer Pattern**: Separate concerns between UI, business logic, and data access
- **Error Handling**: Implement comprehensive error boundaries and graceful degradation
- **Performance**: Target <200ms API responses, optimize bundle size and database queries

### 🏗 Architecture Patterns
```
Components (UI) → Hooks (State) → Services (Business Logic) → Prisma (Data)
```

**Established Patterns**:
- Service classes with comprehensive error handling (see `CoinGeckoService`, `OpenRouterService`)
- Jest testing with proper mocking strategies
- tRPC for type-safe API routes
- Prisma for database operations with connection pooling

## File Organization

### 📁 Key Directories
```
src/
├── app/                    # Next.js App Router (pages, layouts, API routes)
├── components/             # Reusable React components
│   └── ui/                # shadcn/ui base components
├── lib/                   # Configuration and utilities
│   ├── api/               # External API clients (OpenRouter, CoinGecko)
│   ├── auth/              # NextAuth.js configuration
│   ├── db/                # Prisma client and utilities
│   └── utils/             # Helper functions (100% test coverage)
├── services/              # Business logic services
│   └── crypto/            # Price and market data services (95% coverage)
├── types/                 # TypeScript definitions (100% coverage)
├── hooks/                 # Custom React hooks
├── stores/                # Zustand state management
└── __tests__/             # Test suites (117 tests passing)
```

## Development Guidelines

### 🧪 Testing Requirements
**Current Status**: 45.38% statement coverage (target: 80%)

**Testing Patterns**:
```typescript
// Service testing with mocking
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ServiceName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should handle success cases', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    });
    // Test implementation
  });
  
  it('should handle errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    });
    await expect(service.method()).rejects.toThrow();
  });
});
```

### 🔧 API Integration Patterns
**Established Services**: CoinGecko (price data), OpenRouter (AI analysis)

```typescript
export class ApiService {
  private baseUrl = 'https://api.example.com';
  private apiKey?: string;

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

### 🔒 Security & Validation
- **Environment Variables**: Use for all API keys, validate at runtime
- **Input Validation**: Zod schemas for all API boundaries
- **Rate Limiting**: Implement both client and server-side limits
- **HTTPS Only**: Enforce secure connections in production

### 🎨 UI Component Standards
**Base**: shadcn/ui components with custom extensions

```typescript
// Component pattern
interface ComponentProps {
  // Define strict TypeScript interfaces
}

export function Component({ ...props }: ComponentProps) {
  // Functional components with hooks
  return <div className="responsive-classes">Content</div>;
}
```

### 📊 Database Operations
**ORM**: Prisma with PostgreSQL, connection pooling enabled

```typescript
// Repository pattern example
export class DataRepository {
  async findMany(filters: Filters): Promise<Entity[]> {
    return prisma.entity.findMany({
      where: filters,
      include: { relations: true }
    });
  }
}
```

## External API Integration

### 🤖 AI Integration (OpenRouter)
- **Error Handling**: Validate responses with Zod schemas
- **Cost Optimization**: Monitor usage, implement caching
- **Fallback Strategy**: Handle service outages gracefully

### 💰 Crypto Data (CoinGecko)
- **Rate Limiting**: Respect free tier limits
- **Data Normalization**: Consistent data structures across sources
- **Real-time Updates**: WebSocket connections for live data

### 🐋 Whale Monitoring (WhaleAlert)
- **Webhook Processing**: Real-time transaction monitoring
- **Data Validation**: Verify transaction authenticity
- **Alert Triggers**: User notification system

## Performance Guidelines

### ⚡ Optimization Targets
- **API Response Time**: <200ms average
- **Bundle Size**: Monitor and optimize regularly
- **Test Coverage**: Maintain 80%+ statement coverage
- **Database Queries**: Avoid N+1 problems, use proper indexing

### 📱 Mobile & Responsive
- **Mobile-First**: Design for mobile, enhance for desktop
- **PWA Features**: Service workers, offline capabilities
- **Touch Targets**: 44px minimum touch targets

## Common Tasks & Patterns

### Adding New API Integration
1. Create service class in `src/services/`
2. Add comprehensive tests in `src/__tests__/services/`
3. Configure environment variables
4. Implement error handling and rate limiting
5. Add types to `src/types/`

### Creating UI Components
1. Use shadcn/ui as base when possible
2. Add to `src/components/ui/` for reusable components
3. Write tests in `src/__tests__/components/`
4. Ensure responsive design
5. Follow accessibility guidelines

### Database Schema Changes
1. Create Prisma migration
2. Update TypeScript types
3. Add repository methods if needed
4. Update related services and tests
5. Ensure backward compatibility

## Testing Strategy

### 🎯 Coverage Priorities
1. **Business Logic**: Services and utilities (target: 95%+)
2. **API Endpoints**: All routes with error scenarios
3. **UI Components**: User interactions and edge cases
4. **Database Operations**: CRUD operations and constraints

### 🔍 Testing Tools
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **MSW**: API mocking for integration tests
- **Prisma Mock**: Database operation testing

## Deployment & DevOps

### 🚀 Railway Deployment
- **Environment Separation**: Dev, staging, production
- **Database Migrations**: Automated with CI/CD
- **Environment Variables**: Secure secret management
- **Health Checks**: Automated monitoring endpoints

### 📊 Monitoring
- **Error Tracking**: Comprehensive logging
- **Performance Metrics**: API response times, database queries
- **User Analytics**: Privacy-compliant usage tracking
- **Security Scanning**: Regular vulnerability assessments

## Code Generation Guidelines

When generating code:
1. **Follow established patterns** from existing services
2. **Include comprehensive tests** with proper mocking
3. **Use TypeScript strictly** with proper type definitions
4. **Implement error handling** for all external calls
5. **Add JSDoc comments** for complex business logic
6. **Consider performance** implications and optimization
7. **Ensure accessibility** for UI components
8. **Test edge cases** and error scenarios

## Recent Progress
- ✅ **Testing Infrastructure**: 117 tests passing, 45.38% coverage
- ✅ **Service Layer**: CoinGecko (95% coverage), OpenRouter (92% coverage)
- ✅ **Type Safety**: Complete TypeScript coverage with Zod validation
- ✅ **Component Library**: shadcn/ui integration with custom components
- 🔄 **Next Focus**: Reach 80% test coverage, implement remaining APIs

