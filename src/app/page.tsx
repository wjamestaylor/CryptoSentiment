import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Crypto<span className="text-blue-600">Sentiment</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-powered cryptocurrency sentiment analysis combining market data, 
            news sentiment, and whale activity for smarter trading decisions.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/sentiment">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Try AI Analysis
              </Button>
            </Link>
            <Link href="/api/auth/signin">
              <Button variant="outline" size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 AI Sentiment Analysis
              </CardTitle>
              <CardDescription>
                Advanced AI models analyze market sentiment from multiple data sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get real-time sentiment scores powered by OpenRouter AI, 
                combining news analysis, social sentiment, and market data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🐋 Whale Activity Tracking
              </CardTitle>
              <CardDescription>
                Monitor large transactions that move the market
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track whale movements and large transactions that can 
                significantly impact cryptocurrency prices and market sentiment.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Real-time Market Data
              </CardTitle>
              <CardDescription>
                Live cryptocurrency prices and market metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
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
