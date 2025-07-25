import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Key, Copy, RefreshCw, Eye, EyeOff, ExternalLink, TestTube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyManagerProps {
  userProfile: any;
  onApiKeyUpdate: () => void;
}

export const ApiKeyManager = ({ userProfile, onApiKeyUpdate }: ApiKeyManagerProps) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const copyApiKey = () => {
    if (userProfile?.api_key) {
      navigator.clipboard.writeText(userProfile.api_key);
      toast({
        title: "API Key Copied",
        description: "Your API key has been copied to clipboard.",
      });
    }
  };

  const regenerateApiKey = async () => {
    setIsRegenerating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ api_key: crypto.randomUUID() })
        .eq('user_id', userProfile.user_id);

      if (error) throw error;

      toast({
        title: "API Key Regenerated",
        description: "Your new API key has been generated successfully.",
      });
      
      onApiKeyUpdate();
    } catch (error) {
      console.error('Error regenerating API key:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const testApiKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch(
        `https://tosinadegbola.com/api/pricing-api?from=Nigeria&to=Ghana&weight=2&packageType=Documents`,
        {
          headers: {
            'Authorization': `Bearer ${userProfile.api_key}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      setTestResult({
        status: response.status,
        success: response.ok,
        data: data
      });

      if (response.ok) {
        toast({
          title: "API Test Successful",
          description: "Your API key is working correctly!",
        });
      } else {
        toast({
          title: "API Test Failed",
          description: data.error || "API request failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('API test error:', error);
      setTestResult({
        status: 0,
        success: false,
        data: { error: 'Network error or API unavailable' }
      });
      
      toast({
        title: "API Test Error",
        description: "Failed to test API endpoint",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="h-5 w-5 text-primary" />
          <span>API Key Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key Display */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Your API Key:</label>
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono break-all">
              {showApiKey ? userProfile?.api_key : '••••••••-••••-••••-••••-••••••••••••'}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowApiKey(!showApiKey)}
              title={showApiKey ? "Hide API key" : "Show API key"}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyApiKey}
              title="Copy API key"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* API Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={testApiKey}
            disabled={isTesting}
            className="flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>{isTesting ? 'Testing...' : 'Test API'}</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isRegenerating}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {isRegenerating ? 'Regenerating...' : 'Regenerate Key'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will generate a new API key and invalidate your current one. 
                  Any applications using the old key will stop working until you update them.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={regenerateApiKey}>
                  Regenerate Key
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="ghost"
            onClick={() => window.open('/api-docs', '_blank')}
            className="flex items-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>API Docs</span>
          </Button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <h4 className="font-medium">Test Result:</h4>
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.status || 'Error'}
              </Badge>
            </div>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="bg-accent/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Quick Start:</h4>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Use your API key in the Authorization header</p>
            <p>• Base URL: <code className="bg-muted px-1 rounded">https://tosinadegbola.com/api/</code></p>
            <p>• Rate limit: 100 requests per minute</p>
          </div>
          <code className="block mt-3 p-2 bg-muted rounded text-xs">
            curl -H "Authorization: Bearer {userProfile?.api_key || 'YOUR_API_KEY'}" \\{'\n'}
            {' '}"https://tosinadegbola.com/api/pricing-api?from=Nigeria&to=Ghana&weight=2"
          </code>
        </div>
      </CardContent>
    </Card>
  );
};