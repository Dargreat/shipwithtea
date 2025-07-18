import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Truck,
  Eye,
  User,
  MapPin,
  Weight,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderManagementProps {
  onStatsUpdate: () => void;
}

export const OrderManagement = ({ onStatsUpdate }: OrderManagementProps) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // First get orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        toast({
          title: "Error Loading Orders",
          description: "Unable to load orders. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Then get profiles for the user names
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Combine orders with profile data
      const ordersWithProfiles = ordersData?.map(order => {
        const profile = profilesData?.find(p => p.user_id === order.user_id);
        return {
          ...order,
          profiles: profile ? { full_name: profile.full_name, user_id: profile.user_id } : null
        };
      }) || [];

      setOrders(ordersWithProfiles);

    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error Loading Orders",
        description: "Unable to load orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order:', error);
        toast({
          title: "Update Failed",
          description: "Unable to update order status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Order Updated",
        description: `Order status changed to ${status}.`,
      });

      fetchOrders();
      onStatsUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setIsUpdating(false);
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

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'shipped':
        return 'secondary';
      case 'delivered':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading orders...</p>
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
              <Package className="h-5 w-5 text-primary" />
              <span>Order Management</span>
            </div>
            <Button variant="outline" onClick={fetchOrders}>
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-smooth"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(order.status)}
                        <div>
                          <p className="font-medium text-foreground">
                            {order.ship_from} → {order.ship_to}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.weight}kg • {order.package_type}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                           <span>{order.profiles?.full_name || 'Unknown User'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        {order.estimated_cost && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>${order.estimated_cost.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {order.from_address && (
                        <div className="text-xs text-muted-foreground">
                          <p><strong>From:</strong> {order.from_address}</p>
                          {order.to_address && (
                            <p><strong>To:</strong> {order.to_address}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      
                      <div className="flex space-x-1">
                        {order.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'approved')}
                              disabled={isUpdating}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'rejected')}
                              disabled={isUpdating}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {order.status === 'approved' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                            disabled={isUpdating}
                          >
                            <Truck className="h-3 w-3 mr-1" />
                            Ship Order
                          </Button>
                        )}
                        
                        {order.status === 'shipped' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            disabled={isUpdating}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Delivered
                          </Button>
                        )}
                      </div>
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