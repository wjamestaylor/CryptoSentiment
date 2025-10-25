# 🚀 CryptoSentiment Railway Deployment Guide

*Complete guide for deploying CryptoSentiment to Railway with production-ready configuration*

---

## 📋 **Pre-Deployment Checklist**

### ✅ **1. Railway Setup**
- [ ] Create Railway account at [railway.app](https://railway.app)
- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login to Railway: `railway login`

### ✅ **2. Project Preparation**
- [x] ✅ Railway configuration (`railway.json`) - Ready
- [x] ✅ Docker configuration (`Dockerfile`) - Ready  
- [x] ✅ Health check endpoint (`/api/health`) - Ready
- [x] ✅ Production Next.js config - Ready
- [x] ✅ Database migrations - Ready
- [x] ✅ Test suite passing (46/46 suites) - Ready

---

## 🚀 **Step-by-Step Deployment**

### **Step 1: Set Up Google OAuth Credentials**

**Before deploying**, you need to set up Google OAuth for authentication:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the consent screen if prompted
6. For Application type, select **Web application**
7. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-app.railway.app/api/auth/callback/google`
8. Copy the **Client ID** and **Client Secret** - you'll need these for environment variables

**Important**: Update the production redirect URI after deployment with your actual Railway URL.

### **Step 2: Initialize Railway Project**

```bash
# Navigate to project directory
cd /home/willtaylor/Code/CryptoSentiment

# Initialize Railway project
railway login
railway init

# Select "Create new project"
# Name: cryptosentiment-production
```

### **Step 3: Set Up PostgreSQL Database**

```bash
# Add PostgreSQL service
railway add postgresql

# This will automatically set DATABASE_URL environment variable
```

### **Step 4: Configure Environment Variables**

Set these **required** environment variables in Railway dashboard:

#### **🔐 Essential Variables**
```bash
# Authentication (REQUIRED)
NEXTAUTH_SECRET=your-super-secret-jwt-key-min-32-chars
NEXTAUTH_URL=https://your-app.railway.app

# Google OAuth (REQUIRED for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id-from-console
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-console

# Database (Automatically set by Railway PostgreSQL)
DATABASE_URL=postgresql://...

# Application
NODE_ENV=production
PORT=3000
```

#### **🔌 API Keys (Recommended)**
```bash
# CoinGecko (for crypto data)
COINGECKO_API_KEY=your-coingecko-api-key

# OpenRouter (for AI sentiment analysis) 
OPENROUTER_API_KEY=your-openrouter-api-key

# Email (for notifications)
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com

# Discord Bot (optional)
DISCORD_BOT_TOKEN=your-discord-bot-token

# Telegram Bot (optional) 
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### **Step 5: Deploy Application**

```bash
# Deploy to Railway
railway up

# Monitor deployment
railway logs
```

### **Step 6: Run Database Migrations**

```bash
# After first deployment, run migrations
railway run npx prisma migrate deploy

# Optional: Seed database with initial data
railway run npx prisma db seed
```

---

## 🛠️ **Railway Configuration Details**

### **Build Configuration** (`railway.json`)
```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm ci && npm run build && npx prisma generate"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npm run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 10
  }
}
```

### **Health Check Endpoint**
- **URL**: `https://your-app.railway.app/api/health`
- **Expected Response**: `{"status": "healthy", "database": "connected"}`
- **Timeout**: 300 seconds
- **Retry Policy**: Up to 10 retries on failure

---

## 🔍 **Post-Deployment Verification**

### **1. Health Check**
```bash
# Test health endpoint
curl https://your-app.railway.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-10-13T...",
  "environment": "production", 
  "database": "connected",
  "external_services": {...},
  "uptime": 123.45
}
```

### **2. Application Features**
- [ ] ✅ Homepage loads correctly
- [ ] ✅ Authentication works (sign up/sign in)
- [ ] ✅ Database connection active
- [ ] ✅ Crypto data loading (CoinGecko API)
- [ ] ✅ User dashboard functional
- [ ] ✅ Alert system working
- [ ] ✅ Email notifications sending

### **3. Performance Tests**
```bash
# Test response time
curl -w "@curl-format.txt" -o /dev/null -s https://your-app.railway.app/

# Expected: < 2s response time
```

---

## 📊 **Monitoring & Maintenance**

### **Railway Dashboard Features**
- **📈 Metrics**: CPU, Memory, Network usage
- **📋 Logs**: Real-time application logs  
- **🔄 Deployments**: Auto-deploy on git push
- **🌍 Custom Domains**: Connect your domain
- **📊 Usage**: Track resource consumption

### **Useful Commands**
```bash
# View live logs
railway logs

# Connect to production database
railway connect postgresql

# Run commands in production
railway run <command>

# Scale application
railway up --replicas 2

# Environment variables
railway variables
```

---

## 🚨 **Production Environment Variables**

### **Generate Secure Secrets**
```bash
# Generate NEXTAUTH_SECRET (32+ characters)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(crypto.randomBytes(32).toString('base64'))"
```

### **Environment Variable Priority**
1. **Essential** (App won't work without):
   - `DATABASE_URL` (auto-set by Railway)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

2. **Important** (Recommended for full functionality):
   - `COINGECKO_API_KEY`
   - `OPENROUTER_API_KEY` 
   - `EMAIL_SERVER_*`

3. **Optional** (Enhanced features):
   - `DISCORD_BOT_TOKEN`
   - `TELEGRAM_BOT_TOKEN`

---

## 🔒 **Security Considerations**

### **Production Security**
- ✅ **HTTPS**: Automatically enabled by Railway
- ✅ **Security Headers**: Configured in `next.config.ts`
- ✅ **Database**: Secured PostgreSQL with connection pooling
- ✅ **Environment Variables**: Encrypted storage in Railway
- ✅ **Rate Limiting**: Built into API services
- ✅ **Input Validation**: Zod schemas for all APIs

### **Best Practices**
- 🔐 Use strong `NEXTAUTH_SECRET` (32+ characters)
- 🌍 Set correct `NEXTAUTH_URL` for production domain
- 📧 Use production email service (Resend/SendGrid)
- 🔑 Rotate API keys periodically
- 📋 Monitor application logs regularly

---

## 🎯 **Custom Domain Setup** (Optional)

### **Connect Your Domain**
1. Go to Railway dashboard → Settings → Domains
2. Click "Custom Domain"
3. Enter your domain (e.g., `cryptosentiment.com`)
4. Update DNS records as instructed
5. Update `NEXTAUTH_URL` environment variable

### **DNS Configuration**
```
Type: CNAME
Name: @
Value: your-app.railway.app
```

---

## 📈 **Scaling & Performance**

### **Automatic Scaling**
Railway automatically scales based on:
- **CPU Usage**: Auto-scale up when >80% usage
- **Memory**: Up to 8GB RAM available
- **Traffic**: Handle thousands of concurrent users

### **Performance Optimizations**
- ✅ **Next.js Standalone**: Optimized production builds
- ✅ **Image Optimization**: Automatic image compression
- ✅ **Static Assets**: CDN-delivered static files
- ✅ **Database Connection Pooling**: Efficient PostgreSQL usage
- ✅ **API Rate Limiting**: Prevents abuse and ensures stability

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Check build logs
railway logs --service web

# Common fixes:
# 1. Ensure all dependencies in package.json
# 2. Check TypeScript compilation
# 3. Verify Prisma schema is valid
```

#### **Database Connection Issues**
```bash
# Verify DATABASE_URL is set
railway variables

# Test database connection
railway connect postgresql
```

#### **Authentication Issues**
```bash
# Verify all auth environment variables are set
railway variables | grep -E "(NEXTAUTH|GOOGLE|EMAIL)"

# Common fixes:
# 1. Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
# 2. Verify NEXTAUTH_URL matches your Railway domain
# 3. Check Google OAuth redirect URIs include your Railway URL
# 4. Confirm NEXTAUTH_SECRET is at least 32 characters
```

**Google OAuth Setup:**
- Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Update authorized redirect URIs to include: `https://your-app.railway.app/api/auth/callback/google`
- Ensure OAuth consent screen is configured
- Verify Client ID and Client Secret are correctly copied to Railway environment variables

#### **Environment Variable Issues**
```bash
# List all variables
railway variables

# Set missing variables
railway variables set NEXTAUTH_SECRET=your-secret
```

#### **Health Check Failures**
```bash
# Test health endpoint locally
npm run dev
curl http://localhost:3000/api/health

# Check production health
curl https://your-app.railway.app/api/health
```

---

## 🎉 **Success Checklist**

After deployment, verify:

- [ ] ✅ **Application Loads**: Homepage accessible
- [ ] ✅ **Authentication**: Sign up/sign in working  
- [ ] ✅ **Database**: User data persisting
- [ ] ✅ **APIs**: Crypto data loading
- [ ] ✅ **Health Check**: `/api/health` returns healthy
- [ ] ✅ **Performance**: < 2s page load times
- [ ] ✅ **Mobile**: Responsive design working
- [ ] ✅ **Email**: Notifications sending (if configured)
- [ ] ✅ **Monitoring**: Railway metrics showing

---

## 📞 **Support Resources**

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Prisma on Railway**: [railway.app/template/prisma-postgres](https://railway.app/template/prisma-postgres)

---

**🚀 Ready for Production!** Your CryptoSentiment platform is now live and scalable on Railway.