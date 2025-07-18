import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Package, Menu, X, User, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminNotifications } from '@/components/admin/AdminNotifications';

interface NavigationProps {
  user?: any;
  userProfile?: any;
}

export const Navigation = ({ user, userProfile }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/api-docs', label: 'API Docs' },
  ];

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-105 transition-spring">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ShipWithTosin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-foreground hover:text-primary transition-smooth"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
                {userProfile?.is_admin && (
                  <>
                    <AdminNotifications />
                    <Button
                      variant="outline"
                      onClick={() => navigate('/admin')}
                      size="sm"
                    >
                      Admin
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  size="sm"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
                <Button
                  variant="hero"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-foreground hover:text-primary transition-smooth py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-border">
                {user ? (
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate('/dashboard');
                        setIsMenuOpen(false);
                      }}
                      className="justify-start"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                    {userProfile?.is_admin && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigate('/admin');
                          setIsMenuOpen(false);
                        }}
                        className="justify-start"
                      >
                        Admin Panel
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate('/auth');
                        setIsMenuOpen(false);
                      }}
                      className="justify-start"
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="hero"
                      onClick={() => {
                        navigate('/auth');
                        setIsMenuOpen(false);
                      }}
                      className="justify-start"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};