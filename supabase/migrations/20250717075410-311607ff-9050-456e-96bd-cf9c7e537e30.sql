-- Enable real-time for blog posts
ALTER TABLE public.blog_posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_posts;

-- Enable real-time for pricing
ALTER TABLE public.pricing REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing;

-- Enable real-time for orders
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;