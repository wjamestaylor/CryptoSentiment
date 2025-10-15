#!/bin/sh

# Exit on any error
set -e

echo "Starting CryptoSentiment application..."

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting Next.js server..."
exec node server.js