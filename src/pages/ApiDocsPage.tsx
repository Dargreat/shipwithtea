import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { Copy, Key, Code, Play, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { config, getApiUrl } from '@/config/environment';

export const ApiDocsPage = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      }
    });
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserProfile(data);
      if (data?.api_key) {
        setApiKey(data.api_key);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} Copied`,
      description: `${label} has been copied to clipboard.`,
    });
  };

  const testApiEndpoint = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your API key to test the endpoint.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use environment config to get the correct API URL
      const apiUrl = getApiUrl('pricingApi');
      const response = await fetch(`${apiUrl}?from=Nigeria&to=Ghana&weight=2&packageType=document`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setTestResponse({
        status: response.status,
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
          description: data.error || "Request failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('API test error:', error);
      toast({
        title: "API Test Error",
        description: "Failed to test API endpoint",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const codeExamples = {
    curl: `curl -X GET "https://udituntwllttyejobufm.supabase.co/functions/v1/pricing-api?from=Nigeria&to=Ghana&weight=2&packageType=document" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    
    javascript: `const response = await fetch(
  'https://udituntwllttyejobufm.supabase.co/functions/v1/pricing-api?from=Nigeria&to=Ghana&weight=2&packageType=document',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
  }
);

const data = await response.json();
console.log(data);`,

    python: `import requests

url = "https://udituntwllttyejobufm.supabase.co/functions/v1/pricing-api"
params = {
    "from": "Nigeria",
    "to": "Ghana",
    "weight": 2,
    "packageType": "document"
}
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

response = requests.get(url, params=params, headers=headers)
data = response.json()
print(data)`,

    php: `<?php
$url = "https://udituntwllttyejobufm.supabase.co/functions/v1/pricing-api";
$params = http_build_query([
    'from' => 'Nigeria',
    'to' => 'Ghana', 
    'weight' => 2,
    'packageType' => 'document'
]);

$options = [
    'http' => [
        'header' => [
            "Authorization: Bearer YOUR_API_KEY",
            "Content-Type: application/json"
        ],
        'method' => 'GET'
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url . '?' . $params, false, $context);
$data = json_decode($result, true);
print_r($data);
?>`
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} userProfile={userProfile} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              API Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Integrate our shipping calculator into your applications with our RESTful API. 
              Get real-time pricing and create shipment orders programmatically.
            </p>
          </div>

          {/* API Key Section */}
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-primary" />
                <span>Authentication</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                All API requests require authentication using your API key. Include it in the Authorization header.
              </p>
              
              {user ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">Your API Key:</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(apiKey, 'API Key')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-sm">
                      Authorization: Bearer {apiKey || 'YOUR_API_KEY'}
                    </code>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    Please <a href="/auth" className="font-medium underline">sign in</a> to access your API key.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Endpoint */}
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-primary" />
                <span>Pricing Endpoint</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">GET</Badge>
                 <code className="text-sm bg-muted px-2 py-1 rounded">
                   /functions/v1/pricing-api
                 </code>
                </div>
                <p className="text-muted-foreground">
                  Calculate shipping costs between countries based on weight and package type.
                </p>
              </div>

              {/* Parameters */}
              <div>
                <h4 className="font-semibold mb-3">Query Parameters</h4>
                <div className="space-y-3">
                  {[
                    { name: 'from', type: 'string', required: true, description: 'Origin country (e.g., "Nigeria") - Case sensitive' },
                    { name: 'to', type: 'string', required: true, description: 'Destination country (e.g., "Ghana") - Case sensitive' },
                    { name: 'weight', type: 'number', required: true, description: 'Package weight in kilograms' },
                    { name: 'packageType', type: 'string', required: true, description: 'Type of package (e.g., "document", "package") - Case sensitive, use lowercase' },
                  ].map((param) => (
                    <div key={param.name} className="border border-border rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <code className="font-medium">{param.name}</code>
                        <Badge variant={param.required ? "destructive" : "secondary"} className="text-xs">
                          {param.required ? 'Required' : 'Optional'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{param.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{param.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test API */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Test API</h4>
                  <Button 
                    onClick={testApiEndpoint}
                    disabled={isLoading || !apiKey}
                    variant="hero"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isLoading ? 'Testing...' : 'Test Endpoint'}
                  </Button>
                </div>
                
                {testResponse && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={testResponse.status === 200 ? "default" : "destructive"}>
                        {testResponse.status}
                      </Badge>
                      {testResponse.status === 200 && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(testResponse.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(codeExamples).map(([language, code]) => (
                <div key={language}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold capitalize">{language}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(code, `${language} code`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                    <code>{code}</code>
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Response Format */}
          <Card className="shadow-card mt-8">
            <CardHeader>
              <CardTitle>Response Format</CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-3">Success Response (200)</h4>
              <p className="text-sm text-muted-foreground mb-2">When pricing rules exist for the requested route:</p>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm mb-6">
                <code>{JSON.stringify({
                  success: true,
                  data: {
                    from: "Nigeria",
                    to: "Ghana",
                    weight: 2,
                    packageType: "document",
                    basePrice: 15,
                    pricePerKg: 25,
                    weightCost: 50,
                    totalCost: 65,
                    currency: "USD",
                    estimatedDelivery: "3-5 business days",
                    apiKeyHolder: "Your Name"
                  },
                  timestamp: "2025-07-18T12:39:08.763Z"
                }, null, 2)}</code>
              </pre>

              <h4 className="font-semibold mb-3">No Pricing Rules (404)</h4>
              <p className="text-sm text-muted-foreground mb-2">When no pricing rules are configured for the route:</p>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm mb-6">
                <code>{JSON.stringify({
                  success: false,
                  error: "No pricing rules yet",
                  message: "No pricing configuration found for route Nigeria to Ghana with package type document. Please contact support to set up pricing for this route."
                }, null, 2)}</code>
              </pre>

              <h4 className="font-semibold mb-3">Authentication Error (401)</h4>
              <p className="text-sm text-muted-foreground mb-2">When API key is missing or invalid:</p>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm mb-6">
                <code>{JSON.stringify({
                  success: false,
                  error: "Invalid API key. Please check your API key and try again."
                }, null, 2)}</code>
              </pre>

              <h4 className="font-semibold mb-3">Validation Error (400)</h4>
              <p className="text-sm text-muted-foreground mb-2">When required parameters are missing or invalid:</p>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                <code>{JSON.stringify({
                  success: false,
                  error: "Missing required parameters: from, to, weight, packageType",
                  example: "?from=Nigeria&to=Ghana&weight=2&packageType=document"
                }, null, 2)}</code>
              </pre>
            </CardContent>
          </Card>

          {/* Usage Guide */}
          <Card className="shadow-card mt-8">
            <CardHeader>
              <CardTitle>How to Successfully Call the API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Step-by-Step Guide:</h4>
                <ol className="list-decimal list-inside space-y-2 text-blue-800">
                  <li>Get your API key from your profile (visible above if logged in)</li>
                  <li>Include the API key in the Authorization header: <code className="bg-blue-100 px-2 py-1 rounded">Authorization: Bearer YOUR_API_KEY</code></li>
                  <li>Ensure pricing rules exist for your route in the admin panel</li>
                  <li>Make a GET request with required parameters: from, to, weight, packageType</li>
                </ol>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2">Common Issues:</h4>
                <ul className="list-disc list-inside space-y-1 text-amber-800">
                  <li><strong>404 "No pricing rules yet":</strong> Admin needs to add pricing for your route</li>
                  <li><strong>401 "Invalid API key":</strong> Check your API key is correct</li>
                  <li><strong>400 "Missing parameters":</strong> Include all required query parameters</li>
                  <li><strong>Case sensitivity:</strong> Country names and package types are case sensitive (use "document" not "Documents")</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
