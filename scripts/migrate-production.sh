#!/bin/bash

# 🚀 CryptoSentiment Production Migration Script
# Apply database migrations to Railway production

set -e

echo "🗄️ CryptoSentiment Production Migration"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed"
    echo "Please install it with: npm install -g @railway/cli"
    exit 1
fi

print_success "Railway CLI found"

# Check Railway connection
if ! railway status > /dev/null 2>&1; then
    print_error "Not connected to Railway project"
    echo "Please run: railway login && railway link"
    exit 1
fi

print_success "Connected to Railway project"

# Get current project info
PROJECT_INFO=$(railway status)
echo "$PROJECT_INFO"

print_info "Starting migration deployment process..."

# Method 1: Try direct migration deployment
print_info "Attempting direct migration deployment..."
if railway run npx prisma migrate deploy; then
    print_success "Migrations deployed successfully via direct method!"
else
    print_warning "Direct migration failed, trying alternative method..."
    
    # Method 2: Deploy with migration in startup command
    print_info "Deploying application with migrations in startup..."
    if railway up; then
        print_success "Application deployed! Migrations should be applied on startup."
        
        # Wait for deployment to complete
        print_info "Waiting for deployment to stabilize..."
        sleep 30
        
        # Check health endpoint
        print_info "Checking application health..."
        DEPLOY_URL=$(railway variables | grep NEXTAUTH_URL | cut -d'│' -f3 | xargs)
        
        if [ -n "$DEPLOY_URL" ]; then
            if curl -f "$DEPLOY_URL/api/health" > /dev/null 2>&1; then
                print_success "Application is healthy after migration!"
            else
                print_warning "Health check failed - check logs for migration status"
            fi
        fi
    else
        print_error "Deployment failed"
        exit 1
    fi
fi

# Check for any migration-related logs
print_info "Checking recent logs for migration status..."
railway logs --tail 20 | grep -i "migrat\|prisma" || print_info "No migration logs found in recent output"

print_success "Migration deployment process completed!"
echo ""
print_info "Next steps:"
echo "1. Check Railway logs: railway logs"
echo "2. Verify health: curl $DEPLOY_URL/api/health"
echo "3. Test Stripe integration on production"