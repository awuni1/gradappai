// import { supabase } from '@/integrations/supabase/client';
// import { User } from '@supabase/supabase-js';
// import { toast } from 'sonner';
// import { userProfileService } from './userProfileService';

// export interface Post {
//   id: string;
//   author_id: string;
//   content: string;
//   media_urls?: string[];
//   post_type: 'text' | 'achievement' | 'question' | 'resource' | 'event';
//   visibility: 'public' | 'connections' | 'mentors' | 'private';
//   tags?: string[];
//   location?: string;
//   likes_count: number;
//   comments_count: number;
//   shares_count: number;
//   created_at: string;
//   updated_at: string;
//   author?: {
//     id: string;
//     display_name: string;
//     profile_image_url?: string;
//     field_of_study?: string;
//     academic_level?: string;
//     verified_status: boolean;
//   };
//   is_liked?: boolean;
//   is_saved?: boolean;
// }

// export interface Comment {
//   id: string;
//   post_id: string;
//   author_id: string;
//   content: string;
//   parent_comment_id?: string;
//   likes_count: number;
//   created_at: string;
//   updated_at: string;
//   author?: {
//     id: string;
//     display_name: string;
//     profile_image_url?: string;
//   };
//   is_liked?: boolean;
//   replies?: Comment[];
// }

// export interface PostInput {
//   content: string;
//   post_type?: 'text' | 'achievement' | 'question' | 'resource' | 'event';
//   visibility?: 'public' | 'connections' | 'mentors' | 'private';
//   tags?: string[];
//   location?: string;
//   media_urls?: string[];
// }

// export interface CommentInput {
//   post_id: string;
//   content: string;
//   parent_comment_id?: string;
// }

// class SocialFeedService {
//   private subscriptions = new Map<string, any>();

//   /**
//    * Get posts for the social feed with pagination
//    * Falls back to demo data if GradNet tables don't exist
//    */
//   async getFeedPosts(
//     userId: string,
//     limit = 20,
//     offset = 0,
//     feedType: 'all' | 'connections' | 'following' = 'all'
//   ): Promise<Post[]> {
//     try {
//       // Use actual gradnet_posts table from database schema
//       let query = supabase
//         .from('gradnet_posts')
//         .select('*')
//         .order('created_at', { ascending: false })
//         .range(offset, offset + limit - 1);

//       // Apply feed filtering based on type
//       if (feedType === 'connections') {
//         // Try to use user_connections table, fallback to public posts only
//         query = query.or(`visibility.eq.public,author_id.eq.${userId}`);
//       } else {
//         // For 'all' feed, show public posts and user's own posts
//         query = query.or(`visibility.eq.public,author_id.eq.${userId}`);
//       }

//       const { data: posts, error: postsError } = await query;

//       if (postsError) {
//         if (postsError.code === '42P01') {
//           console.log('gradnet_posts table not found, using demo posts');
//           return this.getDemoPosts();
//         }
//         throw postsError;
//       }

//       if (!posts || posts.length === 0) {
//         return [];
//       }

//       // Process the data and fetch author information
//       const processedPosts = await Promise.all(
//         posts.map(async (post) => {
//           // Try to fetch author profile from user_profiles, use fallback if missing
//           let authorProfile = null;
//           try {
//             const { data: profile } = await supabase
//               .from('user_profiles')
//               .select('display_name, profile_image_url, field_of_study, academic_level, verified_status')
//               .eq('user_id', post.author_id)
//               .single();
//             authorProfile = profile;
//           } catch {
//             // Fallback: use auth.users data or default
//           }
          
//           // Check like status using gradnet_likes table
//           let isLiked = false;
//           let isSaved = false;
//           try {
//             const { data: likeData } = await supabase
//               .from('gradnet_likes')
//               .select('id')
//               .eq('post_id', post.id)
//               .eq('user_id', userId)
//               .single();
//             isLiked = Boolean(likeData);
            
//             // Note: gradnet_saves table would be needed for save functionality
//             // For now, keeping isSaved as false since table doesn't exist in schema
//           } catch {
//             // Use defaults if interaction tables don't exist
//           }

//           return {
//             ...post,
//             author: {
//               id: post.author_id || '',
//               display_name: authorProfile?.display_name || 'Anonymous User',
//               profile_image_url: authorProfile?.profile_image_url,
//               field_of_study: authorProfile?.field_of_study,
//               academic_level: authorProfile?.academic_level,
//               verified_status: authorProfile?.verified_status || false,
//             },
//             is_liked: isLiked,
//             is_saved: isSaved,
//           };
//         })
//       );

//       return processedPosts;
//     } catch (error: any) {
//       console.error('Error fetching feed posts:', error);
      
//       // Always fall back to demo posts on any error
//       console.log('Falling back to demo posts due to error');
//       return this.getDemoPosts();
//     }
//   }

//   /**
//    * Get demo posts for when GradNet tables don't exist
//    */
//   private getDemoPosts(): Post[] {
//     return [
//       {
//         id: 'demo-1',
//         author_id: 'demo-user-1',
//         content: 'Just got accepted to Stanford\'s PhD program in Computer Science! 🎉 The journey was tough but worth it. Happy to share my experience with anyone applying.',
//         post_type: 'achievement',
//         visibility: 'public',
//         tags: ['PhD', 'Stanford', 'Computer Science'],
//         likes_count: 45,
//         comments_count: 12,
//         shares_count: 8,
//         created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
//         updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
//         author: {
//           id: 'demo-user-1',
//           display_name: 'Sarah Chen',
//           profile_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b6e0b8a3?w=150&h=150&fit=crop&crop=face',
//           field_of_study: 'Computer Science',
//           academic_level: 'PhD Candidate',
//           verified_status: true
//         },
//         is_liked: false,
//         is_saved: false
//       },
//       {
//         id: 'demo-2',
//         author_id: 'demo-user-2',
//         content: 'Looking for advice on writing a strong statement of purpose for graduate school. What are the key elements that admissions committees look for?',
//         post_type: 'question',
//         visibility: 'public',
//         tags: ['SOP', 'Graduate School', 'Advice'],
//         likes_count: 23,
//         comments_count: 18,
//         shares_count: 5,
//         created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
//         updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
//         author: {
//           id: 'demo-user-2',
//           display_name: 'Michael Rodriguez',
//           profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
//           field_of_study: 'Engineering',
//           academic_level: 'Master\'s Applicant',
//           verified_status: false
//         },
//         is_liked: true,
//         is_saved: true
//       },
//       {
//         id: 'demo-3',
//         author_id: 'demo-user-3',
//         content: 'Found this amazing resource for GRE preparation! It\'s a free practice test platform with detailed explanations. Link in the first comment 👇',
//         post_type: 'resource',
//         visibility: 'public',
//         tags: ['GRE', 'Test Prep', 'Free Resources'],
//         likes_count: 67,
//         comments_count: 25,
//         shares_count: 34,
//         created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
//         updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
//         author: {
//           id: 'demo-user-3',
//           display_name: 'Dr. Emily Watson',
//           profile_image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
//           field_of_study: 'Education',
//           academic_level: 'Professor',
//           verified_status: true
//         },
//         is_liked: false,
//         is_saved: false
//       }
//     ];
//   }

//   /**
//    * Create a new post
//    * Shows informational message if GradNet tables don't exist
//    */
//   async createPost(postData: PostInput, authorId: string): Promise<Post | null> {
//     try {
//       // Use actual gradnet_posts table from database schema
//       // No need to check table existence since we're using the real schema

