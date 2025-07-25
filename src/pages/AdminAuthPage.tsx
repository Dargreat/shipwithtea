import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Mail, Lock, User, Phone, Building, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AdminAuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    companyName: '',
  });

  useEffect(() => {
    // Check if user is already logged in and is admin
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        checkAdminStatus(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          checkAdminStatus(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data?.is_admin) {
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signInData.email || !signInData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Sign In Failed",
            description: "Invalid email or password. Please check your credentials and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign In Failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      // Check if user is admin
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (profileError || !profile?.is_admin) {
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "This account does not have admin privileges.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Welcome Admin!",
          description: "You have been signed in successfully.",
        });
        navigate('/admin');
      }

    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signUpData.email || !signUpData.password || !signUpData.fullName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (signUpData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: `https://tosinadegbola.com/admin`,
          data: {
            full_name: signUpData.fullName,
            phone: signUpData.phone,
            company_name: signUpData.companyName,
            is_admin: true, // Mark as admin during signup
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account Exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user && !data.session) {
        toast({
          title: "Admin Account Created!",
          description: "Please check your email to verify your account, then sign in.",
        });
      } else {
        // Update profile to mark as admin
        if (data.user) {
          await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('user_id', data.user.id);
        }

        toast({
          title: "Admin Account Created!",
          description: "Your admin account has been created successfully.",
        });
      }

      // Clear form and switch to sign in tab
      setSignUpData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        companyName: '',
      });

    } catch (error: any) {
      toast({
        title: "Sign Up Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 group">
            <div className="p-3 bg-white/10 rounded-xl group-hover:scale-105 transition-spring border border-white/20">
              <img src="/tea.png" alt="Ship With Tosin Logo" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-2xl font-bold text-white">Admin Portal</span>
          </Link>
        </div>

        <Card className="shadow-primary border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-foreground flex items-center justify-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span>Admin Access</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Admin Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-signin-email">Admin Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-signin-email"
                        type="email"
                        placeholder="Enter admin email"
                        className="pl-10"
                        value={signInData.email}
                        onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-signin-password"
                        type="password"
                        placeholder="Enter admin password"
                        className="pl-10"
                        value={signInData.password}
                        onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="hero"
                    size="lg"
                    disabled={isLoading}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {isLoading ? 'Signing In...' : 'Admin Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-signup-name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-signup-name"
                        type="text"
                        placeholder="Enter full name"
                        className="pl-10"
                        value={signUpData.fullName}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, fullName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-signup-email">Admin Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-signup-email"
                        type="email"
                        placeholder="Enter admin email"
                        className="pl-10"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-signup-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-signup-phone"
                        type="tel"
                        placeholder="Enter phone number"
                        className="pl-10"
                        value={signUpData.phone}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-signup-company">Company Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-signup-company"
                        type="text"
                        placeholder="Enter company name (optional)"
                        className="pl-10"
                        value={signUpData.companyName}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, companyName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-signup-password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-signup-password"
                        type="password"
                        placeholder="Create a password (min. 6 characters)"
                        className="pl-10"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-signup-confirm-password">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-signup-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="hero"
                    size="lg"
                    disabled={isLoading}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {isLoading ? 'Creating Admin...' : 'Create Admin Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Link 
                to="/" 
                className="text-sm text-muted-foreground hover:text-primary transition-smooth"
              >
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};