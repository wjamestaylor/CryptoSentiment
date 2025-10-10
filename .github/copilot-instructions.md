# CryptoSentiment Development Instructions

## Project Overview
CryptoSentiment is a comprehensive cryptocurrency sentiment analysis platform built with Next.js 14, TypeScript, and modern web technologies. The platform provides AI-powered sentiment analysis, real-time price tracking, and notification services for cryptocurrency enthusiasts and traders.

## Development Guidelines

### Code Style and Standards
- Use TypeScript for all code with strict type checking
- Follow ESLint and Prettier configurations
- Use functional components with React hooks
- Implement proper error boundaries and loading states
- Use tRPC for type-safe API communication
- Follow Next.js App Router conventions

### Architecture Patterns
- **Layered Architecture**: Separate concerns between UI, business logic, and data access
- **Repository Pattern**: Abstract data access through repository interfaces
- **Service Layer**: Encapsulate business logic in service classes
- **Event-Driven**: Use event emitters for real-time updates
- **Dependency Injection**: Use containers for service management

### File Organization
```
src/
├── app/                    # Next.js App Router pages and layouts
├── components/             # Reusable UI components
├── lib/                   # Utility functions and configurations
├── services/              # Business logic and external API integrations
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
├── stores/                # State management (Zustand)
├── middleware/            # Next.js middleware
└── styles/                # Global styles and Tailwind configs
```

### API Integration Guidelines
- Use environment variables for all API keys and secrets
- Implement proper rate limiting and error handling
- Use Zod for runtime type validation
- Cache responses appropriately with Redis
- Implement retry logic with exponential backoff
- Log all API interactions for monitoring

### Database Best Practices
- Use Prisma for type-safe database operations
- Implement proper database migrations
- Use database transactions for data consistency
- Index frequently queried fields
- Implement soft deletes for user data
- Use connection pooling for production

### Security Requirements
- Implement CSRF protection
- Use Content Security Policy headers
- Sanitize all user inputs
- Implement rate limiting per user/IP
- Use secure session management
- Encrypt sensitive data at rest
- Implement proper CORS policies

### Performance Optimization
- Use Next.js Image optimization
- Implement proper caching strategies
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Use code splitting and lazy loading
- Optimize bundle size with tree shaking

### Testing Requirements
- Write unit tests for all business logic
- Implement integration tests for API endpoints
- Use React Testing Library for component tests
- Mock external API calls in tests
- Maintain >80% code coverage
- Use end-to-end tests for critical user flows

### Monitoring and Logging
- Implement structured logging
- Use error tracking (Sentry)
- Monitor API performance metrics
- Track user analytics (privacy-compliant)
- Set up health check endpoints
- Implement alerting for critical failures

## Progress Tracking

- [x] ✅ Verify copilot-instructions.md file creation
- [x] ✅ Project requirements clarified
- [x] ✅ Project scaffolded with Next.js
- [ ] 🔄 Customize project structure
- [ ] ⏳ Install required dependencies
- [ ] ⏳ Set up development environment
- [ ] ⏳ Create initial documentation