//       // Ensure user authentication
//       const currentUser = await supabase.auth.getUser();
//       if (!currentUser.data.user) {
//         toast.error('Authentication required');
//         return null;
//       }

//       // Create the post using gradnet_posts table
//       const { data: postResult, error: postError } = await supabase
//         .from('gradnet_posts')
//         .insert({
//           ...postData,
//           author_id: authorId,
//           post_type: postData.post_type || 'text',
//           visibility: postData.visibility || 'public',
//           likes_count: 0,
//           comments_count: 0,
//           shares_count: 0
//         })
//         .select('*')
//         .single();

//       if (postError) {throw postError;}

//       // Try to fetch author info, use fallback if user_profiles doesn't exist
//       let authorData = null;
//       try {
//         const { data } = await supabase
//           .from('user_profiles')
//           .select('display_name, profile_image_url, field_of_study, academic_level, verified_status')
//           .eq('user_id', authorId)
//           .single();
//         authorData = data;
//       } catch {
//         // Use auth user data as fallback
//         authorData = {
//           display_name: currentUser.data.user.user_metadata?.full_name || currentUser.data.user.email?.split('@')[0] || 'User',
//           verified_status: false
//         };
//       }

//       // Build the complete post object
//       const processedPost: Post = {
//         ...postResult,
//         author: {
//           id: authorId,
//           display_name: authorData?.display_name || 'Unknown User',
//           profile_image_url: authorData?.profile_image_url,
//           field_of_study: authorData?.field_of_study,
//           academic_level: authorData?.academic_level,
//           verified_status: authorData?.verified_status || false,
//         },
//         is_liked: false,
//         is_saved: false,
//       };

//       toast.success('Post created successfully!');
//       return processedPost;
//     } catch (error: any) {
//       console.error('Error creating post:', error);
      
//       // Handle different error cases gracefully
//       if (error.code === '42P01') {
//         toast.info('GradNet is in demo mode. Database setup required for full functionality.');
//         console.log('GradNet database tables not found, using demo mode');
//       } else if (error.code === '23503') {
//         toast.error('Database relationship error. Please try again.');
//       } else {
//         toast.error('Failed to create post. Please try again.');
//       }
//       return null;
//     }
//   }

//   /**
//    * Toggle like on a post
//    * Returns demo status if interaction tables don't exist
//    */
//   async togglePostLike(postId: string, userId: string): Promise<boolean> {
//     try {
//       // Check if user already liked the post using gradnet_likes table
//       const { data: existingLike, error: checkError } = await supabase
//         .from('gradnet_likes')
//         .select('id')
//         .eq('post_id', postId)
//         .eq('user_id', userId)
//         .single();

//       if (checkError && checkError.code !== 'PGRST116') {
//         throw checkError;
//       }

//       if (existingLike) {
//         // Unlike the post
//         const { error: deleteError } = await supabase
//           .from('gradnet_likes')
//           .delete()
//           .eq('id', existingLike.id);

//         if (deleteError) {throw deleteError;}
//         return false; // Post is now unliked
//       } else {
//         // Like the post
//         const { error: insertError } = await supabase
//           .from('gradnet_likes')
//           .insert({
//             post_id: postId,
//             user_id: userId
//           });

//         if (insertError) {throw insertError;}
//         return true; // Post is now liked
//       }
//     } catch (error: any) {
//       console.error('Error toggling post like:', error);
//       toast.error('Failed to update like');
//       return false;
//     }
//   }

//   /**
//    * Toggle save on a post
//    */
//   async togglePostSave(postId: string, userId: string): Promise<boolean> {
//     try {
//       // Note: gradnet_saves table would be needed for save functionality
//       // Since it's not in the current schema, we'll show an info message
//       toast.info('Save feature will be available once gradnet_saves table is added to the database');
//       return false;
      
//     } catch (error) {
//       console.error('Error toggling post save:', error);
//       toast.error('Failed to update save status');
//       return false;
//     }
//   }

//   /**
//    * Share a post (increment share count)
//    */
//   async sharePost(postId: string, userId: string): Promise<boolean> {
//     try {
//       // First ensure user profile exists (same fix as comments and posts)
//       const currentUser = await supabase.auth.getUser();
//       if (!currentUser.data.user) {
//         toast.error('Authentication required');
//         return false;
//       }

//       // Check if user profile exists, create basic one if needed
//       let userProfile = await userProfileService.getUserProfile(userId);
//       if (!userProfile) {
//         console.log('User profile not found, creating basic profile for sharing...');
//         userProfile = await userProfileService.createBasicUserProfile(currentUser.data.user);
//         if (!userProfile) {
//           toast.error('Failed to initialize user profile. Please try again.');
//           return false;
//         }
//       }

//       // Note: gradnet_shares table would be needed for share functionality
//       // Since it's not in the current schema, we'll show an info message
//       toast.info('Share feature will be available once gradnet_shares table is added to the database');
//       return false;

//       if (error) {throw error;}
//       toast.success('Post shared!');
//       return true;
//     } catch (error: any) {
//       console.error('Error sharing post:', error);
      
//       // More specific error handling
//       if (error.code === '42P01') {
//         toast.error('Database tables not found. Please deploy the database schema first.');
//         console.error('Missing database tables. Please run the database setup script.');
//       } else if (error.code === '23503') {
//         toast.error('Database relationship error. Please try again or contact support.');
//         console.error('Foreign key constraint error:', error.message);
//       } else if (error.message?.includes('permission')) {
//         toast.error('Permission denied. Please check your account access.');
//       } else {
//         toast.error('Failed to share post. Please try again.');
//         console.error('Unexpected error:', error);
//       }
//       return false;
//     }
//   }

//   /**
//    * Get comments for a post
//    * Returns empty array if comments table doesn't exist
//    */
//   async getPostComments(postId: string, userId?: string): Promise<Comment[]> {
//     try {
//       // Get all comments for the post using gradnet_comments table
//       const { data: comments, error: commentsError } = await supabase
//         .from('gradnet_comments')
//         .select('*')
//         .eq('post_id', postId)
//         .is('parent_comment_id', null)
//         .order('created_at', { ascending: true });

//       if (commentsError) {
//         if (commentsError.code === '42P01') {
//           return [];
//         }
//         throw commentsError;
//       }

//       if (!comments || comments.length === 0) {
//         return [];
//       }

//       // Get all unique author IDs for batch profile fetching
//       const authorIds = [...new Set(comments.map(comment => comment.author_id))];
      
//       // Batch fetch all author profiles
//       const { data: authorProfiles, error: profilesError } = await supabase
//         .from('user_profiles')
//         .select('user_id, display_name, profile_image_url')
//         .in('user_id', authorIds);

//       // Create a map for quick profile lookup
//       const profileMap = new Map();
//       if (authorProfiles) {
//         authorProfiles.forEach(profile => {
//           profileMap.set(profile.user_id, profile);
//         });
//       }

//       // Get all comment IDs for like status checking
//       const allCommentIds = comments.map(c => c.id);
      
//       // Get like status for main comments and their replies
//       const { data: replies } = await supabase
//         .from('gradnet_comments')
//         .select('id, parent_comment_id')
//         .in('parent_comment_id', allCommentIds);
      
//       const allReplyIds = replies ? replies.map(r => r.id) : [];
//       const allCommentAndReplyIds = [...allCommentIds, ...allReplyIds];

