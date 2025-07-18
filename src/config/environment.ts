// Environment configuration for API endpoints
export const config = {
  // Supabase configuration (auto-managed)
  supabase: {
    url: "https://udituntwllttyejobufm.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaXR1bnR3bGx0dHllam9idWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NDcyOTUsImV4cCI6MjA2ODAyMzI5NX0.AlMbHfIZWDH2_wQoqx9-mu5FjV2AggNlh5ldj_HxN6c"
  },
  
  // API endpoints - update these after deployment
  api: {
    // During development
    pricingApi: "https://udituntwllttyejobufm.supabase.co/functions/v1/pricing-api",
    adminStatsApi: "https://udituntwllttyejobufm.supabase.co/functions/v1/admin-stats",
    
    // After deployment to your domain, update to:
    // pricingApi: "https://yourdomain.com/api/pricing",
    // adminStatsApi: "https://yourdomain.com/api/admin-stats",
  }
};

// Helper function to get API endpoints
export const getApiUrl = (endpoint: keyof typeof config.api) => {
  return config.api[endpoint];
};