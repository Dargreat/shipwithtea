import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  type: 'new_user' | 'api_regenerated' | 'new_comment' | 'new_order';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscriptions
    const ordersSubscription = supabase
      .channel('orders-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        addNotification({
          type: 'new_order',
          title: 'New Order Created',
          description: `Order from ${payload.new.ship_from} to ${payload.new.ship_to}`,
          timestamp: new Date(),
          read: false
        });
      })
      .subscribe();

    const profilesSubscription = supabase
      .channel('profiles-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        addNotification({
          type: 'new_user',
          title: 'New User Registered',
          description: `${payload.new.full_name || payload.new.company_name || 'New user'} joined`,
          timestamp: new Date(),
          read: false
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        // Check if API key was regenerated (simplified check)
        if (payload.old.api_key !== payload.new.api_key) {
          addNotification({
            type: 'api_regenerated',
            title: 'API Key Regenerated',
            description: `${payload.new.full_name || payload.new.company_name || 'User'} regenerated API key`,
            timestamp: new Date(),
            read: false
          });
        }
      })
      .subscribe();

    const commentsSubscription = supabase
      .channel('comments-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'blog_comments'
      }, (payload) => {
        addNotification({
          type: 'new_comment',
          title: 'New Blog Comment',
          description: `Comment by ${payload.new.author_name}`,
          timestamp: new Date(),
          read: false
        });
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
      commentsSubscription.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    // Since we don't have a notifications table, we'll simulate with recent activity
    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      // Fetch recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      // Fetch recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      // Fetch recent comments
      const { data: recentComments } = await supabase
        .from('blog_comments')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      const mockNotifications: Notification[] = [];

      // Add order notifications
      recentOrders?.forEach((order, index) => {
        mockNotifications.push({
          id: `order-${order.id}`,
          type: 'new_order',
          title: 'New Order Created',
          description: `Order from ${order.ship_from} to ${order.ship_to}`,
          timestamp: new Date(order.created_at),
          read: index > 2
        });
      });

      // Add user notifications
      recentUsers?.forEach((user, index) => {
        mockNotifications.push({
          id: `user-${user.id}`,
          type: 'new_user',
          title: 'New User Registered',
          description: `${user.full_name || user.company_name || 'New user'} joined`,
          timestamp: new Date(user.created_at),
          read: index > 1
        });
      });

      // Add comment notifications
      recentComments?.forEach((comment, index) => {
        mockNotifications.push({
          id: `comment-${comment.id}`,
          type: 'new_comment',
          title: 'New Blog Comment',
          description: `Comment by ${comment.author_name}`,
          timestamp: new Date(comment.created_at),
          read: index > 1
        });
      });

      // Sort by timestamp
      mockNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification = {
      ...notification,
      id: `${notification.type}-${Date.now()}`
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only latest 50
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_order': return '📦';
      case 'new_user': return '👤';
      case 'api_regenerated': return '🔑';
      case 'new_comment': return '💬';
      default: return '🔔';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{notification.title}</p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(notification.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};