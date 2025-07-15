import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { ShipmentCalculator } from '@/components/ShipmentCalculator';
import { Package, Globe, Clock, Shield, Truck, Star } from 'lucide-react';
import heroImage from '@/assets/hero-shipping.jpg';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ShipmentData {
  shipFrom: string;
  shipTo: string;
  weight: string;
  packageType: string;
  fromAddress: string;
  toAddress: string;
}

export const HomePage = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [pendingShipmentData, setPendingShipmentData] = useState<ShipmentData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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

  const handleLoginRequired = (data: ShipmentData) => {
    setPendingShipmentData(data);
    navigate('/auth');
  };

  const features = [
    {
      icon: Globe,
      title: "Global Shipping",
      description: "Ship to over 200+ countries worldwide with reliable delivery"
    },
    {
      icon: Clock,
      title: "Fast Delivery",
      description: "Express shipping options available with tracking"
    },
    {
      icon: Shield,
      title: "Secure & Insured",
      description: "All shipments are fully insured and handled with care"
    },
    {
      icon: Package,
      title: "Easy Packaging",
      description: "Professional packaging services available"
    }
  ];

  const stats = [
    { number: "50K+", label: "Packages Delivered" },
    { number: "200+", label: "Countries Served" },
    { number: "98%", label: "On-Time Delivery" },
    { number: "24/7", label: "Customer Support" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} userProfile={userProfile} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        ></div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Ship With
              <span className="block bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                Tosin
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Fast, reliable, and affordable shipping solutions to anywhere in the world. 
              Your trusted partner for international logistics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" size="xl" className="text-lg">
                <Package className="h-5 w-5 mr-2" />
                Start Shipping
              </Button>
              <Button variant="outline" size="xl" className="text-lg bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Truck className="h-5 w-5 mr-2" />
                Track Package
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-card border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get Your Shipping Quote
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Calculate your shipping costs instantly with our easy-to-use calculator
            </p>
          </div>
          <ShipmentCalculator user={user} onLoginRequired={handleLoginRequired} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose ShipWithTosin?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We provide world-class shipping services with unmatched reliability
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center shadow-card hover:shadow-primary transition-spring hover:scale-105">
                <CardContent className="pt-8 pb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-6">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Our Customers Say
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Small Business Owner",
                content: "ShipWithTosin has been amazing for my business. Fast, reliable, and excellent customer service!",
                rating: 5
              },
              {
                name: "Michael Chen",
                role: "Online Seller",
                content: "The best shipping rates I've found. My customers are always happy with the delivery times.",
                rating: 5
              },
              {
                name: "Emma Williams",
                role: "Frequent Shipper",
                content: "Professional service and great tracking system. I never worry about my packages anymore.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Ship with Confidence?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us with their shipping needs
          </p>
          <Button variant="premium" size="xl" className="bg-white text-primary hover:bg-white/90">
            <Package className="h-5 w-5 mr-2" />
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">ShipWithTosin</span>
              </div>
              <p className="text-background/70">
                Your trusted shipping partner for fast, reliable, and affordable logistics solutions worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-background/70">
                <li>International Shipping</li>
                <li>Express Delivery</li>
                <li>Package Tracking</li>
                <li>Freight Services</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-background/70">
                <li>Customer Service</li>
                <li>FAQ</li>
                <li>Shipping Guide</li>
                <li>Contact Us</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-background/70">
                <li>support@shipwithtosin.com</li>
                <li>+234 (0) 123 456 7890</li>
                <li>24/7 Support Available</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 mt-8 pt-8 text-center text-background/70">
            <p>&copy; 2024 ShipWithTosin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};