import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlogCommentsProps {
  blogPostId: string;
}

export const BlogComments = ({ blogPostId }: BlogCommentsProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [commentForm, setCommentForm] = useState({
    authorName: '',
    authorEmail: '',
    content: '',
  });

  useEffect(() => {
    fetchComments();
  }, [blogPostId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('blog_post_id', blogPostId)
        .eq('is_approved', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentForm.authorName || !commentForm.authorEmail || !commentForm.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert([{
          blog_post_id: blogPostId,
          author_name: commentForm.authorName,
          author_email: commentForm.authorEmail,
          content: commentForm.content,
        }]);

      if (error) {
        console.error('Error submitting comment:', error);
        toast({
          title: "Comment Failed",
          description: "Unable to submit your comment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Comment Submitted",
        description: "Your comment has been submitted for review and will appear once approved.",
      });

      setCommentForm({
        authorName: '',
        authorEmail: '',
        content: '',
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Comments Display */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span>Comments ({comments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-smooth"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-accent rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-foreground">
                          {comment.author_name}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-foreground leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comment Form */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5 text-primary" />
            <span>Leave a Comment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="authorName">Name *</Label>
                <Input
                  id="authorName"
                  value={commentForm.authorName}
                  onChange={(e) => setCommentForm(prev => ({ ...prev, authorName: e.target.value }))}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorEmail">Email *</Label>
                <Input
                  id="authorEmail"
                  type="email"
                  value={commentForm.authorEmail}
                  onChange={(e) => setCommentForm(prev => ({ ...prev, authorEmail: e.target.value }))}
                  placeholder="Your email (will not be published)"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Comment *</Label>
              <Textarea
                id="content"
                value={commentForm.content}
                onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your thoughts..."
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="hero"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Comment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};