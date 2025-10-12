import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-sm sm:max-w-none mx-auto">
            <Link href="/sentiment" className="w-full sm:w-auto">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                Try AI Analysis
              </Button>
            </Link>
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
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

        {/* Current Status */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>🚀 Development Status</CardTitle>
              <CardDescription>
                CryptoSentiment is actively being developed with cutting-edge features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <div className="font-semibold text-green-600">✅ Completed</div>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    <li>• Email Authentication</li>
                    <li>• AI Service Integration</li>
                    <li>• Database Schema</li>
                    <li>• 45% Test Coverage</li>
                  </ul>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-blue-600">🔄 In Progress</div>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    <li>• User Dashboard</li>
                    <li>• Alert System</li>
                    <li>• Subscription Plans</li>
                    <li>• Mobile App</li>
                  </ul>
                </div>
              </div>
              <div className="pt-4">
                <Link href="/dashboard">
                  <Button variant="outline" className="mr-4">
                    View Dashboard
                  </Button>
                </Link>
                <Link href="/sentiment">
                  <Button>
                    Test AI Analysis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
