# CoinGecko API Setup Guide

## The Problem
Your dashboard is failing because you're hitting CoinGecko's free tier rate limits. The current `COINGECKO_API_KEY` in your `.env.local` is set to a placeholder value, which means you're using the severely rate-limited public API.

## Quick Fix (Implemented)
I've implemented the following improvements to handle rate limiting better:

### 1. Smart Rate Limiting
- 1.2 second delays between requests for free tier
- Automatic retry with exponential backoff for 429 errors
- 30-second response caching to reduce API calls

### 2. Error Recovery
- Dashboard continues to work even if price API fails
- Graceful fallbacks to show invested amounts without current prices
- Portfolio data loads with zero current values instead of crashing

### 3. Optimized API Usage
- Batch price requests where possible
- Cache responses to minimize duplicate calls
- Only use API key if it's not a placeholder

## Long-term Solution: Get a Real API Key

### Step 1: Sign up for CoinGecko API
1. Visit: https://www.coingecko.com/en/api
2. Click "Get Your API Key"
3. Sign up for a free account
4. Choose the "Developer" plan (free with higher limits)

### Step 2: Get Your API Key
1. Log into your CoinGecko account
2. Go to your API dashboard
3. Copy your API key (starts with "CG-")

### Step 3: Update Your Environment
1. Open `/home/willtaylor/Code/CryptoSentiment/.env.local`
2. Replace the placeholder:
   ```bash
   # Change this:
   COINGECKO_API_KEY="your-coingecko-api-key"
   
   # To your real key:
   COINGECKO_API_KEY="CG-your-actual-api-key-here"
   ```
3. Restart your development server

### Step 4: Update Production (Railway)
1. Go to your Railway dashboard
2. Select your CryptoSentiment project
3. Go to Variables tab
4. Update `COINGECKO_API_KEY` with your real key
5. Redeploy

## API Rate Limits Comparison

### Free Tier (No API Key)
- **10-30 calls/minute** 
- Frequent 429 errors
- Unreliable for production

### Developer Plan (Free with API Key)
- **10,000 calls/month**
- **100 calls/minute**
- Much more reliable
- Perfect for your app's usage

### Pro Plan ($129/month)
- **500,000 calls/month**
- **1,000 calls/minute**
- Commercial usage
- Only needed for high-traffic apps

## Testing the Fix

The improvements I made should help your dashboard work better even without an API key:

1. **Slower but More Reliable**: Requests are spaced out to avoid rate limits
2. **Cached Responses**: Reduces duplicate API calls
3. **Graceful Failures**: Dashboard shows invested amounts even if prices fail
4. **Automatic Retries**: Handles temporary 429 errors

## Next Steps

1. **Immediate**: The current improvements should make your dashboard more stable
2. **This Week**: Get a free CoinGecko API key for much better reliability
3. **Future**: Consider upgrading if you get many users

Your dashboard should now load your portfolio/watchlist data, even if current prices aren't available due to rate limits.