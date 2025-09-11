import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Heart, 
  Reply,
  Send,
  Loader2,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { socialFeedService, Comment } from '@/services/socialFeedService';

interface CommentSectionProps {
  postId: string;
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (newCount: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, user, isOpen, onClose, onCommentCountChange }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadComments();
      
      // Subscribe to real-time comment interaction updates
      socialFeedService.subscribeToCommentInteractions(
        (commentId, interactionType, delta) => {
          if (interactionType === 'like') {
            // Update the comment like count in real-time
            setComments(prev => {
              const updateCommentLikeCount = (commentsList: Comment[], targetId: string, likeDelta: number): Comment[] => {
                return commentsList.map(comment => {
                  if (comment.id === targetId) {
                    return { ...comment, likes_count: Math.max(0, comment.likes_count + likeDelta) };
                  }
                  if (comment.replies) {
                    return {
                      ...comment,
                      replies: comment.replies.map(reply =>
                        reply.id === targetId
                          ? { ...reply, likes_count: Math.max(0, reply.likes_count + likeDelta) }
                          : reply
                      )
                    };
                  }
                  return comment;
                });
              };
              
              return updateCommentLikeCount(prev, commentId, delta);
            });
          }
        }
      );
    }

    return () => {
      // Clean up subscription when component unmounts or dialog closes
      socialFeedService.unsubscribeAll();
    };
  }, [isOpen, postId]);

  // Calculate total comment count (including replies)
  const calculateTotalComments = (commentsList: Comment[]) => {
    return commentsList.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0);
    }, 0);
  };

  // Update parent with comment count whenever comments change
  useEffect(() => {
    if (onCommentCountChange) {
      const totalCount = calculateTotalComments(comments);
      onCommentCountChange(totalCount);
    }
  }, [comments, onCommentCountChange]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const fetchedComments = await socialFeedService.getPostComments(postId, user.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user.id) {return;}
    
    setSubmitting(true);
    try {
      const commentData = {
        post_id: postId,
        content: newComment.trim()
      };
      
      const createdComment = await socialFeedService.addComment(commentData, user.id);
      if (createdComment) {
        setComments(prev => [...prev, createdComment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim() || !user.id) {return;}
    
    setSubmitting(true);
    try {
      const replyData = {
        post_id: postId,
        content: replyContent.trim(),
        parent_comment_id: parentCommentId
      };
      
      const createdReply = await socialFeedService.addComment(replyData, user.id);
      if (createdReply) {
        // Add reply to the parent comment
        setComments(prev => prev.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), createdReply]
            };
          }
          return comment;
        }));
        setReplyContent('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user.id) {return;}
    
    // Find the comment for optimistic updates
    const findCommentInList = (comments: Comment[], targetId: string): Comment | null => {
      for (const comment of comments) {
        if (comment.id === targetId) {return comment;}
        if (comment.replies) {
          const reply = comment.replies.find(r => r.id === targetId);
          if (reply) {return reply;}
        }
      }
      return null;
    };

    const targetComment = findCommentInList(comments, commentId);
    if (!targetComment) {return;}

    const wasLiked = targetComment.is_liked;
    const currentLikeCount = targetComment.likes_count;

    // Optimistic update
    const updateCommentLikeState = (commentsList: Comment[], targetId: string, isLiked: boolean, likeCount: number) => {
      return commentsList.map(comment => {
        if (comment.id === targetId) {
          return { ...comment, is_liked: isLiked, likes_count: likeCount };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply.id === targetId 
                ? { ...reply, is_liked: isLiked, likes_count: likeCount }
                : reply
            )
          };
        }
        return comment;
      });
    };

    // Apply optimistic update
    setComments(prev => updateCommentLikeState(prev, commentId, !wasLiked, currentLikeCount + (!wasLiked ? 1 : -1)));

    try {
      const isLiked = await socialFeedService.toggleCommentLike(commentId, user.id);
      
      // Sync with server result
      setComments(prev => updateCommentLikeState(prev, commentId, isLiked, currentLikeCount + (isLiked ? 1 : -1)));
    } catch (error) {
      console.error('Error toggling comment like:', error);
      
      // Rollback optimistic update on error
      setComments(prev => updateCommentLikeState(prev, commentId, wasLiked, currentLikeCount));
      
      toast.error('Failed to update comment like. Please try again.');
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {return 'Just now';}
    if (diffInSeconds < 3600) {return `${Math.floor(diffInSeconds / 60)}m ago`;}
    if (diffInSeconds < 86400) {return `${Math.floor(diffInSeconds / 3600)}h ago`;}
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!isOpen) {return null;}

  return (
    <div className="border-t border-gray-200 mt-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Comments ({comments.length})
        </h4>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* Comment Input */}
      <div className="mb-6">
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              {(user.user_metadata?.full_name || user.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                size="sm"
                className="bg-gradapp-primary hover:bg-gradapp-accent"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gradapp-primary" />
          <span className="ml-2 text-gray-600">Loading comments...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                {/* Main Comment */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.author?.profile_image_url} />
                    <AvatarFallback>
                      {(comment.author?.display_name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900">
                          {comment.author?.display_name || 'Unknown User'}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(comment.created_at)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-800">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCommentLike(comment.id)}
                        className={`text-xs transition-colors hover:text-red-500 ${
                          comment.is_liked ? 'text-red-500' : 'text-gray-500'
                        }`}
                        title={`${comment.likes_count} ${comment.likes_count === 1 ? 'like' : 'likes'}`}
                      >
                        <Heart className={`h-3 w-3 mr-1 ${comment.is_liked ? 'fill-current' : ''}`} />
                        Like{comment.likes_count > 0 && ` (${comment.likes_count})`}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-gray-500 hover:text-blue-500"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    </div>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 ml-4">
                        <div className="flex gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {(user.user_metadata?.full_name || user.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <Textarea
                              placeholder="Write a reply..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="min-h-[60px] resize-none text-sm"
                            />
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={!replyContent.trim() || submitting}
                                size="sm"
                                className="bg-gradapp-primary hover:bg-gradapp-accent text-xs"
                              >
                                {submitting ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3 mr-1" />
                                )}
                                Reply
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-4 mt-3 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={reply.author?.profile_image_url} />
                              <AvatarFallback className="text-xs">
                                {(reply.author?.display_name || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-xs text-gray-900">
                                    {reply.author?.display_name || 'Unknown User'}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="h-2 w-2" />
                                    {formatTimeAgo(reply.created_at)}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-800">{reply.content}</p>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleCommentLike(reply.id)}
                                  className={`text-xs transition-colors hover:text-red-500 ${
                                    reply.is_liked ? 'text-red-500' : 'text-gray-500'
                                  }`}
                                  title={`${reply.likes_count || 0} ${(reply.likes_count || 0) === 1 ? 'like' : 'likes'}`}
                                >
                                  <Heart className={`h-2 w-2 mr-1 ${reply.is_liked ? 'fill-current' : ''}`} />
                                  Like{(reply.likes_count || 0) > 0 && ` (${reply.likes_count})`}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;