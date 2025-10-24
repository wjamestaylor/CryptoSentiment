'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, 
  Bell, 
  Star, 
  TrendingUp, 
  ArrowRight,
  CheckCircle2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WelcomeStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

const WELCOME_STEPS: WelcomeStep[] = [
  {
    icon: <Star className="h-8 w-8 text-blue-600" />,
    title: 'Build Your Watchlist',
    description: 'Add cryptocurrencies to track their prices, performance, and market sentiment in real-time.',
    action: {
      label: 'Add Crypto',
      href: '/crypto'
    }
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
    title: 'Get AI Insights',
    description: 'Use AI-powered sentiment analysis to understand market trends and make informed decisions.',
    action: {
      label: 'Analyze Now',
      href: '/sentiment'
    }
  },
  {
    icon: <Bell className="h-8 w-8 text-orange-600" />,
    title: 'Set Up Alerts',
    description: 'Create custom price and sentiment alerts to stay informed about important market changes.',
    action: {
      label: 'Create Alert',
      href: '/alerts'
    }
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-green-600" />,
    title: 'Track Portfolio',
    description: 'Monitor your cryptocurrency holdings and see comprehensive performance analytics.',
    action: {
      label: 'View Dashboard',
      href: '/dashboard'
    }
  }
];

const WELCOME_MODAL_KEY = 'cryptosentiment_welcome_shown';

export function WelcomeModal() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Only show for authenticated users who haven't seen it before
    if (status === 'authenticated' && session?.user) {
      const hasSeenWelcome = localStorage.getItem(WELCOME_MODAL_KEY);
      if (!hasSeenWelcome) {
        // Small delay to ensure page is loaded
        setTimeout(() => setIsOpen(true), 500);
      }
    }
  }, [status, session]);

  const handleClose = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < WELCOME_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleActionClick = (href: string) => {
    handleClose();
    router.push(href);
  };

  const currentStepData = WELCOME_STEPS[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Welcome to CryptoSentiment! 🚀
          </DialogTitle>
          <DialogDescription>
            Let&apos;s get you started with the essentials
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {WELCOME_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-12 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Current Step Content */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950/20">
                  {currentStepData.icon}
                </div>
                <h3 className="text-xl font-semibold">
                  {currentStepData.title}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {currentStepData.description}
                </p>
                {currentStepData.action && (
                  <Button
                    onClick={() => handleActionClick(currentStepData.action!.href)}
                    variant="outline"
                    className="mt-4"
                  >
                    {currentStepData.action.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Completed Steps */}
          {currentStep > 0 && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-2">You&apos;ve learned about:</p>
              <div className="flex flex-wrap gap-2">
                {WELCOME_STEPS.slice(0, currentStep).map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{step.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleClose}
          >
            Skip Tour
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Previous
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep < WELCOME_STEPS.length - 1 ? 'Next' : 'Get Started'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
