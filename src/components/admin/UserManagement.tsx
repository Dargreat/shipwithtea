import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search,
  Shield,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Key
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserManagementProps {
  onStatsUpdate: () => void;
}

export const UserManagement = ({ onStatsUpdate }: UserManagementProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    const filtered = users.filter(user => 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error Loading Users",
          description: "Unable to load users. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentAdminStatus: boolean) => {
    setIsUpdating(true);
    try {
      console.log('Toggling admin status for user:', userId, 'current status:', currentAdminStatus);
      
      // First check if we can get the current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current user performing action:', currentUser?.id);
      
      // Check if current user is admin
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', currentUser?.id)
        .single();
      
      console.log('Current user admin status:', currentUserProfile?.is_admin);
      
      if (!currentUserProfile?.is_admin) {
        toast({
          title: "Access Denied",
          description: "You must be an admin to perform this action.",
          variant: "destructive",
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentAdminStatus })
        .eq('user_id', userId)
        .select('user_id, is_admin');

      if (error) {
        console.error('Error updating admin status:', error);
        toast({
          title: "Update Failed",
          description: `Unable to update admin status: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Admin status update result:', data);

      toast({
        title: "Admin Status Updated",
        description: `User admin status ${!currentAdminStatus ? 'granted' : 'revoked'}.`,
      });

      // Refresh the data immediately
      fetchUsers();
      onStatsUpdate();
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        title: "Update Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const regenerateApiKey = async (userId: string) => {
    setIsUpdating(true);
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
        description: "User's API key has been regenerated successfully.",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error regenerating API key:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading users...</p>
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
              <Users className="h-5 w-5 text-primary" />
              <span>User Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" onClick={fetchUsers}>
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No users match your search' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-smooth"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-accent rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-foreground">
                              {user.full_name || 'Unknown User'}
                            </p>
                            {user.is_admin && (
                              <Badge variant="default">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                         <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>User ID: {user.user_id?.substring(0, 8)}...</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                            {user.company_name && (
                              <div className="flex items-center space-x-1">
                                <Building className="h-3 w-3" />
                                <span>{user.company_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground pl-12">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Key className="h-3 w-3" />
                          <span className="font-mono">
                            {user.api_key?.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => regenerateApiKey(user.user_id)}
                        disabled={isUpdating}
                      >
                        <Key className="h-3 w-3 mr-1" />
                        Regenerate API Key
                      </Button>
                      
                      <Button
                        variant={user.is_admin ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleAdminStatus(user.user_id, user.is_admin)}
                        disabled={isUpdating}
                      >
                        {user.is_admin ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Revoke Admin
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Make Admin
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};