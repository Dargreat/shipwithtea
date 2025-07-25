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
    let isInitialized = false;

    // Listen for auth changes first to avoid duplicate calls
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isInitialized || session?.user?.id !== user?.id) {
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchUserProfile(session.user.id);
          } else {
            setUserProfile(null);
          }
          isInitialized = true;
        }
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isInitialized) {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        }
        isInitialized = true;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation user={user} userProfile={userProfile} />
      
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-10 px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-16 max-w-7xl mx-auto min-h-[80vh] sm:min-h-[90vh] items-center w-full">
        <div className="flex-1 flex flex-col justify-center text-center lg:text-left transform opacity-0 animate-fade-in w-full">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-3 sm:mb-4 lg:mb-6 leading-tight sm:leading-none text-foreground px-2 sm:px-0">
            SHIP.<br />
            TRACK.<br />
            DELIVER.
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 px-4 sm:px-0">
            Join 10,000+ businesses shipping globally with confidence.
          </p>
        </div>
        
        <div className="flex-1 border border-primary/30 rounded-lg bg-primary/5 h-[300px] sm:h-[400px] md:h-[500px] lg:h-[650px] w-full transform opacity-0 animate-fade-in shadow-elegant max-w-full">
          <div className="grid grid-cols-2 gap-1 sm:gap-2 lg:gap-4 h-full p-1 sm:p-2 lg:p-4">
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
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-card border-b">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center px-2">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Form Section */}
      <section className="py-8 sm:py-12 lg:py-16 xl:py-24 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-6 sm:mb-8 lg:mb-12 xl:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-2 sm:mb-4 px-4">
              Ship With Confidence
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Get instant quotes and ship your packages worldwide with our easy-to-use platform
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto bg-card border rounded-lg sm:rounded-2xl shadow-elegant overflow-hidden">
            <div className="bg-primary text-primary-foreground px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 text-center">
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 lg:mb-3">
                Create New Shipment
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-primary-foreground/90">
                Fill in the details below to get started
              </p>
            </div>
            
            <div className="p-3 sm:p-6 lg:p-8 xl:p-10">
              <ShipmentCalculator user={user} onLoginRequired={handleLoginRequired} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 sm:py-16 lg:py-20 bg-gradient-card">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-4 px-4">
              Why Choose ShipWithTosin?
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              We provide world-class shipping services with unmatched reliability
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center shadow-card hover:shadow-primary transition-spring hover:scale-105">
                <CardContent className="pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 lg:pb-8 px-3 sm:px-4 lg:px-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-primary rounded-full mb-3 sm:mb-4 lg:mb-6">
                    <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8 sm:py-10 lg:py-12">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <span className="text-lg sm:text-xl font-bold">ShipWithTosin</span>
              </div>
              <p className="text-sm sm:text-base text-background/70">
                Your trusted shipping partner for fast, reliable, and affordable logistics solutions worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Services</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-background/70">
                <li>International Shipping</li>
                <li>Express Delivery</li>
                <li>Package Tracking</li>
                <li>Freight Services</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-background/70">
                <li>Customer Service</li>
                <li>FAQ</li>
                <li>Shipping Guide</li>
                <li>Contact Us</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Contact</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-background/70">
                <li>support@shipwithtosin.com</li>
                <li>+234 (0) 123 456 7890</li>
                <li>24/7 Support Available</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 mt-6 sm:mt-8 pt-4 sm:pt-6 lg:pt-8 text-center text-xs sm:text-sm text-background/70">
            <p>&copy; 2024 ShipWithTosin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
