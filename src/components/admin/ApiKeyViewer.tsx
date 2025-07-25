import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Search,
  Copy,
  RefreshCw,
  User,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ApiKeyViewer = () => {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [filteredKeys, setFilteredKeys] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  useEffect(() => {
    // Filter API keys based on search term
    const filtered = apiKeys.filter(user => 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.api_key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredKeys(filtered);
  }, [apiKeys, searchTerm]);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, company_name, api_key, created_at, is_admin')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        toast({
          title: "Error Loading API Keys",
          description: "Unable to load API keys. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "API Key Copied",
      description: "API key has been copied to clipboard.",
    });
  };

  const toggleKeyVisibility = (userId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const regenerateApiKey = async (userId: string) => {
    if (!confirm('Are you sure you want to regenerate this API key? The old key will no longer work.')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ api_key: crypto.randomUUID() })
        .eq('user_id', userId);

      if (error) {
        console.error('Error regenerating API key:', error);
        toast({
          title: "Update Failed",
          description: "Unable to regenerate API key. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "API Key Regenerated",
        description: "New API key has been generated successfully.",
      });

      fetchApiKeys();
    } catch (error) {
      console.error('Error regenerating API key:', error);
    }
  };

  const testApiKey = async (apiKey: string) => {
    try {
      // Test the API key by making a simple request to our pricing endpoint
      const response = await fetch('/api/price?from=Nigeria&to=Ghana&weight=1', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        toast({
          title: "API Key Valid",
          description: "API key is working correctly.",
        });
      } else {
        toast({
          title: "API Key Issue",
          description: "API key validation failed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Unable to test API key.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading API keys...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-primary" />
              <span>API Key Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search API keys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" onClick={fetchApiKeys}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No API keys match your search' : 'No API keys found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredKeys.map((user) => {
                const isVisible = visibleKeys.has(user.user_id);
                return (
                  <div
                    key={user.user_id}
                    className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-smooth"
                  >
                    <div className="space-y-3">
                      {/* User Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-accent rounded-full">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-foreground">
                                {user.full_name || 'Unknown User'}
                              </p>
                              {user.is_admin && (
                                <Badge variant="default">Admin</Badge>
                              )}
                            </div>
                            {user.company_name && (
                              <p className="text-sm text-muted-foreground">{user.company_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* API Key */}
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <code className="font-mono text-sm flex-1 min-w-0">
                              {isVisible ? user.api_key : '••••••••-••••-••••-••••-••••••••••••'}
                            </code>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleKeyVisibility(user.user_id)}
                            >
                              {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyApiKey(user.api_key)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => regenerateApiKey(user.user_id)}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Usage Instructions */}
                      <div className="text-xs text-muted-foreground bg-accent/50 p-2 rounded">
                        <p><strong>Usage:</strong> Include this key in the Authorization header as "Bearer {user.api_key?.substring(0, 8)}..."</p>
                        <code className="block mt-1">
                          curl -H "Authorization: Bearer {user.api_key?.substring(0, 8)}..." /api/price?from=Nigeria&to=Ghana&weight=2
                        </code>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};