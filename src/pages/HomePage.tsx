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
      <section className="flex flex-col lg:flex-row gap-6 lg:gap-10 px-4 sm:px-6 lg:px-8 py-8 lg:py-16 max-w-7xl mx-auto min-h-[90vh] items-center">
        <div className="flex-1 flex flex-col justify-center text-center lg:text-left transform opacity-0 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold mb-4 lg:mb-6 leading-none text-foreground">
            SHIP.<br />
            TRACK.<br />
            DELIVER.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
            Join 10,000+ businesses shipping globally with confidence.
          </p>
        </div>
        
        <div className="flex-1 border border-primary/30 rounded-lg bg-primary/5 h-[400px] sm:h-[500px] lg:h-[650px] w-full transform opacity-0 animate-fade-in shadow-elegant">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 h-full p-2 sm:p-4">
            <div className="border border-primary overflow-hidden transition-all duration-300 hover:scale-95 hover:shadow-primary/20 hover:shadow-lg rounded">
              <img 
                src="https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?q=80&w=1415&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                alt="Cargo Ship" 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="border border-primary overflow-hidden transition-all duration-300 hover:scale-95 hover:shadow-primary/20 hover:shadow-lg rounded">
              <img 
                src="https://images.unsplash.com/photo-1645865406062-872af9faa81a?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                alt="Air Freight" 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="col-span-2 border border-primary overflow-hidden transition-all duration-300 hover:scale-95 hover:shadow-primary/20 hover:shadow-lg rounded">
              <img 
                src="https://images.unsplash.com/photo-1601172449745-ec49ac55ae13?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                alt="Warehouse" 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-card border-b">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-sm sm:text-base text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Form Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Ship With Confidence
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Get instant quotes and ship your packages worldwide with our easy-to-use platform
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto bg-card border rounded-2xl shadow-elegant overflow-hidden">
            <div className="bg-primary text-primary-foreground px-6 sm:px-10 py-6 sm:py-8 text-center">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">
                Create New Shipment
              </h3>
              <p className="text-sm sm:text-base text-primary-foreground/90">
                Fill in the details below to get started
              </p>
            </div>
            
            <div className="p-6 sm:p-8 lg:p-10">
              <ShipmentCalculator user={user} onLoginRequired={handleLoginRequired} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose ShipWithTosin?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              We provide world-class shipping services with unmatched reliability
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Our Customers Say
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Ship with Confidence?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
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
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
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