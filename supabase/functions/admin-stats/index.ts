import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Fetch comprehensive stats
    const [
      { count: totalUsers },
      { data: orders },
      { data: blogPosts },
      { count: totalPricing },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('status, estimated_cost, created_at'),
      supabase.from('blog_posts').select('published, created_at'),
      supabase.from('pricing').select('*', { count: 'exact', head: true }),
    ]);

    // Calculate order stats
    const orderStats = {
      total: orders?.length || 0,
      pending: orders?.filter(o => o.status === 'pending').length || 0,
      approved: orders?.filter(o => o.status === 'approved').length || 0,
      rejected: orders?.filter(o => o.status === 'rejected').length || 0,
      'in-transit': orders?.filter(o => o.status === 'in-transit').length || 0,
      delivered: orders?.filter(o => o.status === 'delivered').length || 0,
    };

    // Calculate revenue stats
    const revenue = {
      total: orders?.reduce((sum, order) => sum + (order.estimated_cost || 0), 0) || 0,
      thisMonth: orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }).reduce((sum, order) => sum + (order.estimated_cost || 0), 0) || 0,
    };

    // Calculate blog stats
    const blogStats = {
      total: blogPosts?.length || 0,
      published: blogPosts?.filter(post => post.published).length || 0,
      drafts: blogPosts?.filter(post => !post.published).length || 0,
    };

    const response = {
      success: true,
      stats: {
        users: {
          total: totalUsers || 0,
        },
        orders: orderStats,
        revenue,
        blog: blogStats,
        pricing: {
          total: totalPricing || 0,
        },
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Admin stats requested by:', user.email);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in admin stats API:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);