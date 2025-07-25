import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Search,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  FileText,
  Mail
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CommentManagementProps {
  onStatsUpdate: () => void;
}

export const CommentManagement = ({ onStatsUpdate }: CommentManagementProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [filteredComments, setFilteredComments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    // Filter comments based on search term
    const filtered = comments.filter(comment => 
      comment.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.blog_posts?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredComments(filtered);
  }, [comments, searchTerm]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          *,
          blog_posts(title, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: "Error Loading Comments",
          description: "Unable to load comments. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCommentStatus = async (commentId: string, isApproved: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({ is_approved: isApproved })
        .eq('id', commentId);

      if (error) {
        console.error('Error updating comment:', error);
        toast({
          title: "Update Failed",
          description: "Unable to update comment status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Comment Updated",
        description: `Comment ${isApproved ? 'approved' : 'rejected'} successfully.`,
      });

      fetchComments();
      onStatsUpdate();
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        toast({
          title: "Delete Failed",
          description: "Unable to delete comment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Comment Deleted",
        description: "Comment deleted successfully.",
      });

      fetchComments();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading comments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span>Comment Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search comments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" onClick={fetchComments}>
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No comments match your search' : 'No comments found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-smooth"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-accent rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-foreground">
                              {comment.author_name}
                            </p>
                            <Badge variant={comment.is_approved ? "default" : "outline"}>
                              {comment.is_approved ? 'Approved' : 'Pending'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{comment.author_email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            {comment.blog_posts && (
                              <div className="flex items-center space-x-1">
                                <FileText className="h-3 w-3" />
                                <span>{comment.blog_posts.title}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pl-12">
                        <p className="text-foreground leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {!comment.is_approved && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => updateCommentStatus(comment.id, true)}
                          disabled={isUpdating}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      )}
                      
                      {comment.is_approved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCommentStatus(comment.id, false)}
                          disabled={isUpdating}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      )}
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteComment(comment.id)}
                        disabled={isUpdating}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};