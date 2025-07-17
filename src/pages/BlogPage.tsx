import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  featured_image_url?: string;
}

export const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      }
    });
    fetchBlogPosts();
    
    // Set up real-time listener for blog posts
    const channel = supabase
      .channel('blog-posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_posts'
        },
        () => {
          fetchBlogPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const fetchBlogPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching blog posts:', error);
        toast({
          title: "Error Loading Posts",
          description: "Unable to load blog posts. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} userProfile={userProfile} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Shipping Blog
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay updated with the latest shipping news, tips, and insights from our logistics experts.
            </p>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-6">
                  <div className="h-6 w-3/4 bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-4 w-full bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded mb-4"></div>
                  <div className="flex items-center space-x-4">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-8">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Posts Yet</h3>
                <p className="text-muted-foreground">
                  We're working on creating great content for you. Check back soon!
                </p>
              </div>
              <Link to="/">
                <Button variant="hero">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          ) : (
            /* Blog Posts Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Card key={post.id} className="shadow-card hover:shadow-lg transition-shadow group">
                  {post.featured_image_url && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <User className="h-3 w-3 ml-2" />
                      <span>Admin</span>
                    </div>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                      {post.excerpt || post.content.substring(0, 150) + '...'}
                    </p>
                    <Link to={`/blog/${post.slug}`}>
                      <Button variant="ghost" className="p-0 h-auto font-medium">
                        Read More →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Call to Action */}
          {posts.length > 0 && (
            <div className="text-center mt-16 py-12 bg-gradient-card rounded-lg border border-primary/20">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Ready to Ship?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get instant quotes and manage your shipments with our platform.
              </p>
              <Link to="/">
                <Button variant="hero" size="lg">
                  Calculate Shipping Cost
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};