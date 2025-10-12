#!/bin/bash

# CryptoSentiment Production Deployment Script
# This script handles the complete deployment process

set -e

echo "🚀 Starting CryptoSentiment Production Deployment..."

# Check if required environment variables are set
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ Error: Environment variable $1 is not set"
        exit 1
    fi
}

echo "📋 Checking environment variables..."
check_env_var "DATABASE_URL"
check_env_var "NEXTAUTH_SECRET"
check_env_var "NEXTAUTH_URL"

echo "✅ Environment variables validated"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Run tests to ensure everything is working
echo "🧪 Running tests..."
npm test

# Build the application
echo "🏗️ Building application..."
npm run build

# Test the production build
echo "🔍 Testing production build..."
npm run start &
SERVER_PID=$!

# Wait for server to start
sleep 10

# Health check
echo "❤️ Performing health check..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    kill $SERVER_PID
    exit 1
fi

# Stop test server
kill $SERVER_PID

echo "🎉 Deployment completed successfully!"
echo "📝 Next steps:"
echo "   1. Deploy to your hosting provider"
echo "   2. Set up monitoring"
echo "   3. Configure domain and SSL"
echo "   4. Set up backup schedules"

echo ""
echo "🔗 Useful commands:"
echo "   npm run start                 - Start production server"
echo "   npx prisma studio            - Database management"
echo "   npx prisma migrate reset     - Reset database (DESTRUCTIVE)"
echo "   npm run test                 - Run test suite"