# Portfolio Import - Security and Privacy Considerations

## Overview
The portfolio import feature allows users to import their cryptocurrency holdings via CSV files or direct exchange API integrations (Coinbase, Binance). This document outlines the security and privacy measures implemented to protect user data.

## Security Measures

### 1. API Credentials Handling

#### Non-Persistent Storage
- **Exchange API credentials are NEVER stored in our database**
- API keys and secrets are only used transiently during the import process
- Credentials exist only in memory during the API request lifecycle
- After import completion, credentials are immediately discarded

#### Recommended API Key Permissions
Users should create **read-only** API keys with minimal permissions:

**Coinbase:**
- Permission: `wallet:accounts:read` (read account balances only)
- No withdrawal, trading, or transfer permissions should be granted

**Binance:**
- Enable Reading only
- Disable Spot & Margin Trading
- Disable Withdrawals
- Disable Futures

#### Secure Transmission
- All API communications use HTTPS/TLS encryption
- API requests are made server-side only (never from client browser)
- Credentials are transmitted using secure POST requests
- No credentials are logged or stored in application logs

### 2. CSV Import Security

#### Input Validation
- All CSV content is validated and sanitized
- Strict parsing rules prevent code injection
- Amount and price fields validated as positive numbers only
- Date fields validated against ISO format
- Symbol fields validated against known cryptocurrency mappings

#### File Upload Limits
- CSV file size limited to prevent DoS attacks
- Maximum row limit enforced
- Content-type validation for uploaded files

### 3. Authentication & Authorization

#### Protected Endpoints
- All import endpoints require user authentication
- Session-based authentication via NextAuth.js
- CSRF protection enabled
- Rate limiting implemented to prevent abuse

#### User Data Isolation
- Imported holdings are always associated with authenticated user
- No cross-user data access possible
- Database queries use user ID filtering

### 4. Input Sanitization

#### Symbol Validation
- Cryptocurrency symbols validated against known mappings
- Unknown symbols trigger warnings but don't fail import
- Prevents injection of malicious asset names

#### Amount & Price Validation
- Numeric validation with positive value constraints
- Prevents negative or invalid amounts
- Floating point precision handling

## Privacy Measures

### 1. Data Minimization
- Only essential fields are required (symbol, amount)
- Optional fields (purchase price, date, notes) are user-controlled
- No PII (Personally Identifiable Information) collected during import

### 2. User Control
- Users can choose which holdings to import (preview before confirm)
- Option to overwrite or preserve existing holdings
- Users can delete imported holdings at any time
- Clear visibility of what data will be imported

### 3. Third-Party Data Sharing
- **Zero third-party data sharing**
- Exchange APIs are called directly, no intermediaries
- Holdings data remains on our servers only
- No analytics or tracking of portfolio contents

### 4. Transparency
- Clear warnings about API credential usage
- Import preview shows exactly what will be saved
- Warnings for unrecognized symbols
- Error messages are informative but don't leak sensitive data

## Best Practices for Users

### 1. API Key Management
✅ **DO:**
- Create read-only API keys specifically for import
- Delete API keys from exchanges after import if no longer needed
- Use API key IP whitelisting if exchange supports it
- Review exchange API activity logs regularly

❌ **DON'T:**
- Share API keys with anyone
- Use API keys with trading or withdrawal permissions
- Leave API keys active indefinitely
- Use the same API key across multiple services

### 2. CSV File Security
✅ **DO:**
- Download CSV template from our app
- Keep CSV files containing financial data encrypted
- Delete CSV files after successful import
- Verify CSV content before upload

❌ **DON'T:**
- Share CSV files via unsecured channels
- Include unnecessary sensitive information in notes field
- Upload CSV files from untrusted sources

### 3. General Security
✅ **DO:**
- Use strong, unique passwords for your account
- Enable two-factor authentication (2FA) on your account
- Log out after import completion on shared devices
- Review imported holdings for accuracy

## Technical Implementation Details

### 1. Server-Side Processing
```typescript
// All exchange API calls are server-side only
const result = await service.fetchHoldings({
  apiKey: input.apiKey,    // Used only for this request
  apiSecret: input.apiSecret, // Never stored
});
// Credentials immediately discarded after use
```

### 2. tRPC Protected Procedures
```typescript
// All endpoints require authentication
importHoldings: protectedProcedure
  .input(importSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id; // Authenticated user only
    // ... import logic
  });
```

### 3. Input Validation
```typescript
// Strict Zod schema validation
.input(z.object({
  holdings: z.array(z.object({
    symbol: z.string(),
    amount: z.number().positive(),
    purchasePrice: z.number().positive().optional(),
    // ... validated fields only
  })),
}))
```

## Compliance Considerations

### GDPR Compliance
- Users have full control over their imported data
- Right to deletion honored (delete holdings anytime)
- Data portability (can export/re-import via CSV)
- No automated decision-making based on portfolio data

### Data Retention
- Imported holdings stored as long as user account is active
- Holdings deleted when user deletes their account
- No backup retention of deleted data beyond standard backup cycles

## Incident Response

### In Case of Suspected Breach
1. Immediately revoke exchange API keys
2. Change account password
3. Review account activity
4. Contact support if suspicious activity detected
5. Monitor exchange account for unauthorized access

### Reporting Security Issues
If you discover a security vulnerability, please email: security@cryptosentiment.com

## Regular Security Audits
- Code reviewed for security vulnerabilities
- Dependency updates applied regularly
- Security scanning in CI/CD pipeline
- Periodic penetration testing (planned)

## Future Enhancements
- [ ] Support for encrypted CSV files
- [ ] OAuth-based exchange authentication (no API keys needed)
- [ ] Import history/audit log
- [ ] Automatic API key expiration warnings
- [ ] Multi-factor authentication for sensitive operations

---

**Last Updated:** 2024-10-25  
**Version:** 1.0  
**Maintained By:** CryptoSentiment Security Team