//       // Get like status for all comments and replies if user is provided
//       let commentLikesMap = new Map<string, boolean>();
//       if (userId && allCommentAndReplyIds.length > 0) {
//         commentLikesMap = await this.getCommentLikes(allCommentAndReplyIds, userId);
//       }

//       // Process comments and fetch replies
//       const processedComments = await Promise.all(
//         comments.map(async (comment) => {
//           const authorProfile = profileMap.get(comment.author_id);
          
//           // Get replies for this comment
//           const { data: replies, error: repliesError } = await supabase
//             .from('gradnet_comments')
//             .select('*')
//             .eq('parent_comment_id', comment.id)
//             .order('created_at', { ascending: true });

//           let processedReplies: Comment[] = [];
//           if (replies && replies.length > 0 && !repliesError) {
//             // Get unique reply author IDs
//             const replyAuthorIds = [...new Set(replies.map(reply => reply.author_id))];
            
//             // Batch fetch reply author profiles
//             const { data: replyProfiles } = await supabase
//               .from('user_profiles')
//               .select('user_id, display_name, profile_image_url')
//               .in('user_id', replyAuthorIds);

//             // Create reply profile map
//             const replyProfileMap = new Map();
//             if (replyProfiles) {
//               replyProfiles.forEach(profile => {
//                 replyProfileMap.set(profile.user_id, profile);
//               });
//             }

//             processedReplies = replies.map(reply => {
//               const replyAuthorProfile = replyProfileMap.get(reply.author_id);
//               return {
//                 ...reply,
//                 author: {
//                   id: reply.author_id,
//                   display_name: replyAuthorProfile?.display_name || 'Unknown User',
//                   profile_image_url: replyAuthorProfile?.profile_image_url,
//                 },
//                 is_liked: commentLikesMap.get(reply.id) || false,
//               };
//             });
//           }

//           return {
//             ...comment,
//             author: {
//               id: comment.author_id,
//               display_name: authorProfile?.display_name || 'Unknown User',
//               profile_image_url: authorProfile?.profile_image_url,
//             },
//             is_liked: commentLikesMap.get(comment.id) || false,
//             replies: processedReplies,
//           };
//         })
//       );

//       return processedComments;
//     } catch (error: any) {
//       console.error('Error fetching comments:', error);
      
//       // More specific error handling
//       if (error.code === '42P01') {
//         toast.error('Database tables not found. Please deploy the database schema first.');
//         console.error('Missing database tables. Please run the database setup script.');
//       } else if (error.code === 'PGRST116') {
//         // No comments found - this is normal, not an error
//         return [];
//       } else if (error.message?.includes('permission')) {
//         toast.error('Permission denied. Please check your account access.');
//       } else {
//         toast.error('Failed to load comments. Please try again.');
//         console.error('Unexpected error:', error);
//       }
//       return [];
//     }
//   }

//   /**
//    * Add a comment to a post
//    * Shows info message if comments table doesn't exist
//    */
//   async addComment(commentData: CommentInput, authorId: string): Promise<Comment | null> {
//     try {
//       // Use gradnet_comments table from actual database schema
//       // No need to check table existence since we're using the real schema

//       // First, ensure the user is authenticated
//       const currentUser = await supabase.auth.getUser();
//       if (!currentUser.data.user) {
//         toast.error('Authentication required');
//         return null;
//       }

//       // Create the comment using gradnet_comments table
//       const { data: commentResult, error: commentError } = await supabase
//         .from('gradnet_comments')
//         .insert({
//           ...commentData,
//           author_id: authorId,
//           likes_count: 0
//         })
//         .select('*')
//         .single();

//       if (commentError) {throw commentError;}

//       // Then fetch the author info separately for better reliability
//       const { data: authorData, error: authorError } = await supabase
//         .from('user_profiles')
//         .select('display_name, profile_image_url')
//         .eq('user_id', authorId)
//         .single();

//       // Build the complete comment object
//       const processedComment: Comment = {
//         ...commentResult,
//         author: {
//           id: authorId,
//           display_name: authorData?.display_name || userProfile.display_name || 'Unknown User',
//           profile_image_url: authorData?.profile_image_url || userProfile.profile_image_url,
//         },
//         is_liked: false,
//         replies: [],
//       };

//       toast.success('Comment added!');
//       return processedComment;
//     } catch (error: any) {
//       console.error('Error adding comment:', error);
      
//       // More specific error handling
//       if (error.code === '42P01') {
//         toast.error('Database tables not found. Please deploy the database schema first.');
//         console.error('Missing database tables. Please run the database setup script.');
//       } else if (error.code === '23503') {
//         toast.error('Database relationship error. Please try again or contact support.');
//         console.error('Foreign key constraint error:', error.message);
//       } else if (error.code === 'PGRST116') {
//         toast.error('User profile initialization failed. Please refresh and try again.');
//       } else if (error.message?.includes('user_profiles')) {
//         toast.error('User profile error. Please complete your profile setup.');
//       } else if (error.message?.includes('permission')) {
//         toast.error('Permission denied. Please check your account access.');
//       } else {
//         toast.error('Failed to add comment. Please try again.');
//         console.error('Unexpected error:', error);
//       }
//       return null;
//     }
//   }

//   /**
//    * Delete a post (only by author)
//    */
//   async deletePost(postId: string, userId: string): Promise<boolean> {
//     try {
//       const { error } = await supabase
//         .from('gradnet_posts')
//         .delete()
//         .eq('id', postId)
//         .eq('author_id', userId);

//       if (error) {throw error;}
      
//       toast.success('Post deleted');
//       return true;
//     } catch (error) {
//       console.error('Error deleting post:', error);
//       toast.error('Failed to delete post');
//       return false;
//     }
//   }

//   /**
//    * Create a repost (share post within the platform with optional commentary)
//    */
//   async createRepost(originalPostId: string, userId: string, repostContent?: string): Promise<Post | null> {
//     try {
//       // First ensure user profile exists
//       const currentUser = await supabase.auth.getUser();
//       if (!currentUser.data.user) {
//         toast.error('Authentication required');
//         return null;
//       }

//       let userProfile = await userProfileService.getUserProfile(userId);
//       if (!userProfile) {
//         console.log('User profile not found, creating basic profile for reposting...');
//         userProfile = await userProfileService.createBasicUserProfile(currentUser.data.user);
//         if (!userProfile) {
//           toast.error('Failed to initialize user profile. Please try again.');
//           return null;
//         }
//       }

//       // Get the original post
//       const { data: originalPost, error: originalError } = await supabase
//         .from('gradnet_posts')
//         .select('*')
//         .eq('id', originalPostId)
//         .single();

//       if (originalError) {
//         toast.error('Original post not found');
//         return null;
//       }

//       // Create the repost
//       const repostData = {
//         content: repostContent || `Shared: ${originalPost.content.substring(0, 100)}${originalPost.content.length > 100 ? '...' : ''}`,
//         author_id: userId,
//         post_type: 'text' as const,
//         visibility: 'public' as const,
//         tags: ['repost'],
//         // Note: We'd need to add original_post_id field to posts table for full repost functionality
//         // For now, we'll create a new post with reference in content
//       };

//       const { data: repostResult, error: repostError } = await supabase
//         .from('gradnet_posts')
//         .insert(repostData)
//         .select('*')
//         .single();

//       if (repostError) {throw repostError;}

//       // Also track as a share interaction
//       await this.sharePost(originalPostId, userId);

//       // Get author info for the repost
//       const { data: authorData } = await supabase
//         .from('user_profiles')
//         .select('display_name, profile_image_url, field_of_study, academic_level, verified_status')
//         .eq('user_id', userId)
//         .single();

