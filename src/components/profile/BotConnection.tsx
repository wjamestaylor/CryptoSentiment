'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle, Copy, ExternalLink, MessageSquare, Zap } from 'lucide-react';
import { api } from '@/lib/trpc/react';
import { toast } from '@/hooks/use-toast';

type BotType = 'discord' | 'telegram';

interface BotStatus {
  connected: boolean;
  userId: string | null;
  notificationsEnabled: boolean;
}

interface BotConnectionProps {
  initialStatus: {
    discord: BotStatus;
    telegram: BotStatus;
  };
}

export function BotConnection({ initialStatus }: BotConnectionProps) {
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<BotType>('discord');
  const [verificationCode, setVerificationCode] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  
  // Queries
  const { data: connectionStatus, refetch: refetchStatus } = api.bots.getConnectionStatus.useQuery(
    undefined,
    { initialData: initialStatus }
  );

  // Mutations
  const generateCodeMutation = api.bots.generateVerificationCode.useMutation();
  const unlinkBotMutation = api.bots.unlinkBot.useMutation();
  const toggleNotificationsMutation = api.bots.toggleNotifications.useMutation();
  const testConnectionMutation = api.bots.testBotConnection.useMutation();

  const handleGenerateCode = async (botType: BotType) => {
    setSelectedBot(botType);
    setIsGeneratingCode(true);
    
    try {
      const result = await generateCodeMutation.mutateAsync({ botType });
      setVerificationCode(result.verificationCode);
      setIsVerificationOpen(true);
      
      toast({
        title: 'Verification Code Generated',
        description: result.instructions,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate verification code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleUnlinkBot = async (botType: BotType) => {
    try {
      await unlinkBotMutation.mutateAsync({ botType });
      await refetchStatus();
      
      toast({
        title: 'Account Unlinked',
        description: `Your ${botType} account has been unlinked successfully.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to unlink ${botType} account. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const handleToggleNotifications = async (botType: BotType, enabled: boolean) => {
    try {
      await toggleNotificationsMutation.mutateAsync({ botType, enabled });
      await refetchStatus();
      
      toast({
        title: `${botType} Notifications`,
        description: `Notifications have been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update notification settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTestConnection = async (botType: BotType) => {
    try {
      await testConnectionMutation.mutateAsync({ botType });
      
      toast({
        title: 'Test Message Sent',
        description: `Check your ${botType} for a test message!`,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to send test message to ${botType}.`,
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Verification code copied to clipboard.',
      });
    }
  };

  const getBotIcon = (botType: BotType) => {
    return botType === 'discord' ? (
      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
        <span className="text-indigo-600 font-bold text-sm">DC</span>
      </div>
    ) : (
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-blue-600 font-bold text-sm">TG</span>
      </div>
    );
  };

  const getBotInstructions = (botType: BotType) => {
    if (botType === 'discord') {
      return {
        title: 'Connect Discord Bot',
        steps: [
          'Join our Discord server',
          'Use the slash command: /verify [code]',
          'Your account will be linked automatically'
        ],
        actionUrl: 'https://discord.gg/cryptosentiment'
      };
    } else {
      return {
        title: 'Connect Telegram Bot',
        steps: [
          'Start a chat with @CryptoSentimentBot',
          'Send the command: /verify [code]',
          'Your account will be linked automatically'
        ],
        actionUrl: 'https://t.me/CryptoSentimentBot'
      };
    }
  };

  if (!connectionStatus) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Bot Integration
          </CardTitle>
          <CardDescription>
            Connect your Discord and Telegram accounts to receive real-time crypto alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Discord Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getBotIcon('discord')}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Discord Bot</h4>
                    {connectionStatus.discord.connected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-700">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Get alerts directly in Discord with rich embeds and slash commands
                  </p>
                  {connectionStatus.discord.connected && connectionStatus.discord.userId && (
                    <p className="text-xs text-gray-400 mt-1">
                      User ID: {connectionStatus.discord.userId}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                {connectionStatus.discord.connected ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={connectionStatus.discord.notificationsEnabled}
                        onCheckedChange={(enabled) => handleToggleNotifications('discord', enabled)}
                      />
                      <Label className="text-sm">Notifications</Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection('discord')}
                      disabled={testConnectionMutation.isPending}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnlinkBot('discord')}
                      disabled={unlinkBotMutation.isPending}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateCode('discord')}
                      disabled={isGeneratingCode}
                    >
                      Connect Discord
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.open('https://discord.gg/cryptosentiment', '_blank');
                        }
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Join Server
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Telegram Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getBotIcon('telegram')}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Telegram Bot</h4>
                    {connectionStatus.telegram.connected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-700">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Receive instant notifications on Telegram with interactive commands
                  </p>
                  {connectionStatus.telegram.connected && connectionStatus.telegram.userId && (
                    <p className="text-xs text-gray-400 mt-1">
                      User ID: {connectionStatus.telegram.userId}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                {connectionStatus.telegram.connected ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={connectionStatus.telegram.notificationsEnabled}
                        onCheckedChange={(enabled) => handleToggleNotifications('telegram', enabled)}
                      />
                      <Label className="text-sm">Notifications</Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection('telegram')}
                      disabled={testConnectionMutation.isPending}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnlinkBot('telegram')}
                      disabled={unlinkBotMutation.isPending}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateCode('telegram')}
                      disabled={isGeneratingCode}
                    >
                      Connect Telegram
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.open('https://t.me/CryptoSentimentBot', '_blank');
                        }
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Start Bot
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Bot Features */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Bot Features
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Real-time price alerts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Sentiment change notifications</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Volume spike alerts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Interactive commands</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={isVerificationOpen} onOpenChange={setIsVerificationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{getBotInstructions(selectedBot).title}</DialogTitle>
            <DialogDescription>
              Follow these steps to connect your {selectedBot} account
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Your Verification Code</Label>
              <div className="flex space-x-2">
                <Input
                  id="verification-code"
                  value={verificationCode}
                  readOnly
                  className="font-mono text-lg text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(verificationCode)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instructions</Label>
              <ol className="text-sm text-gray-600 space-y-1">
                {getBotInstructions(selectedBot).steps.map((step, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This verification code will expire in 5 minutes. 
                Make sure to use it quickly!
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open(getBotInstructions(selectedBot).actionUrl, '_blank');
                }
              }}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open {selectedBot}
            </Button>
            <Button
              type="button"
              onClick={() => setIsVerificationOpen(false)}
              className="w-full sm:w-auto"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}