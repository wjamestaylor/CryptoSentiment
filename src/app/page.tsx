'use client';

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthAwareContent, AuthAwareCTA } from "@/components";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Crypto<span className="text-blue-600">Sentiment</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            AI-powered cryptocurrency sentiment analysis combining market data, 
            news sentiment, and whale activity for smarter trading decisions.
          </p>
          <AuthAwareContent />
          <div className="mt-4">
            <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-medium">
              View Pricing Plans →
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                🤖 AI Sentiment Analysis
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Advanced AI models analyze market sentiment from multiple data sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Get real-time sentiment scores powered by OpenRouter AI, 
                combining news analysis, social sentiment, and market data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                🐋 Whale Activity Tracking
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Monitor large transactions that move the market
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Track whale movements and large transactions that can 
                significantly impact cryptocurrency prices and market sentiment.
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                📊 Real-time Market Data
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Live cryptocurrency prices and market metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Access real-time price data, volume, market cap, and technical 
                indicators for comprehensive market analysis.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-3xl mx-auto bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Ready to Make Smarter Crypto Decisions? 🚀</CardTitle>
              <CardDescription>
                Join traders using AI-powered sentiment analysis for better market insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-green-600 text-lg">Free</div>
                  <div className="text-gray-600 dark:text-gray-300">10 AI analyses</div>
                  <div className="text-gray-600 dark:text-gray-300">10 watchlist coins</div>
                </div>
                <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg border-2 border-blue-400">
                  <div className="font-bold text-blue-600 text-lg">Pro - $9/month</div>
                  <div className="text-gray-600 dark:text-gray-300">100 AI analyses</div>
                  <div className="text-gray-600 dark:text-gray-300">50 coins + bot alerts</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-purple-600 text-lg">Business - $29/month</div>
                  <div className="text-gray-600 dark:text-gray-300">500 AI analyses</div>
                  <div className="text-gray-600 dark:text-gray-300">Unlimited + API access</div>
                </div>
              </div>
              <AuthAwareCTA />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No credit card required • 30-day free trial • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
