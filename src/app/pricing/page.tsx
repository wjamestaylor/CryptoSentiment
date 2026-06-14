"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Users, Bot, BarChart3, Bell, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PricingTier {
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  features: {
    aiAnalyses: number | 'unlimited';
    watchlist: number | 'unlimited';
    alerts: number | 'unlimited';
    bots: string[];
    historical: string;
    support: string;
    additional: string[];
  };
  stripePriceId: string;
  popular?: boolean;
  buttonText: string;
  buttonVariant: 'default' | 'outline' | 'secondary';
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Perfect for getting started with crypto sentiment analysis',
    features: {
      aiAnalyses: 5,
      watchlist: 10,
      alerts: 5,
      bots: [],
      historical: 'None',
      support: 'Community',
      additional: [
        'Email notifications',
        'Basic dashboard',
        'Price & sentiment alerts only'
      ]
    },
    stripePriceId: '',
    buttonText: 'Current Plan',
    buttonVariant: 'outline'
  },
  {
    name: 'Pro',
    price: 9,
    interval: 'month',
    description: 'Everything you need for serious crypto trading',
    features: {
      aiAnalyses: 100,
      watchlist: 100,
      alerts: 50,
      bots: ['Discord OR Telegram'],
      historical: '7 days',
      support: 'Email support',
      additional: [
        'All alert types',
        'Priority analysis queue',
        'No ads',
        'Advanced dashboard'
      ]
    },
    stripePriceId: 'price_pro_monthly',
    popular: true,
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'default'
  },
  {
    name: 'Business',
    price: 29,
    interval: 'month',
    description: 'Advanced tools for teams and power users',
    features: {
      aiAnalyses: 1000,
      watchlist: 'unlimited',
      alerts: 'unlimited',
      bots: ['Discord AND Telegram'],
      historical: '30 days',
      support: 'Priority support',
      additional: [
        'API access (coming soon)',
        'Team features (coming soon)',
        'Custom alert conditions',
        'Advanced analytics'
      ]
    },
    stripePriceId: 'price_business_monthly',
    buttonText: 'Upgrade to Business',
    buttonVariant: 'default'
  }
];

const FEATURES_COMPARISON = [
  {
    feature: 'AI Sentiment Analyses',
    free: '5/month',
    pro: '100/month',
    business: '500/month',
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    feature: 'Watchlist Coins',
    free: '10 coins',
    pro: '50 coins',
    business: 'Unlimited',
    icon: <Zap className="h-4 w-4" />
  },
  {
    feature: 'Alerts',
    free: '3 alerts',
    pro: '15 alerts',
    business: '50 alerts',
    icon: <Bell className="h-4 w-4" />
  },
  {
    feature: 'Bot Integrations',
    free: 'None',
    pro: 'Discord OR Telegram',
    business: 'Discord AND Telegram',
    icon: <Bot className="h-4 w-4" />
  },
  {
    feature: 'Historical Data',
    free: 'None',
    pro: '7 days',
    business: '30 days',
    icon: <Shield className="h-4 w-4" />
  },
  {
    feature: 'Support',
    free: 'Community',
    pro: 'Email support',
    business: 'Priority support',
    icon: <Users className="h-4 w-4" />
  }
];

