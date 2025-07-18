import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { BlogComments } from '@/components/BlogComments';
import { Calendar, User, ArrowLeft, Clock, Share2, Copy } from 'lucide-react';
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

export const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
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
    
    if (slug) {
      fetchBlogPost(slug);
    }
  }, [slug]);

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

  const fetchBlogPost = async (postSlug: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', postSlug)
        .eq('published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Post not found
          navigate('/blog');
          toast({
            title: "Post Not Found",
            description: "The blog post you're looking for doesn't exist.",
            variant: "destructive",
          });
        } else {
          console.error('Error fetching blog post:', error);
          toast({
            title: "Error Loading Post",
            description: "Unable to load the blog post. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      setPost(data);
    } catch (error) {
      console.error('Error fetching blog post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sharePost = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.content.substring(0, 150),
          url: window.location.href,
        });
        toast({
          title: "Shared Successfully",
          description: "Post has been shared!",
        });
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback to copying URL
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast({
            title: "Link Copied",
            description: "Post URL has been copied to clipboard.",
          });
        } catch (clipboardError) {
          toast({
            title: "Share Failed",
            description: "Unable to share or copy link.",
            variant: "destructive",
          });
        }
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied", 
          description: "Post URL has been copied to clipboard.",
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Unable to copy link to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} userProfile={userProfile} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="inline-flex items-center space-x-2">
              <Clock className="h-5 w-5 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading post...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} userProfile={userProfile} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/blog">
              <Button variant="hero">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} userProfile={userProfile} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-8">
            <Link to="/blog">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>

          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="aspect-video overflow-hidden rounded-lg mb-8">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Admin</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={sharePost}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <Card className="shadow-card">
            <CardContent className="p-8">
              <div 
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-blockquote:text-muted-foreground prose-blockquote:border-primary"
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }}
              />
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="mt-12">
            <BlogComments blogPostId={post.id} />
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center py-12 bg-gradient-card rounded-lg border border-primary/20">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to Ship Your Package?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get instant quotes and manage your shipments with our reliable platform.
            </p>
            <Link to="/">
              <Button variant="hero" size="lg">
                Calculate Shipping Cost
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};