//       const processedRepost: Post = {
//         ...repostResult,
//         author: {
//           id: userId,
//           display_name: authorData?.display_name || userProfile.display_name || 'Unknown User',
//           profile_image_url: authorData?.profile_image_url || userProfile.profile_image_url,
//           field_of_study: authorData?.field_of_study || userProfile.field_of_study,
//           academic_level: authorData?.academic_level || userProfile.academic_level,
//           verified_status: authorData?.verified_status || userProfile.verified_status || false,
//         },
//         is_liked: false,
//         is_saved: false,
//       };

//       toast.success('Post shared to your feed!');
//       return processedRepost;
//     } catch (error: any) {
//       console.error('Error creating repost:', error);
//       toast.error('Failed to share post to your feed');
//       return null;
//     }
//   }

//   /**
//    * Upload media for posts
//    */
//   async uploadPostMedia(file: File, userId: string): Promise<string | null> {
//     try {
//       const fileExt = file.name.split('.').pop();
//       const fileName = `${userId}/${Date.now()}.${fileExt}`;

//       const { data, error } = await supabase.storage
//         .from('posts')
//         .upload(fileName, file);

//       if (error) {throw error;}

//       const { data: { publicUrl } } = supabase.storage
//         .from('posts')
//         .getPublicUrl(data.path);

//       return publicUrl;
//     } catch (error) {
//       console.error('Error uploading media:', error);
//       toast.error('Failed to upload media');
//       return null;
//     }
//   }

//   /**
//    * Subscribe to real-time post updates
//    */
//   subscribeToFeedUpdates(
//     onNewPost: (post: Post) => void,
//     onPostUpdate: (post: Post) => void,
//     onPostDelete: (postId: string) => void
//   ): void {
//     // Unsubscribe from existing subscription
//     this.unsubscribeFromFeed();

//     const subscription = supabase
//       .channel('social-feed')
//       .on(
//         'postgres_changes',
//         {
//           event: 'INSERT',
//           schema: 'public',
//           table: 'gradnet_posts'
//         },
//         async (payload) => {
//           // Fetch the complete post with author info
//           const { data } = await supabase
//             .from('gradnet_posts')
//             .select(`
//               *,
//               author:author_id (
//                 id,
//                 user_profiles!inner (
//                   display_name,
//                   profile_image_url,
//                   field_of_study,
//                   academic_level,
//                   verified_status
//                 )
//               )
//             `)
//             .eq('id', payload.new.id)
//             .single();

//           if (data) {
//             const authorProfile = data.author?.user_profiles?.[0];
//             const processedPost = {
//               ...data,
//               author: {
//                 id: data.author?.id || '',
//                 display_name: authorProfile?.display_name || 'Unknown User',
//                 profile_image_url: authorProfile?.profile_image_url,
//                 field_of_study: authorProfile?.field_of_study,
//                 academic_level: authorProfile?.academic_level,
//                 verified_status: authorProfile?.verified_status || false,
//               },
//               is_liked: false,
//               is_saved: false,
//             };
//             onNewPost(processedPost);
//           }
//         }
//       )
//       .on(
//         'postgres_changes',
//         {
//           event: 'UPDATE',
//           schema: 'public',
//           table: 'gradnet_posts'
//         },
//         async (payload) => {
//           // Fetch the complete updated post
//           const { data } = await supabase
//             .from('gradnet_posts')
//             .select(`
//               *,
//               author:author_id (
//                 id,
//                 user_profiles!inner (
//                   display_name,
//                   profile_image_url,
//                   field_of_study,
//                   academic_level,
//                   verified_status
//                 )
//               )
//             `)
//             .eq('id', payload.new.id)
//             .single();

//           if (data) {
//             const authorProfile = data.author?.user_profiles?.[0];
//             const processedPost = {
//               ...data,
//               author: {
//                 id: data.author?.id || '',
//                 display_name: authorProfile?.display_name || 'Unknown User',
//                 profile_image_url: authorProfile?.profile_image_url,
//                 field_of_study: authorProfile?.field_of_study,
//                 academic_level: authorProfile?.academic_level,
//                 verified_status: authorProfile?.verified_status || false,
//               },
//               is_liked: false,
//               is_saved: false,
//             };
//             onPostUpdate(processedPost);
//           }
//         }
//       )
//       .on(
//         'postgres_changes',
//         {
//           event: 'DELETE',
//           schema: 'public',
//           table: 'gradnet_posts'
//         },
//         (payload) => {
//           onPostDelete(payload.old.id);
//         }
//       )
//       .subscribe();

//     this.subscriptions.set('social-feed', subscription);
//   }

//   /**
//    * Subscribe to real-time interaction updates (likes, shares, etc.)
//    */
//   subscribeToInteractionUpdates(
//     onInteractionUpdate: (postId: string, interactionType: string, delta: number) => void
//   ): void {
//     const subscription = supabase
//       .channel('post-likes')
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'gradnet_likes'
//         },
//         (payload) => {
//           const interaction = payload.new || payload.old;
//           const delta = payload.eventType === 'INSERT' ? 1 : -1;
//           onInteractionUpdate(interaction.post_id, 'like', delta);
//         }
//       )
//       .subscribe();

//     this.subscriptions.set('post-likes', subscription);
//   }

//   /**
//    * Get trending hashtags
//    */
//   async getTrendingHashtags(limit = 10): Promise<{ tag: string; count: number }[]> {
//     try {
//       const { data, error } = await supabase
//         .rpc('get_trending_hashtags', { tag_limit: limit });

//       if (error) {throw error;}
//       return data || [];
//     } catch (error) {
//       console.error('Error fetching trending hashtags:', error);
//       return [];
//     }
//   }

//   /**
//    * Search posts by content or tags
//    */
//   async searchPosts(
//     query: string,
//     userId: string,
//     limit = 20
//   ): Promise<Post[]> {
//     try {
//       const { data, error } = await supabase
//         .from('gradnet_posts')
//         .select(`
//           *,
//           author:author_id (
//             id,
//             user_profiles!inner (
//               display_name,
//               profile_image_url,
//               field_of_study,
//               academic_level,
//               verified_status
//             )
//           )
//         `)
//         .or(`content.ilike.%${query}%,tags.cs.{${query}}`)
//         .or(`visibility.eq.public,author_id.eq.${userId}`)
//         .order('created_at', { ascending: false })
//         .limit(limit);

//       if (error) {throw error;}

//       const processedPosts = (data || []).map(post => {
//         const authorProfile = post.author?.user_profiles?.[0];
//         return {
//           ...post,
//           author: {
//             id: post.author?.id || '',
//             display_name: authorProfile?.display_name || 'Unknown User',
//             profile_image_url: authorProfile?.profile_image_url,
//             field_of_study: authorProfile?.field_of_study,
//             academic_level: authorProfile?.academic_level,
//             verified_status: authorProfile?.verified_status || false,
//           },
//           is_liked: false,
//           is_saved: false,
//         };
//       });

//       return processedPosts;
//     } catch (error) {
//       console.error('Error searching posts:', error);
//       return [];
//     }
//   }

//   /**
//    * Unsubscribe from feed updates
//    */
//   unsubscribeFromFeed(): void {
//     const subscription = this.subscriptions.get('social-feed');
//     if (subscription) {
//       supabase.removeChannel(subscription);
//       this.subscriptions.delete('social-feed');
//     }
//   }

