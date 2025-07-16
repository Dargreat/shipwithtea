import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          api_key: string;
          user_id: string;
          full_name: string | null;
        };
      };
      pricing: {
        Row: {
          from_country: string;
          to_country: string;
          package_type: string;
          base_price: number | null;
          price_per_kg: number;
        };
      };
    };
  };
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const weight = url.searchParams.get('weight');
    const packageType = url.searchParams.get('package_type') || 'Standard';

    // Validate required parameters
    if (!from || !to || !weight) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: from, to, weight' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Validate API key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing or invalid API key. Include as: Authorization: Bearer YOUR_API_KEY' 
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');

    // Verify API key exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .eq('api_key', apiKey)
      .single();

    if (profileError || !profile) {
      console.error('API key validation failed:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid API key' 
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Get pricing for the route
    const { data: pricing, error: pricingError } = await supabase
      .from('pricing')
      .select('*')
      .eq('from_country', from)
      .eq('to_country', to)
      .eq('package_type', packageType)
      .single();

    if (pricingError || !pricing) {
      console.error('Pricing lookup failed:', pricingError);
      return new Response(
        JSON.stringify({ 
          error: `No pricing found for route: ${from} → ${to} (${packageType})`,
          suggestion: 'Check available routes or contact support'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Calculate total cost
    const weightNum = parseFloat(weight);
    const basePrice = pricing.base_price || 0;
    const weightCost = pricing.price_per_kg * weightNum;
    const totalCost = basePrice + weightCost;

    const response = {
      success: true,
      pricing: {
        from_country: pricing.from_country,
        to_country: pricing.to_country,
        package_type: pricing.package_type,
        weight: weightNum,
        base_price: basePrice,
        price_per_kg: pricing.price_per_kg,
        weight_cost: weightCost,
        total_cost: totalCost,
        currency: 'USD'
      },
      user: {
        name: profile.full_name
      },
      timestamp: new Date().toISOString()
    };

    console.log('Pricing API request successful:', {
      user: profile.user_id,
      route: `${from} → ${to}`,
      weight: weightNum,
      cost: totalCost
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in pricing API:', error);
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