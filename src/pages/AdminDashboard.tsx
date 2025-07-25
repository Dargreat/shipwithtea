import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';
import { 
  Users, 
  Package, 
  FileText, 
  Settings, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Upload,
  Key,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { BlogManagement } from '@/components/admin/BlogManagement';
import { PricingManagement } from '@/components/admin/PricingManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { ApiKeyViewer } from '@/components/admin/ApiKeyViewer';
import { CommentManagement } from '@/components/admin/CommentManagement';

export const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalBlogPosts: 0,
    publishedBlogPosts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isInitialized = false;

    // Listen for auth changes first to avoid duplicate calls
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          navigate('/admin-auth');
          return;
        }
        
        // Only check admin status if user changed or first initialization
        if (!isInitialized || session.user.id !== user?.id) {
          setUser(session.user);
          await checkAdminStatus(session.user.id);
          isInitialized = true;
        }
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate('/admin-auth');
        return;
      }
      
      if (!isInitialized) {
        setUser(session.user);
        checkAdminStatus(session.user.id);
        isInitialized = true;
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/admin-auth');
        return;
      }

      if (!data?.is_admin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/admin-auth');
        return;
      }

      setUserProfile(data);
      fetchStats();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/admin-auth');
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch order stats
      const { data: orders } = await supabase
        .from('orders')
        .select('status');

      // Fetch blog stats
      const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('published');

      setStats({
        totalUsers: userCount || 0,
        totalOrders: orders?.length || 0,
        pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
        totalBlogPosts: blogPosts?.length || 0,
        publishedBlogPosts: blogPosts?.filter(b => b.published).length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold mb-2">Checking permissions...</h2>
          <p className="text-muted-foreground">Verifying admin access</p>
        </div>
      </div>
    );
  }

  if (userProfile && !userProfile.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have admin privileges.</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} userProfile={userProfile} />
      
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage users, orders, blog posts, and platform settings.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 sm:mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Users</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Orders</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Pending Orders</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Blog Posts</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalBlogPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500 flex-shrink-0" />
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Published</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.publishedBlogPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1 min-w-max md:min-w-0">
              <TabsTrigger value="orders" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Users</span>
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Blog</span>
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Comments</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Pricing</span>
              </TabsTrigger>
              <TabsTrigger value="api-keys" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                <Key className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm whitespace-nowrap">API Keys</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="orders">
            <OrderManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="comments">
            <CommentManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingManagement />
          </TabsContent>

          <TabsContent value="api-keys">
            <ApiKeyViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};