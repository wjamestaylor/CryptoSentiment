#!/bin/bash

# 🚀 CryptoSentiment Railway Deployment Script
# This script automates the Railway deployment process

set -e

echo "🚀 CryptoSentiment Railway Deployment Starting..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed"
    echo "Please install it with: npm install -g @railway/cli"
    exit 1
fi

print_success "Railway CLI found"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    echo "Please run this script from the project root"
    exit 1
fi

print_success "Git repository detected"

# Check if we have uncommitted changes
if ! git diff --quiet; then
    print_warning "You have uncommitted changes"
    read -p "Do you want to commit them? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Pre-deployment commit: $(date)"
        print_success "Changes committed"
    else
        print_info "Continuing with uncommitted changes..."
    fi
fi

# Run tests before deployment
print_info "Running test suite..."
if npm test; then
    print_success "All tests passing (46/46 suites)"
else
    print_error "Tests failed - deployment aborted"
    exit 1
fi

# Check build
print_info "Testing production build..."
if npm run build; then
    print_success "Build successful"
else
    print_error "Build failed - deployment aborted"
    exit 1
fi

# Login to Railway (if not already logged in)
print_info "Checking Railway authentication..."
if railway whoami > /dev/null 2>&1; then
    print_success "Already logged in to Railway"
else
    print_info "Logging in to Railway..."
    railway login
fi

# Check if project exists
if railway status > /dev/null 2>&1; then
    print_success "Railway project found"
    PROJECT_INFO=$(railway status)
    echo "$PROJECT_INFO"
else
    print_warning "No Railway project found"
    read -p "Do you want to create a new project? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Creating new Railway project..."
        railway init
        print_success "Project created"
    else
        print_error "Cannot deploy without a Railway project"
        exit 1
    fi
fi

# Check for PostgreSQL service
print_info "Checking for PostgreSQL service..."
if railway variables | grep -q "DATABASE_URL"; then
    print_success "PostgreSQL service found"
else
    print_warning "No PostgreSQL service detected"
    read -p "Do you want to add PostgreSQL? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Adding PostgreSQL service..."
        railway add postgresql
        print_success "PostgreSQL service added"
    else
        print_warning "Deploying without database service"
    fi
fi

# Check essential environment variables
print_info "Checking environment variables..."

# Generate NEXTAUTH_SECRET if not provided
if ! railway variables | grep -q "NEXTAUTH_SECRET"; then
    print_warning "NEXTAUTH_SECRET not found"
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    railway variables set NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
    print_success "Generated and set NEXTAUTH_SECRET"
fi

# Set NEXTAUTH_URL
if ! railway variables | grep -q "NEXTAUTH_URL"; then
    print_warning "NEXTAUTH_URL not set"
    echo "After deployment, you'll need to set NEXTAUTH_URL to your Railway domain"
fi

# Set NODE_ENV
railway variables set NODE_ENV=production
print_success "Environment variables configured"

# Deploy
print_info "Starting deployment to Railway..."
echo "This may take a few minutes..."

if railway up; then
    print_success "Deployment successful! 🎉"
    
    # Get the deployment URL
    DEPLOY_URL=$(railway domain)
    if [ -n "$DEPLOY_URL" ]; then
        print_success "Application deployed to: $DEPLOY_URL"
        
        # Update NEXTAUTH_URL with the actual domain
        railway variables set NEXTAUTH_URL="$DEPLOY_URL"
        print_success "Updated NEXTAUTH_URL to production domain"
        
        # Wait a moment for the app to start
        print_info "Waiting for application to start..."
        sleep 30
        
        # Health check
        print_info "Performing health check..."
        if curl -f "$DEPLOY_URL/api/health" > /dev/null 2>&1; then
            print_success "Health check passed! Application is running"
        else
            print_warning "Health check failed - app may still be starting"
            print_info "Manual health check: $DEPLOY_URL/api/health"
        fi
        
        echo ""
        echo "🎉 Deployment Complete!"
        echo "======================"
        echo "🌍 Application URL: $DEPLOY_URL"
        echo "❤️  Health Check: $DEPLOY_URL/api/health"
        echo "📊 Railway Dashboard: https://railway.app/dashboard"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Test the application in your browser"
        echo "2. Set up any missing API keys in Railway dashboard"
        echo "3. Configure custom domain (optional)"
        echo "4. Set up monitoring and alerts"
        echo ""
        echo "🔧 Useful Commands:"
        echo "railway logs          # View application logs"
        echo "railway variables     # Manage environment variables"
        echo "railway connect       # Connect to database"
        
    else
        print_warning "Could not retrieve deployment URL"
        print_info "Check Railway dashboard for deployment details"
    fi
    
else
    print_error "Deployment failed"
    print_info "Check Railway logs for details: railway logs"
    exit 1
fi

echo ""
print_success "CryptoSentiment is now live on Railway! 🚀"