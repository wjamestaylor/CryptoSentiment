"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Key, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/trpc/provider';
import { useToast } from '@/hooks/use-toast';

interface PortfolioImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

type ImportMethod = 'csv' | 'coinbase' | 'binance';

interface ParsedHolding {
  symbol: string;
  amount: number;
  purchasePrice?: number;
  purchaseDate?: Date;
  notes?: string;
}

export function PortfolioImportDialog({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: PortfolioImportDialogProps) {
  const { toast } = useToast();
  
  // State
  const [importMethod, setImportMethod] = useState<ImportMethod>('csv');
  const [csvContent, setCsvContent] = useState('');
  const [parsedHoldings, setParsedHoldings] = useState<ParsedHolding[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  
  // Exchange credentials
  const [exchangeCredentials, setExchangeCredentials] = useState({
    apiKey: '',
    apiSecret: '',
    apiPassphrase: '',
  });

  // Mutations
  const parseCSVMutation = api.portfolioImport.parseCSV.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setParsedHoldings(data.data);
        setParseErrors(data.errors);
        setParseWarnings(data.warnings);
        toast({
          title: 'CSV Parsed Successfully',
          description: `Found ${data.data.length} holdings to import`,
        });
      } else {
        setParseErrors(data.errors);
        toast({
          title: 'CSV Parse Failed',
          description: data.errors[0] || 'Failed to parse CSV',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Parse Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const verifyCredentialsMutation = api.portfolioImport.verifyExchangeCredentials.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Credentials Verified',
          description: data.message,
        });
        // Automatically fetch holdings after verification
        fetchExchangeHoldings();
      } else {
        toast({
          title: 'Verification Failed',
          description: data.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Verification Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const fetchExchangeHoldingsMutation = api.portfolioImport.fetchExchangeHoldings.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        const holdings = data.holdings.map(h => ({
          symbol: h.symbol,
          amount: h.amount,
        }));
        setParsedHoldings(holdings);
        setParseWarnings(data.warnings);
        toast({
          title: 'Holdings Fetched',
          description: `Found ${holdings.length} holdings to import`,
        });
      } else {
        toast({
          title: 'Fetch Failed',
          description: data.errors[0] || 'Failed to fetch holdings',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Fetch Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const importHoldingsMutation = api.portfolioImport.importHoldings.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Import Successful',
          description: data.message,
        });
        onImportComplete?.();
        resetForm();
        onOpenChange(false);
      }
    },
    onError: (error) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const templateQuery = api.portfolioImport.getCSVTemplate.useQuery(undefined, {
    enabled: false,
  });

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handleParseCSV = () => {
    if (!csvContent.trim()) {
      toast({
        title: 'No CSV Content',
        description: 'Please upload a CSV file or paste CSV content',
        variant: 'destructive',
      });
      return;
    }

    parseCSVMutation.mutate({ csvContent });
  };

  const verifyExchangeCredentials = () => {
    if (!exchangeCredentials.apiKey || !exchangeCredentials.apiSecret) {
      toast({
        title: 'Missing Credentials',
        description: 'Please enter API key and secret',
        variant: 'destructive',
      });
      return;
    }

    verifyCredentialsMutation.mutate({
      exchange: importMethod as 'coinbase' | 'binance',
      apiKey: exchangeCredentials.apiKey,
      apiSecret: exchangeCredentials.apiSecret,
      apiPassphrase: exchangeCredentials.apiPassphrase || undefined,
    });
  };

  const fetchExchangeHoldings = () => {
    fetchExchangeHoldingsMutation.mutate({
      exchange: importMethod as 'coinbase' | 'binance',
      apiKey: exchangeCredentials.apiKey,
      apiSecret: exchangeCredentials.apiSecret,
      apiPassphrase: exchangeCredentials.apiPassphrase || undefined,
    });
  };

  const handleImport = () => {
    if (parsedHoldings.length === 0) {
      toast({
        title: 'No Holdings to Import',
        description: 'Please parse CSV or fetch exchange holdings first',
        variant: 'destructive',
      });
      return;
    }

    importHoldingsMutation.mutate({
      holdings: parsedHoldings,
      overwriteExisting,
    });
  };

  const downloadTemplate = async () => {
    const result = await templateQuery.refetch();
    if (result.data) {
      const blob = new Blob([result.data.template], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const resetForm = () => {
    setCsvContent('');
    setParsedHoldings([]);
    setParseErrors([]);
    setParseWarnings([]);
    setExchangeCredentials({ apiKey: '', apiSecret: '', apiPassphrase: '' });
    setOverwriteExisting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Portfolio</DialogTitle>
          <DialogDescription>
            Import your cryptocurrency holdings via CSV or exchange API
          </DialogDescription>
        </DialogHeader>

        <Tabs value={importMethod} onValueChange={(v) => setImportMethod(v as ImportMethod)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="csv">
              <Upload className="mr-2 h-4 w-4" />
              CSV Upload
            </TabsTrigger>
            <TabsTrigger value="coinbase">
              <Key className="mr-2 h-4 w-4" />
              Coinbase
            </TabsTrigger>
            <TabsTrigger value="binance">
              <Key className="mr-2 h-4 w-4" />
              Binance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>
                  Upload a CSV file with columns: symbol, amount, purchasePrice (optional), purchaseDate (optional), notes (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Button onClick={downloadTemplate} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="csv-file">Upload CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="csv-content">Or Paste CSV Content</Label>
                  <textarea
                    id="csv-content"
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    className="w-full mt-2 p-2 border rounded-md min-h-[150px] font-mono text-sm"
                    placeholder="symbol,amount,purchasePrice,purchaseDate,notes&#10;BTC,0.5,45000,2024-01-15,Initial investment"
                  />
                </div>

                <Button 
                  onClick={handleParseCSV} 
                  disabled={parseCSVMutation.isPending}
                  className="w-full"
                >
                  {parseCSVMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Parse CSV
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coinbase" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Coinbase API Credentials</CardTitle>
                <CardDescription>
                  Enter your Coinbase API credentials to import holdings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coinbase-api-key">API Key</Label>
                  <Input
                    id="coinbase-api-key"
                    type="text"
                    value={exchangeCredentials.apiKey}
                    onChange={(e) => setExchangeCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your Coinbase API key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coinbase-api-secret">API Secret</Label>
                  <Input
                    id="coinbase-api-secret"
                    type="password"
                    value={exchangeCredentials.apiSecret}
                    onChange={(e) => setExchangeCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder="Enter your Coinbase API secret"
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Security Notice:</strong> Your API credentials are only used to fetch holdings and are not stored. 
                    For security, we recommend creating read-only API keys.
                  </p>
                </div>

                <Button 
                  onClick={verifyExchangeCredentials} 
                  disabled={verifyCredentialsMutation.isPending}
                  className="w-full"
                >
                  {verifyCredentialsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Fetch Holdings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="binance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Binance API Credentials</CardTitle>
                <CardDescription>
                  Enter your Binance API credentials to import holdings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="binance-api-key">API Key</Label>
                  <Input
                    id="binance-api-key"
                    type="text"
                    value={exchangeCredentials.apiKey}
                    onChange={(e) => setExchangeCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your Binance API key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="binance-api-secret">API Secret</Label>
                  <Input
                    id="binance-api-secret"
                    type="password"
                    value={exchangeCredentials.apiSecret}
                    onChange={(e) => setExchangeCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder="Enter your Binance API secret"
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Security Notice:</strong> Your API credentials are only used to fetch holdings and are not stored. 
                    For security, we recommend creating read-only API keys with only account read permissions.
                  </p>
                </div>

                <Button 
                  onClick={verifyExchangeCredentials} 
                  disabled={verifyCredentialsMutation.isPending}
                  className="w-full"
                >
                  {verifyCredentialsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Fetch Holdings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Section */}
        {parsedHoldings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Import Preview</CardTitle>
              <CardDescription>
                Review the holdings that will be imported
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Symbol</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-right p-2">Purchase Price</th>
                      <th className="text-left p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedHoldings.map((holding, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 font-medium">{holding.symbol}</td>
                        <td className="text-right p-2">{holding.amount.toLocaleString()}</td>
                        <td className="text-right p-2">
                          {holding.purchasePrice ? `$${holding.purchasePrice.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2">
                          {holding.purchaseDate ? new Date(holding.purchaseDate).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parseWarnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Warnings:</p>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                        {parseWarnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {parseErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">Errors:</p>
                      <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                        {parseErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="overwrite-existing"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="overwrite-existing" className="cursor-pointer">
                  Overwrite existing holdings (if any)
                </Label>
              </div>

              <Button 
                onClick={handleImport}
                disabled={importHoldingsMutation.isPending || parseErrors.length > 0}
                className="w-full"
              >
                {importHoldingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {parsedHoldings.length} Holdings
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
