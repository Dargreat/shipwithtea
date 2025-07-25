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
          naira_base_price: number | null;
          naira_price_per_kg: number | null;
          currency: string;
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
    const packageType = url.searchParams.get('packageType') || url.searchParams.get('package_type');
    const currency = url.searchParams.get('currency') || 'USD';

    // Validate required parameters
    if (!from || !to || !weight || !packageType) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required parameters: from, to, weight, packageType',
          example: '?from=Nigeria&to=Ghana&weight=2&packageType=document'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Validate weight is a positive number
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Weight must be a positive number'
        }),
        { 
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400 
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
          success: false,
          error: 'Invalid API key. Please check your API key and try again.' 
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Get pricing for the route - exact match only
    const { data: pricing, error: pricingError } = await supabase
      .from('pricing')
      .select('*')
      .eq('from_country', from)
      .eq('to_country', to)
      .eq('package_type', packageType)
      .single();

    // Check if pricing rules exist
    if (pricingError || !pricing) {
      console.log(`No pricing rules found for route: ${from} → ${to} (${packageType})`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No pricing rules yet',
          message: `No pricing configuration found for route ${from} to ${to} with package type ${packageType}. Please contact support to set up pricing for this route.`
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Calculate costs for both currencies
    const usdCost = {
      basePrice: Number(pricing.base_price) || 0,
      pricePerKg: Number(pricing.price_per_kg),
      weightCost: Number(pricing.price_per_kg) * weightNum,
      totalCost: (Number(pricing.base_price) || 0) + (Number(pricing.price_per_kg) * weightNum)
    };
    
    let ngnCost = null;
    if (pricing.naira_base_price !== null && pricing.naira_price_per_kg !== null) {
      ngnCost = {
        basePrice: Number(pricing.naira_base_price) || 0,
        pricePerKg: Number(pricing.naira_price_per_kg),
        weightCost: Number(pricing.naira_price_per_kg) * weightNum,
        totalCost: (Number(pricing.naira_base_price) || 0) + (Number(pricing.naira_price_per_kg) * weightNum)
      };
    }
    
    // Determine main currency and cost to return
    const requestedCurrency = currency.toUpperCase();
    let mainCost, finalCurrency;
    
    if (requestedCurrency === 'NGN' && ngnCost) {
      mainCost = ngnCost;
      finalCurrency = 'NGN';
    } else {
      mainCost = usdCost;
      finalCurrency = 'USD';
    }
    
    const estimatedDelivery = '5-7 business days';

    const response = {
      success: true,
      cost: parseFloat(mainCost.totalCost.toFixed(2)),
      currency: finalCurrency,
      breakdown: {
        base_price: parseFloat(mainCost.basePrice.toFixed(2)),
        weight_cost: parseFloat(mainCost.weightCost.toFixed(2)),
        total: parseFloat(mainCost.totalCost.toFixed(2))
      },
      costs: {
        usd: {
          base_price: parseFloat(usdCost.basePrice.toFixed(2)),
          weight_cost: parseFloat(usdCost.weightCost.toFixed(2)),
          total: parseFloat(usdCost.totalCost.toFixed(2))
        },
        ngn: ngnCost ? {
          base_price: parseFloat(ngnCost.basePrice.toFixed(2)),
          weight_cost: parseFloat(ngnCost.weightCost.toFixed(2)),
          total: parseFloat(ngnCost.totalCost.toFixed(2))
        } : null
      },
      route: `${from} → ${to}`,
      weight: weightNum,
      package_type: packageType,
      estimated_delivery: estimatedDelivery,
      user: profile.full_name || "Unknown User",
      timestamp: new Date().toISOString()
    };

    console.log('Pricing API request successful:', {
      user: profile.user_id,
      route: `${from} → ${to}`,
      weight: weightNum,
      cost: mainCost.totalCost
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
        success: false,
        error: 'Internal server error. Please try again later.',
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