//   /**
//    * Toggle like on a comment
//    */
//   async toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
//     try {
//       // Note: gradnet_comment_likes table would be needed for comment like functionality
//       // Since it's not in the current schema, we'll show an info message
//       toast.info('Comment like feature will be available once gradnet_comment_likes table is added to the database');
//       return false;
//     } catch (error: any) {
//       console.error('Error toggling comment like:', error);
//       return false;
//     }
//   }

//   /**
//    * Get comment like status for multiple comments for a user
//    */
//   async getCommentLikes(commentIds: string[], userId: string): Promise<Map<string, boolean>> {
//     try {
//       if (commentIds.length === 0) {
//         return new Map();
//       }

//       const { data, error } = await supabase
//         .rpc('get_user_comment_interactions', {
//           p_comment_ids: commentIds,
//           p_user_id: userId
//         });

//       if (error) {throw error;}

//       const likeMap = new Map<string, boolean>();
//       if (data) {
//         data.forEach((item: any) => {
//           likeMap.set(item.comment_id, item.is_liked);
//         });
//       }

//       return likeMap;
//     } catch (error) {
//       console.error('Error fetching comment likes:', error);
//       return new Map();
//     }
//   }

//   /**
//    * Get enhanced trending hashtags with real-time data
//    */
//   async getTrendingHashtagsRealtime(limit = 10): Promise<{ tag: string; count: number; growth_rate: number }[]> {
//     try {
//       const { data, error } = await supabase
//         .rpc('get_trending_hashtags_realtime', { 
//           tag_limit: limit,
//           time_window_hours: 24
//         });

//       if (error) {throw error;}
//       return data || [];
//     } catch (error) {
//       console.error('Error fetching real-time trending hashtags:', error);
//       return [];
//     }
//   }

//   /**
//    * Subscribe to real-time comment interaction updates
//    */
//   subscribeToCommentInteractions(
//     onCommentInteractionUpdate: (commentId: string, interactionType: string, delta: number) => void
//   ): void {
//     // Note: This would require gradnet_comment_likes table for real-time updates
//     // For now, we'll create a placeholder subscription
//     const subscription = supabase
//       .channel('comment-likes-placeholder')
//       .subscribe();

//     this.subscriptions.set('comment-likes', subscription);
//   }

//   /**
//    * Unsubscribe from all active subscriptions
//    */
//   unsubscribeAll(): void {
//     this.subscriptions.forEach((subscription) => {
//       supabase.removeChannel(subscription);
//     });
//     this.subscriptions.clear();
//   }
// }

// // Export singleton instance
// export const socialFeedService = new SocialFeedService();


import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { userProfileService } from './userProfileService';

export interface Post {
  id: string;
  author_id: string;
  content: string;
  media_urls?: string[];
  post_type: 'text' | 'achievement' | 'question' | 'resource' | 'event';
  visibility: 'public' | 'connections' | 'mentors' | 'private';
  tags?: string[];
  location?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    field_of_study?: string;
    academic_level?: string;
    verified_status: boolean;
  };
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_comment_id?: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
  is_liked?: boolean;
  replies?: Comment[];
}

export interface PostInput {
  content: string;
  post_type?: 'text' | 'achievement' | 'question' | 'resource' | 'event';
  visibility?: 'public' | 'connections' | 'mentors' | 'private';
  tags?: string[];
  location?: string;
  media_urls?: string[];
}

export interface CommentInput {
  post_id: string;
  content: string;
  parent_comment_id?: string;
}

class SocialFeedService {
  private subscriptions = new Map<string, any>();

  /**
   * Get posts for the social feed with pagination
   */
  async getFeedPosts(
    userId: string,
    limit = 20,
    offset = 0,
    feedType: 'all' | 'connections' | 'following' = 'all'
  ): Promise<Post[]> {
    try {
      let query = supabase
        .from('gradnet_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply feed filtering - simplified to just show all posts for now
      // We'll add more sophisticated filtering once basic functionality works
      query = query.eq('visibility', 'public');

      const { data, error } = await query;

      if (error) {throw error;}

      // Process the data and fetch author information separately
      const processedPosts = await Promise.all(
        (data || []).map(async (post) => {
          // Fetch author profile separately for better reliability
          const { data: authorProfile } = await supabase
            .from('user_profiles')
            .select('full_name, display_name, profile_picture_url, is_verified')
            .eq('user_id', post.user_id)
            .single();
          
          // Check if current user liked this post
          const { data: likeData } = await supabase
            .from('gradnet_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', userId)
            .eq('reaction_type', 'like')
            .single();

          // Check if current user saved this post - use a separate table or track differently
          // For now, we'll assume saved functionality isn't implemented in gradnet_likes
          const saveData = null;

          return {
            id: post.id,
            author_id: post.user_id,
            content: post.content,
            post_type: post.post_type,
            visibility: post.visibility,
            tags: post.tags || [],
            media_urls: post.media_urls || [],
            likes_count: post.like_count || 0,
            comments_count: post.comment_count || 0,
            shares_count: post.share_count || 0,
            created_at: post.created_at,
            updated_at: post.updated_at,
            author: {
              id: post.user_id || '',
              display_name: authorProfile?.display_name || authorProfile?.full_name || 'Unknown User',
              profile_image_url: authorProfile?.profile_picture_url,
              field_of_study: '', // Not available in basic user_profiles
              academic_level: '', // Not available in basic user_profiles  
              verified_status: authorProfile?.is_verified || false,
            },
            is_liked: Boolean(likeData),
            is_saved: Boolean(saveData),
          };
        })
      );

      return processedPosts;
    } catch (error: any) {
      console.error('Error fetching feed posts:', error);
      
      // More specific error handling
      if (error.code === '42P01') {
        toast.error('Database tables not found. Please deploy the database schema first.');
        console.error('Missing database tables. Please run the database setup script.');
      } else if (error.code === 'PGRST116') {
        // No posts found - this is normal, not an error
        return [];
      } else {
        toast.error('Failed to load posts');
      }
      return [];
    }
  }

  /**
   * Create a new post
   */
  async createPost(postData: PostInput, authorId: string): Promise<Post | null> {
    try {
      // First, ensure the user profile exists
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        toast.error('Authentication required');
        return null;
      }

      // Check if user profile exists, create basic one if needed
      let userProfile = await userProfileService.getUserProfile(authorId);
      if (!userProfile) {
        console.log('User profile not found, creating basic profile...');
        userProfile = await userProfileService.createBasicUserProfile(currentUser.data.user);
        if (!userProfile) {
          toast.error('Failed to initialize user profile. Please try again.');
          return null;
        }
      }

      // Create the post first
      const { data: postData_result, error: postError } = await supabase
        .from('gradnet_posts')
        .insert({
          content: postData.content,
          user_id: authorId,
          post_type: 'general', // Use fixed value that exists in enum
          visibility: postData.visibility || 'public'
          // Remove tags and media_urls for now to test basic functionality
        })
        .select('*')
        .single();

      if (postError) {
        console.error('Detailed post creation error:', postError);
        console.error('Error details:', {
          code: postError.code,
          message: postError.message,
          details: postError.details,
          hint: postError.hint
        });
        throw postError;
      }

      // Then fetch the author info separately for better reliability
      const { data: authorData, error: authorError } = await supabase
        .from('user_profiles')
        .select('full_name, display_name, profile_picture_url, is_verified')
        .eq('user_id', authorId)
        .single();

      // Build the complete post object
      const processedPost: Post = {
        id: postData_result.id,
        author_id: authorId,
        content: postData_result.content,
        post_type: postData_result.post_type,
        visibility: postData_result.visibility,
        tags: postData_result.tags || [],
        media_urls: postData_result.media_urls || [],
        likes_count: postData_result.like_count || 0,
        comments_count: postData_result.comment_count || 0,
        shares_count: postData_result.share_count || 0,
        created_at: postData_result.created_at,
        updated_at: postData_result.updated_at,
        author: {
          id: authorId,
          display_name: authorData?.display_name || authorData?.full_name || userProfile.display_name || 'Unknown User',
          profile_image_url: authorData?.profile_picture_url || userProfile.profile_image_url,
          field_of_study: userProfile.field_of_study || '', 
          academic_level: userProfile.academic_level || '',
          verified_status: authorData?.is_verified || userProfile.verified_status || false,
        },
        is_liked: false,
        is_saved: false,
      };

      toast.success('Post created successfully!');
      return processedPost;
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      // More specific error handling with better user feedback
      if (error.code === '42P01') {
        toast.error('Database tables not found. Please deploy the database schema first.');
        console.error('Missing database tables. Please run the database setup script.');
      } else if (error.code === '23503') {
        toast.error('Database relationship error. Please try again or contact support.');
        console.error('Foreign key constraint error:', error.message);
      } else if (error.code === 'PGRST116') {
        toast.error('User profile initialization failed. Please refresh and try again.');
      } else if (error.message?.includes('user_profiles')) {
        toast.error('User profile error. Please complete your profile setup.');
      } else {
        toast.error('Failed to create post. Please try again.');
        console.error('Unexpected error:', error);
      }
      return null;
    }
  }