const FAQ_ITEMS = [
  {
    question: 'What happens when I reach my limits?',
    answer: 'When you reach your monthly limits, you\'ll receive a notification and can either wait for the next billing cycle or upgrade your plan for immediate access to more features.'
  },
  {
    question: 'Can I change plans anytime?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing differences.'
  },
  {
    question: 'How accurate is the AI sentiment analysis?',
    answer: 'Our AI analyzes multiple data sources including news, social media, and market data using advanced language models. While highly accurate, it should be used as one factor in your trading decisions.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express) and process payments securely through Stripe.'
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer: 'Yes! All paid plans come with a 30-day free trial. No credit card required to start, but you\'ll need to add payment details to continue after the trial.'
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely. You can cancel your subscription at any time from your account settings. You\'ll continue to have access until the end of your current billing period.'
  }
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const getButtonText = (tier: PricingTier): string => {
    if (tier.price === 0) {
      return session ? 'Current Plan' : 'Get Started Free';
    }
    if (!session) {
      return `Start ${tier.name} Trial`;
    }
    // For authenticated users, show upgrade/downgrade options
    return tier.buttonText;
  };

  const getButtonVariant = (tier: PricingTier): 'default' | 'outline' | 'secondary' => {
    if (tier.price === 0 && session) {
      return 'secondary'; // Make current free plan less prominent
    }
    return tier.buttonVariant;
  };

  const handlePlanSelect = async (tier: PricingTier) => {
    if (tier.price === 0) {
      // Free plan - redirect to signup or dashboard
      if (!session) {
        router.push('/auth/signup');
      } else {
        router.push('/dashboard');
      }
      return;
    }

    if (!session) {
      // Need to sign up first for paid plans
      router.push('/auth/signup');
      return;
    }

    setIsLoading(tier.name);
    
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: tier.name.toLowerCase(),
          billing: billingInterval === 'month' ? 'monthly' : 'yearly',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      setIsLoading(null);
      
      // Show user-friendly error message
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : 'Failed to start checkout. Please try again.',
        variant: "destructive",
      });
    }
  };

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.83); // 17% discount
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 -mt-[4.5rem] pt-[4.5rem]">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            {session 
              ? 'Unlock advanced features and premium tools to take your crypto trading to the next level.'
              : 'Choose the perfect plan for your crypto trading needs. Start free and scale as you grow.'
            }
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billingInterval === 'month' ? 'text-blue-600' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingInterval === 'year' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingInterval === 'year' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingInterval === 'year' ? 'text-blue-600' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingInterval === 'year' && (
              <Badge variant="secondary" className="ml-2">
                Save 17%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {PRICING_TIERS.map((tier) => {
            const displayPrice = billingInterval === 'year' && tier.price > 0 
              ? getYearlyPrice(tier.price) 
              : tier.price;
            const priceInterval = billingInterval === 'year' ? 'year' : 'month';

            return (
              <Card 
                key={tier.name} 
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  tier.popular 
                    ? 'border-blue-500 shadow-blue-100 dark:shadow-blue-900/20 scale-105' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {tier.name}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                      ${displayPrice}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-gray-500 dark:text-gray-400">
                        /{priceInterval}
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-2 text-sm">
                    {tier.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key Features */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">AI Analyses</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {typeof tier.features.aiAnalyses === 'number' 
                          ? `${tier.features.aiAnalyses}/month` 
                          : tier.features.aiAnalyses}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Watchlist</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {typeof tier.features.watchlist === 'number' 
                          ? `${tier.features.watchlist} coins` 
                          : tier.features.watchlist}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Alerts</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {tier.features.alerts} alerts
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Bots</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {tier.features.bots.length > 0 ? tier.features.bots.join(' ') : 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Additional Features */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <ul className="space-y-2">
                      {tier.features.additional.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {tier.features.historical} historical data
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {tier.features.support}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-6">
                    <Button
                      onClick={() => handlePlanSelect(tier)}
                      disabled={isLoading === tier.name || (tier.price === 0 && !!session)}
                      variant={getButtonVariant(tier)}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading === tier.name ? 'Loading...' : getButtonText(tier)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
            Compare Features
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-4 font-medium text-gray-900 dark:text-gray-100">
                        Features
                      </th>
                      <th className="text-center p-4 font-medium text-gray-900 dark:text-gray-100">
                        Free
                      </th>
                      <th className="text-center p-4 font-medium text-gray-900 dark:text-gray-100">
                        Pro
                      </th>
                      <th className="text-center p-4 font-medium text-gray-900 dark:text-gray-100">
                        Business
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURES_COMPARISON.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {item.icon}
                            <span className="text-gray-900 dark:text-gray-100">{item.feature}</span>
                          </div>
                        </td>
                        <td className="text-center p-4 text-gray-600 dark:text-gray-300">
                          {item.free}
                        </td>
                        <td className="text-center p-4 text-gray-600 dark:text-gray-300">
                          {item.pro}
                        </td>
                        <td className="text-center p-4 text-gray-600 dark:text-gray-300">
                          {item.business}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {FAQ_ITEMS.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                    {item.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {session ? 'Ready to Upgrade?' : 'Ready to Get Started?'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                {session 
                  ? 'Unlock advanced features with AI-powered sentiment analysis and premium tools for serious crypto trading.'
                  : 'Join thousands of crypto traders who use CryptoSentiment to make smarter trading decisions with AI-powered sentiment analysis.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {session ? (
                  <>
                    <Button 
                      onClick={() => handlePlanSelect(PRICING_TIERS[1])}
                      size="lg"
                    >
                      Upgrade to Pro
                    </Button>
                    <Button 
                      onClick={() => handlePlanSelect(PRICING_TIERS[2])}
                      variant="outline"
                      size="lg"
                    >
                      Upgrade to Business
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={() => handlePlanSelect(PRICING_TIERS[0])}
                      variant="outline" 
                      size="lg"
                    >
                      Start Free
                    </Button>
                    <Button 
                      onClick={() => handlePlanSelect(PRICING_TIERS[1])}
                      size="lg"
                    >
                      Try Pro Free
                    </Button>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                {session 
                  ? 'Upgrade anytime • 30-day money-back guarantee • Cancel anytime'
                  : 'No credit card required • 30-day free trial • Cancel anytime'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}