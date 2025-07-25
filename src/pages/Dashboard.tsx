import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { Package, Truck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isInitialized = false;

    // Listen for auth changes first to avoid duplicate calls
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          navigate('/auth');
          return;
        }
        
        // Only fetch data if user changed or first initialization
        if (!isInitialized || session.user.id !== user?.id) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
          await fetchOrders(session.user.id);
          isInitialized = true;
        }
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate('/auth');
        return;
      }
      
      if (!isInitialized) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
        fetchOrders(session.user.id);
        isInitialized = true;
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for orders
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchOrders(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchOrders = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error Loading Orders",
          description: "Unable to load your orders. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'shipped':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'delivered':
        return 'text-green-700 bg-green-100 border-green-300';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Clock className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">Loading Dashboard...</h2>
        <p className="text-muted-foreground">Please wait while we load your data</p>
      </div>
    </div>;
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation user={user} userProfile={userProfile} />
      
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 w-full max-w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2 break-words">
            Welcome back, {userProfile?.full_name || user.email}!
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            Manage your shipments and track your orders from your dashboard.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8 w-full">
          <Card className="shadow-card">
            <CardContent className="pt-2 sm:pt-3 lg:pt-4 pb-2 sm:pb-3 lg:pb-4 px-2 sm:px-3 lg:px-4">
              <div className="flex items-center">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">Total Orders</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-2 sm:pt-3 lg:pt-4 pb-2 sm:pb-3 lg:pb-4 px-2 sm:px-3 lg:px-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-500 flex-shrink-0" />
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">Pending</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {orders.filter(order => order.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-2 sm:pt-3 lg:pt-4 pb-2 sm:pb-3 lg:pb-4 px-2 sm:px-3 lg:px-4">
              <div className="flex items-center">
                <Truck className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-500 flex-shrink-0" />
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">Shipped</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {orders.filter(order => order.status === 'shipped').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-2 sm:pt-3 lg:pt-4 pb-2 sm:pb-3 lg:pb-4 px-2 sm:px-3 lg:px-4">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-500 flex-shrink-0" />
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">Delivered</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {orders.filter(order => order.status === 'delivered').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full">
          {/* API Key Section */}
          <div className="xl:col-span-1">
            <div className="lg:sticky lg:top-8">
              <ApiKeyManager 
                userProfile={userProfile} 
                onApiKeyUpdate={() => fetchUserProfile(user.id)}
              />
            </div>
          </div>

          {/* Recent Orders */}
          <div className="xl:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Recent Orders</span>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/')} size="sm">
                    Create New Order
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No orders yet</p>
                    <Button variant="hero" onClick={() => navigate('/')}>
                      Create Your First Order
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-smooth gap-3"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="mt-1 flex-shrink-0">
                            {getStatusIcon(order.status)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground text-sm sm:text-base truncate">
                              {order.ship_from} → {order.ship_to}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {order.weight}kg • {order.package_type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {order.status === 'shipped' ? 'In Transit' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </div>
                          {order.estimated_cost && (
                            <p className="text-sm font-medium text-foreground">
                              {order.currency === 'NGN' ? '₦' : '$'}{order.estimated_cost.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {orders.length > 5 && (
                      <div className="text-center pt-4">
                        <Button variant="ghost">
                          View All Orders ({orders.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};