  /**
   * Toggle like on a post
   */
  async togglePostLike(postId: string, userId: string): Promise<boolean> {
    try {
      // Check if user already liked the post
      const { data: existingLike, error: checkError } = await supabase
        .from('gradnet_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', 'like')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingLike) {
        // Unlike the post
        const { error: deleteError } = await supabase
          .from('gradnet_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) {throw deleteError;}
        return false; // Post is now unliked
      } 
        // Like the post
        const { error: insertError } = await supabase
          .from('gradnet_likes')
          .insert({
            post_id: postId,
            user_id: userId,
            reaction_type: 'like'
          });

        if (insertError) {throw insertError;}
        return true; // Post is now liked
      
    } catch (error: any) {
      console.error('Error toggling post like:', error);
      
      if (error.code === '42P01') {
        toast.error('Database tables not found. Please deploy the database schema first.');
      } else {
        toast.error('Failed to update like');
      }
      return false;
    }
  }

  /**
   * Toggle save on a post
   */
  async togglePostSave(postId: string, userId: string): Promise<boolean> {
    try {
      // Save functionality not implemented in gradnet_likes table
      // For now, return current save status (would need separate saved_posts table)
      console.log('Save functionality needs separate implementation');
      return false; // Temporarily disabled

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingSave) {
        // Unsave the post
        const { error: deleteError } = await supabase
          .from('post_interactions')
          .delete()
          .eq('id', existingSave.id);

        if (deleteError) {throw deleteError;}
        toast.success('Post removed from saved');
        return false;
      } 
        // Save the post
        const { error: insertError } = await supabase
          .from('post_interactions')
          .insert({
            post_id: postId,
            user_id: userId,
            interaction_type: 'save'
          });

        if (insertError) {throw insertError;}
        toast.success('Post saved');
        return true;
      
    } catch (error) {
      console.error('Error toggling post save:', error);
      toast.error('Failed to update save status');
      return false;
    }
  }

  /**
   * Share a post (increment share count)
   */
  async sharePost(postId: string, userId: string): Promise<boolean> {
    try {
      // First ensure user profile exists (same fix as comments and posts)
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        toast.error('Authentication required');
        return false;
      }

      // Check if user profile exists, create basic one if needed
      let userProfile = await userProfileService.getUserProfile(userId);
      if (!userProfile) {
        console.log('User profile not found, creating basic profile for sharing...');
        userProfile = await userProfileService.createBasicUserProfile(currentUser.data.user);
        if (!userProfile) {
          toast.error('Failed to initialize user profile. Please try again.');
          return false;
        }
      }

      // For now, share functionality just returns true
      // In a full implementation, you would track shares in gradnet_likes table
      const { error } = await supabase
        .from('gradnet_likes')
        .insert({
          post_id: postId,
          user_id: userId,
          reaction_type: 'celebrate' // Using celebrate as a share-like reaction
        });
        
      // Check for existing share first
      const { data: existingShare } = await supabase
        .from('gradnet_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', 'celebrate')
        .single();
        
      if (existingShare) {
        toast.info('You have already shared this post');
        return true;
      }

      if (error) {throw error;}
      toast.success('Post shared!');
      return true;
    } catch (error: any) {
      console.error('Error sharing post:', error);
      
      // More specific error handling
      if (error.code === '42P01') {
        toast.error('Database tables not found. Please deploy the database schema first.');
        console.error('Missing database tables. Please run the database setup script.');
      } else if (error.code === '23503') {
        toast.error('Database relationship error. Please try again or contact support.');
        console.error('Foreign key constraint error:', error.message);
      } else if (error.message?.includes('permission')) {
        toast.error('Permission denied. Please check your account access.');
      } else {
        toast.error('Failed to share post. Please try again.');
        console.error('Unexpected error:', error);
      }
      return false;
    }
  }

  /**
   * Get comments for a post
   */
  async getPostComments(postId: string, userId?: string): Promise<Comment[]> {
    try {
      // First, get all comments for the post (main comments only)
      const { data: comments, error: commentsError } = await supabase
        .from('gradnet_comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (commentsError) {throw commentsError;}

      if (!comments || comments.length === 0) {
        return [];
      }

      // Get all unique author IDs for batch profile fetching
      const authorIds = [...new Set(comments.map(comment => comment.user_id))];
      
      // Batch fetch all author profiles
      const { data: authorProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_image_url')
        .in('user_id', authorIds);

      // Create a map for quick profile lookup
      const profileMap = new Map();
      if (authorProfiles) {
        authorProfiles.forEach(profile => {
          profileMap.set(profile.user_id, profile);
        });
      }

      // Get all comment IDs for like status checking
      const allCommentIds = comments.map(c => c.id);
      
      // Get like status for main comments and their replies
      const { data: replies } = await supabase
        .from('comments')
        .select('id, parent_comment_id')
        .in('parent_comment_id', allCommentIds);
      
      const allReplyIds = replies ? replies.map(r => r.id) : [];
      const allCommentAndReplyIds = [...allCommentIds, ...allReplyIds];

      // Get like status for all comments and replies if user is provided
      let commentLikesMap = new Map<string, boolean>();
      if (userId && allCommentAndReplyIds.length > 0) {
        commentLikesMap = await this.getCommentLikes(allCommentAndReplyIds, userId);
      }

      // Process comments and fetch replies
      const processedComments = await Promise.all(
        comments.map(async (comment) => {
          const authorProfile = profileMap.get(comment.author_id);
          
          // Get replies for this comment
          const { data: replies, error: repliesError } = await supabase
            .from('gradnet_comments')
            .select('*')
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true });

          let processedReplies: Comment[] = [];
          if (replies && replies.length > 0 && !repliesError) {
            // Get unique reply author IDs
            const replyAuthorIds = [...new Set(replies.map(reply => reply.user_id))];
            
            // Batch fetch reply author profiles
            const { data: replyProfiles } = await supabase
              .from('user_profiles')
              .select('user_id, display_name, profile_image_url')
              .in('user_id', replyAuthorIds);

            // Create reply profile map
            const replyProfileMap = new Map();
            if (replyProfiles) {
              replyProfiles.forEach(profile => {
                replyProfileMap.set(profile.user_id, profile);
              });
            }

            processedReplies = replies.map(reply => {
              const replyAuthorProfile = replyProfileMap.get(reply.user_id);
              return {
                id: reply.id,
                post_id: reply.post_id,
                author_id: reply.user_id,
                content: reply.content,
                parent_comment_id: reply.parent_comment_id,
                likes_count: reply.like_count || 0,
                created_at: reply.created_at,
                updated_at: reply.updated_at,
                author: {
                  id: reply.user_id,
                  display_name: replyAuthorProfile?.display_name || 'Unknown User',
                  profile_image_url: replyAuthorProfile?.profile_image_url,
                },
                is_liked: commentLikesMap.get(reply.id) || false,
              };
            });
          }

          return {
            id: comment.id,
            post_id: comment.post_id,
            author_id: comment.user_id,
            content: comment.content,
            parent_comment_id: comment.parent_comment_id,
            likes_count: comment.like_count || 0,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            author: {
              id: comment.user_id,
              display_name: authorProfile?.display_name || 'Unknown User',
              profile_image_url: authorProfile?.profile_image_url,
            },
            is_liked: commentLikesMap.get(comment.id) || false,
            replies: processedReplies,
          };
        })
      );

      return processedComments;
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      
      // More specific error handling
      if (error.code === '42P01') {
        toast.error('Database tables not found. Please deploy the database schema first.');
        console.error('Missing database tables. Please run the database setup script.');
      } else if (error.code === 'PGRST116') {
        // No comments found - this is normal, not an error
        return [];
      } else if (error.message?.includes('permission')) {
        toast.error('Permission denied. Please check your account access.');
      } else {
        toast.error('Failed to load comments. Please try again.');
        console.error('Unexpected error:', error);
      }
      return [];
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(commentData: CommentInput, authorId: string): Promise<Comment | null> {
    try {
      // First, ensure the user profile exists
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        toast.error('Authentication required');
        return null;
      }

      // Check if user profile exists, create basic one if needed
      let userProfile = await userProfileService.getUserProfile(authorId);
      if (!userProfile) {
        console.log('User profile not found, creating basic profile for comment...');
        userProfile = await userProfileService.createBasicUserProfile(currentUser.data.user);
        if (!userProfile) {
          toast.error('Failed to initialize user profile. Please try again.');
          return null;
        }
      }

      // Create the comment first
      const { data: commentResult, error: commentError } = await supabase
        .from('gradnet_comments')
        .insert({
          post_id: commentData.post_id,
          user_id: authorId,
          content: commentData.content,
          parent_comment_id: commentData.parent_comment_id
        })
        .select('*')
        .single();

      if (commentError) {throw commentError;}

      // Then fetch the author info separately for better reliability
      const { data: authorData, error: authorError } = await supabase
        .from('user_profiles')
        .select('display_name, profile_image_url')
        .eq('user_id', authorId)
        .single();

      // Build the complete comment object
      const processedComment: Comment = {
        id: commentResult.id,
        post_id: commentResult.post_id,
        author_id: authorId,
        content: commentResult.content,
        parent_comment_id: commentResult.parent_comment_id,
        likes_count: commentResult.like_count || 0,
        created_at: commentResult.created_at,
        updated_at: commentResult.updated_at,
        author: {
          id: authorId,
          display_name: authorData?.display_name || userProfile.display_name || 'Unknown User',
          profile_image_url: authorData?.profile_image_url || userProfile.profile_image_url,
        },
        is_liked: false,
        replies: [],
      };

      toast.success('Comment added!');
      return processedComment;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      
      // More specific error handling
      if (error.code === '42P01') {
        toast.error('Database tables not found. Please deploy the database schema first.');
        console.error('Missing database tables. Please run the database setup script.');
      } else if (error.code === '23503') {
        toast.error('Database relationship error. Please try again or contact support.');
        console.error('Foreign key constraint error:', error.message);
      } else if (error.code === 'PGRST116') {
        toast.error('User profile initialization failed. Please refresh and try again.');
      } else if (error.message?.includes('user_profiles')) {
        toast.error('User profile error. Please complete your profile setup.');
      } else if (error.message?.includes('permission')) {
        toast.error('Permission denied. Please check your account access.');
      } else {
        toast.error('Failed to add comment. Please try again.');
        console.error('Unexpected error:', error);
      }
      return null;
    }
  }

  /**
   * Delete a post (only by author)
   */
  async deletePost(postId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('gradnet_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);

      if (error) {throw error;}
      
      toast.success('Post deleted');
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
      return false;
    }
  }

  /**
   * Create a repost (share post within the platform with optional commentary)
   */
  async createRepost(originalPostId: string, userId: string, repostContent?: string): Promise<Post | null> {
    try {
      // First ensure user profile exists
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        toast.error('Authentication required');
        return null;
      }

      let userProfile = await userProfileService.getUserProfile(userId);
      if (!userProfile) {
        console.log('User profile not found, creating basic profile for reposting...');
        userProfile = await userProfileService.createBasicUserProfile(currentUser.data.user);
        if (!userProfile) {
          toast.error('Failed to initialize user profile. Please try again.');
          return null;
        }
      }

      // Get the original post
      const { data: originalPost, error: originalError } = await supabase
        .from('gradnet_posts')
        .select('*')
        .eq('id', originalPostId)
        .single();

      if (originalError) {
        toast.error('Original post not found');
        return null;
      }

      // Create the repost
      const repostData = {
        content: repostContent || `Shared: ${originalPost.content.substring(0, 100)}${originalPost.content.length > 100 ? '...' : ''}`,
        author_id: userId,
        post_type: 'text' as const,
        visibility: 'public' as const,
        tags: ['repost'],
        // Note: We'd need to add original_post_id field to posts table for full repost functionality
        // For now, we'll create a new post with reference in content
      };

      const { data: repostResult, error: repostError } = await supabase
        .from('gradnet_posts')
        .insert({
          content: repostData.content,
          user_id: repostData.author_id,
          post_type: repostData.post_type,
          visibility: repostData.visibility,
          tags: repostData.tags
        })
        .select('*')
        .single();

      if (repostError) {throw repostError;}

      // Note: Share tracking would be done through gradnet_likes table with reaction_type 'share'
      await this.sharePost(originalPostId, userId);

      // Get author info for the repost
      const { data: authorData } = await supabase
        .from('user_profiles')
        .select('full_name, display_name, profile_picture_url, is_verified')
        .eq('user_id', userId)
        .single();

      const processedRepost: Post = {
        ...repostResult,
        author: {
          id: userId,
          display_name: authorData?.display_name || userProfile.display_name || 'Unknown User',
          profile_image_url: authorData?.profile_image_url || userProfile.profile_image_url,
          field_of_study: authorData?.field_of_study || userProfile.field_of_study,
          academic_level: authorData?.academic_level || userProfile.academic_level,
          verified_status: authorData?.verified_status || userProfile.verified_status || false,
        },
        is_liked: false,
        is_saved: false,
      };

      toast.success('Post shared to your feed!');
      return processedRepost;
    } catch (error: any) {
      console.error('Error creating repost:', error);
      toast.error('Failed to share post to your feed');
      return null;
    }
  }

  /**
   * Upload media for posts
   */
  async uploadPostMedia(file: File, userId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (error) {throw error;}

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media');
      return null;
    }
  }

  /**
   * Subscribe to real-time post updates
   */
  subscribeToFeedUpdates(
    onNewPost: (post: Post) => void,
    onPostUpdate: (post: Post) => void,
    onPostDelete: (postId: string) => void
  ): void {
    // Unsubscribe from existing subscription
    this.unsubscribeFromFeed();

    const subscription = supabase
      .channel('social-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          // Fetch the complete post with author info
          const { data } = await supabase
            .from('posts')
            .select(`
              *,
              author:author_id (
                id,
                user_profiles!inner (
                  display_name,
                  profile_image_url,
                  field_of_study,
                  academic_level,
                  verified_status
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const authorProfile = data.author?.user_profiles?.[0];
            const processedPost = {
              ...data,
              author: {
                id: data.author?.id || '',
                display_name: authorProfile?.display_name || 'Unknown User',
                profile_image_url: authorProfile?.profile_image_url,
                field_of_study: authorProfile?.field_of_study,
                academic_level: authorProfile?.academic_level,
                verified_status: authorProfile?.verified_status || false,
              },
              is_liked: false,
              is_saved: false,
            };
            onNewPost(processedPost);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          // Fetch the complete updated post
          const { data } = await supabase
            .from('posts')
            .select(`
              *,
              author:author_id (
                id,
                user_profiles!inner (
                  display_name,
                  profile_image_url,
                  field_of_study,
                  academic_level,
                  verified_status
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const authorProfile = data.author?.user_profiles?.[0];
            const processedPost = {
              ...data,
              author: {
                id: data.author?.id || '',
                display_name: authorProfile?.display_name || 'Unknown User',
                profile_image_url: authorProfile?.profile_image_url,
                field_of_study: authorProfile?.field_of_study,
                academic_level: authorProfile?.academic_level,
                verified_status: authorProfile?.verified_status || false,
              },
              is_liked: false,
              is_saved: false,
            };
            onPostUpdate(processedPost);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          onPostDelete(payload.old.id);
        }
      )
      .subscribe();

    this.subscriptions.set('social-feed', subscription);
  }

  /**
   * Subscribe to real-time interaction updates (likes, shares, etc.)
   */
  subscribeToInteractionUpdates(
    onInteractionUpdate: (postId: string, interactionType: string, delta: number) => void
  ): void {
    const subscription = supabase
      .channel('post-interactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gradnet_likes'
        },
        (payload) => {
          const interaction = payload.new || payload.old;
          const delta = payload.eventType === 'INSERT' ? 1 : -1;
          onInteractionUpdate(interaction.post_id, interaction.interaction_type, delta);
        }
      )
      .subscribe();

    this.subscriptions.set('post-interactions', subscription);
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limit = 10): Promise<{ tag: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_trending_hashtags', { tag_limit: limit });

      if (error) {throw error;}
      return data || [];
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      return [];
    }
  }

  /**
   * Search posts by content or tags
   */
  async searchPosts(
    query: string,
    userId: string,
    limit = 20
  ): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:author_id (
            id,
            user_profiles!inner (
              display_name,
              profile_image_url,
              field_of_study,
              academic_level,
              verified_status
            )
          )
        `)
        .or(`content.ilike.%${query}%,tags.cs.{${query}}`)
        .or(`visibility.eq.public,author_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {throw error;}

      const processedPosts = (data || []).map(post => {
        const authorProfile = post.author?.user_profiles?.[0];
        return {
          ...post,
          author: {
            id: post.author?.id || '',
            display_name: authorProfile?.display_name || 'Unknown User',
            profile_image_url: authorProfile?.profile_image_url,
            field_of_study: authorProfile?.field_of_study,
            academic_level: authorProfile?.academic_level,
            verified_status: authorProfile?.verified_status || false,
          },
          is_liked: false,
          is_saved: false,
        };
      });

      return processedPosts;
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }

  /**
   * Unsubscribe from feed updates
   */
  unsubscribeFromFeed(): void {
    const subscription = this.subscriptions.get('social-feed');
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete('social-feed');
    }
  }

  /**
   * Toggle like on a comment
   */
  async toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
    try {
      // First ensure user profile exists
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        toast.error('Authentication required');
        return false;
      }

      let userProfile = await userProfileService.getUserProfile(userId);
      if (!userProfile) {
        console.log('User profile not found, creating basic profile for comment like...');
        userProfile = await userProfileService.createBasicUserProfile(currentUser.data.user);
        if (!userProfile) {
          toast.error('Failed to initialize user profile. Please try again.');
          return false;
        }
      }

      // Check if user already liked this comment
      const { data: existingLike, error: checkError } = await supabase
        .from('gradnet_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .eq('reaction_type', 'like')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingLike) {
        // Unlike the comment
        const { error: deleteError } = await supabase
          .from('gradnet_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) {throw deleteError;}
        return false; // Comment is now unliked
      } 
        // Like the comment
        const { error: insertError } = await supabase
          .from('gradnet_likes')
          .insert({
            comment_id: commentId,
            user_id: userId,
            reaction_type: 'like'
          });

        if (insertError) {throw insertError;}
        return true; // Comment is now liked
      
    } catch (error: any) {
      console.error('Error toggling comment like:', error);
      
      if (error.code === '42P01') {
        toast.error('Database tables not found. Please deploy the comment interactions schema first.');
      } else if (error.code === '23503') {
        toast.error('Database relationship error. Please try again or contact support.');
      } else if (error.message?.includes('permission')) {
        toast.error('Permission denied. Please check your account access.');
      } else {
        toast.error('Failed to update comment like. Please try again.');
      }
      return false;
    }
  }

  /**
   * Get comment like status for multiple comments for a user
   */
  async getCommentLikes(commentIds: string[], userId: string): Promise<Map<string, boolean>> {
    try {
      if (commentIds.length === 0) {
        return new Map();
      }

      const { data, error } = await supabase
        .rpc('get_user_comment_interactions', {
          p_comment_ids: commentIds,
          p_user_id: userId
        });

      if (error) {throw error;}

      const likeMap = new Map<string, boolean>();
      if (data) {
        data.forEach((item: any) => {
          likeMap.set(item.comment_id, item.is_liked);
        });
      }

      return likeMap;
    } catch (error) {
      console.error('Error fetching comment likes:', error);
      return new Map();
    }
  }

  /**
   * Get enhanced trending hashtags with real-time data
   */
  async getTrendingHashtagsRealtime(limit = 10): Promise<{ tag: string; count: number; growth_rate: number }[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_trending_hashtags_realtime', { 
          tag_limit: limit,
          time_window_hours: 24
        });

      if (error) {throw error;}
      return data || [];
    } catch (error) {
      console.error('Error fetching real-time trending hashtags:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time comment interaction updates
   */
  subscribeToCommentInteractions(
    onCommentInteractionUpdate: (commentId: string, interactionType: string, delta: number) => void
  ): void {
    const subscription = supabase
      .channel('comment-interactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gradnet_likes'
        },
        (payload) => {
          const interaction = payload.new || payload.old;
          const delta = payload.eventType === 'INSERT' ? 1 : -1;
          onCommentInteractionUpdate(interaction.comment_id, interaction.interaction_type, delta);
        }
      )
      .subscribe();

    this.subscriptions.set('comment-interactions', subscription);
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const socialFeedService = new SocialFeedService();