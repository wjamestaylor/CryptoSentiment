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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Rocket,
  Search,
  Star,
  Bell,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Eye,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/trpc/provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OnboardingWizardProps {
  onComplete?: () => void;
}

interface SelectedCrypto {
  id: string;
  symbol: string;
  name: string;
  image?: string;
}

const TOTAL_STEPS = 4;

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCryptos, setSelectedCryptos] = useState<SelectedCrypto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState('10');

  // Query onboarding status
  const { data: onboardingStatus } = api.onboarding.getStatus.useQuery(undefined, {
    enabled: !!session?.user,
  });

  // Query top cryptos for selection
  const { data: topCryptos, isLoading: cryptosLoading } = api.crypto.getTopCryptos.useQuery(
    { limit: 20 },
    { enabled: isOpen && currentStep === 2 }
  );

  // Mutations
  const updateStepMutation = api.onboarding.updateStep.useMutation();
  const completeOnboardingMutation = api.onboarding.complete.useMutation();
  const skipOnboardingMutation = api.onboarding.skip.useMutation();
  const addCryptoMutation = api.crypto.addCryptoTracking.useMutation();
  const createAlertMutation = api.alerts.createAlert.useMutation();

  // Show onboarding wizard if user hasn't completed it
  useEffect(() => {
    if (onboardingStatus?.data?.shouldShowOnboarding) {
      setIsOpen(true);
      setCurrentStep(onboardingStatus.data.currentStep || 1);
    }
  }, [onboardingStatus]);

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await updateStepMutation.mutateAsync({ step: nextStep });
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateStepMutation.mutate({ step: prevStep });
    }
  };

  const handleSkip = async () => {
    try {
      await skipOnboardingMutation.mutateAsync();
      setIsOpen(false);
      onComplete?.();
      toast({
        title: 'Onboarding Skipped',
        description: 'You can always access the tutorial from settings.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to skip onboarding. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleComplete = async () => {
    try {
      // Add selected cryptos to watchlist
      if (selectedCryptos.length > 0) {
        await Promise.all(
          selectedCryptos.map((crypto) =>
            addCryptoMutation.mutateAsync({
              identifier: crypto.id,
              notes: 'Added during onboarding',
            })
          )
        );
      }

      // Create alert if configured
      if (alertEnabled && selectedCryptos.length > 0) {
        const firstCrypto = selectedCryptos[0];
        await createAlertMutation.mutateAsync({
          cryptoIdentifier: firstCrypto.id,
          type: 'PRICE_CHANGE',
          condition: JSON.stringify({
            threshold: parseFloat(alertThreshold),
            direction: 'above',
          }),
        });
      }

      // Mark onboarding as complete
      await completeOnboardingMutation.mutateAsync();
      
      setIsOpen(false);
      onComplete?.();
      
      toast({
        title: 'Welcome to CryptoSentiment! 🎉',
        description: `You're all set! ${selectedCryptos.length > 0 ? `Tracking ${selectedCryptos.length} cryptocurrencies.` : ''}`,
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Setup Complete',
        description: 'Welcome to CryptoSentiment!',
      });
      setIsOpen(false);
    }
  };

  const toggleCryptoSelection = (crypto: SelectedCrypto) => {
    setSelectedCryptos((prev) => {
      const exists = prev.find((c) => c.id === crypto.id);
      if (exists) {
        return prev.filter((c) => c.id !== crypto.id);
      }
      if (prev.length >= 5) {
        toast({
          title: 'Maximum Reached',
          description: 'You can select up to 5 cryptocurrencies during onboarding.',
        });
        return prev;
      }
      return [...prev, crypto];
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Rocket className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold">Welcome to CryptoSentiment!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let's get you started with the most powerful cryptocurrency sentiment analysis platform.
                This quick setup will help you make the most of your experience.
              </p>
            </div>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">AI-Powered Insights</p>
                      <p className="text-sm text-muted-foreground">
                        Get real-time sentiment analysis powered by advanced AI
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Smart Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Never miss important price movements or sentiment changes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Portfolio Tracking</p>
                      <p className="text-sm text-muted-foreground">
                        Monitor your holdings with comprehensive analytics
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 py-6">
            <div className="text-center space-y-2 mb-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Star className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold">Choose Cryptocurrencies to Track</h3>
              <p className="text-sm text-muted-foreground">
                Select up to 5 cryptocurrencies to get started (you can add more later)
              </p>
            </div>

            {selectedCryptos.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                {selectedCryptos.map((crypto) => (
                  <Badge
                    key={crypto.id}
                    variant="secondary"
                    className="flex items-center gap-1 py-1.5 px-3"
                  >
                    {crypto.symbol.toUpperCase()}
                    <button
                      onClick={() => toggleCryptoSelection(crypto)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove ${crypto.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cryptocurrencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2">
              {cryptosLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                topCryptos?.data
                  ?.filter((crypto: any) =>
                    searchQuery
                      ? crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .slice(0, 10)
                  .map((crypto: any) => {
                    const isSelected = selectedCryptos.some((c) => c.id === crypto.id);
                    return (
                      <button
                        key={crypto.id}
                        onClick={() =>
                          toggleCryptoSelection({
                            id: crypto.id,
                            symbol: crypto.symbol,
                            name: crypto.name,
                            image: crypto.image,
                          })
                        }
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all hover:bg-muted/50',
                          isSelected && 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
                        )}
                      >
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold">
                            {crypto.symbol.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-sm">{crypto.symbol.toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground truncate">{crypto.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              ${crypto.current_price?.toLocaleString() || 'N/A'}
                            </p>
                            {crypto.price_change_percentage_24h !== undefined && (
                              <Badge
                                variant={crypto.price_change_percentage_24h >= 0 ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                                {crypto.price_change_percentage_24h.toFixed(1)}%
                              </Badge>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 py-6">
            <div className="text-center space-y-2 mb-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <Bell className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold">Set Up Your First Alert</h3>
              <p className="text-sm text-muted-foreground">
                Get notified about important price movements
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="alert-enabled" className="font-medium">
                      Enable Price Alert
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when price changes exceed your threshold
                    </p>
                  </div>
                  <Switch
                    id="alert-enabled"
                    checked={alertEnabled}
                    onCheckedChange={setAlertEnabled}
                  />
                </div>

                {alertEnabled && (
                  <div className="space-y-3 pt-2 animate-in fade-in-50 duration-200">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 dark:text-blue-100">
                            Alert for: {selectedCryptos[0]?.symbol.toUpperCase() || 'Selected crypto'}
                          </p>
                          <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                            You'll receive notifications via email when price changes exceed your threshold
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alert-threshold">Price Change Threshold (%)</Label>
                      <Input
                        id="alert-threshold"
                        type="number"
                        min="1"
                        max="100"
                        value={alertThreshold}
                        onChange={(e) => setAlertThreshold(e.target.value)}
                        placeholder="10"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert me when price changes by more than {alertThreshold}%
                      </p>
                    </div>
                  </div>
                )}

                {!alertEnabled && (
                  <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                    You can create alerts anytime from the Alerts page
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 py-6">
            <div className="text-center space-y-2 mb-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold">You're All Set!</h3>
              <p className="text-sm text-muted-foreground">
                Here's a quick tour of what you can do
              </p>
            </div>

            <div className="space-y-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Dashboard</p>
                      <p className="text-sm text-muted-foreground">
                        View your tracked cryptocurrencies and portfolio overview
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">AI Sentiment Analysis</p>
                      <p className="text-sm text-muted-foreground">
                        Get AI-powered insights on market sentiment and trends
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Set up custom alerts for price changes and sentiment shifts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Analytics</p>
                      <p className="text-sm text-muted-foreground">
                        Deep dive into price charts and performance metrics
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-center text-blue-900 dark:text-blue-100">
                <strong>Pro Tip:</strong> You can customize all settings anytime from the Settings page
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Get Started with CryptoSentiment
          </DialogTitle>
          <DialogDescription>
            Step {currentStep} of {TOTAL_STEPS}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-2">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <div
              key={index}
              className={cn(
                'h-2 rounded-full transition-all',
                index + 1 === currentStep
                  ? 'w-16 bg-blue-600'
                  : index + 1 < currentStep
                  ? 'w-12 bg-blue-300'
                  : 'w-12 bg-gray-200 dark:bg-gray-700'
              )}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">{renderStep()}</div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={completeOnboardingMutation.isPending}
          >
            Skip Setup
          </Button>
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={updateStepMutation.isPending}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={
                updateStepMutation.isPending ||
                completeOnboardingMutation.isPending ||
                (currentStep === 2 && selectedCryptos.length === 0)
              }
            >
              {currentStep === TOTAL_STEPS ? (
                completeOnboardingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  'Complete Setup'
                )
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
