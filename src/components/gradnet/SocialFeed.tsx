// import React, { useState, useEffect } from 'react';
// import { User } from '@supabase/supabase-js';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Textarea } from '@/components/ui/textarea';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Badge } from '@/components/ui/badge';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { 
//   Heart, 
//   MessageCircle, 
//   Share2, 
//   Bookmark, 
//   MoreHorizontal,
//   Image as ImageIcon,
//   FileText,
//   Trophy,
//   GraduationCap,
//   MapPin,
//   Clock,
//   ThumbsUp,
//   Send,
//   CheckCircle,
//   ExternalLink
// } from 'lucide-react';
// import LoadingSpinner from '@/components/ui/LoadingSpinner';
// import { toast } from 'sonner';
// import { gradnetService, Post, UserProfile } from '@/services/gradnetService';
// import CommentSection from './CommentSection';
// import ShareModal from './ShareModal';

// interface SocialFeedProps {
//   user: User;
// }

// const SocialFeed: React.FC<SocialFeedProps> = ({ user }) => {
//   const [newPost, setNewPost] = useState('');
//   const [postType, setPostType] = useState<'general' | 'question' | 'resource' | 'achievement' | 'announcement' | 'discussion' | 'job_posting' | 'study_group' | 'mentor_request' | 'success_story'>('general');
//   const [posts, setPosts] = useState<Post[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [creating, setCreating] = useState(false);
//   const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);
//   const [uploading, setUploading] = useState(false);
//   const [openComments, setOpenComments] = useState<string | null>(null);
//   const [shareModalOpen, setShareModalOpen] = useState<string | null>(null);
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

//   // Demo data for when database tables don't exist
//   const getDemoPosts = (): Post[] => [
//     {
//       id: 'demo-1',
//       user_id: 'demo-user-1',
//       title: 'PhD Acceptance Success!',
//       content: 'Just got accepted to Stanford\'s PhD program in Computer Science! 🎉 The journey was tough but worth it. Happy to share my experience with anyone applying.',
//       post_type: 'achievement',
//       visibility: 'public',
//       tags: ['PhD', 'Stanford', 'Computer Science'],
//       categories: ['achievements'],
//       university_tags: ['Stanford University'],
//       program_tags: ['Computer Science PhD'],
//       comments_enabled: true,
//       sharing_enabled: true,
//       like_count: 45,
//       comment_count: 12,
//       share_count: 8,
//       view_count: 234,
//       is_flagged: false,
//       is_approved: true,
//       is_scheduled: false,
//       is_pinned: false,
//       is_archived: false,
//       created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
//       updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
//       published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
//       last_activity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
//       user_profile: {
//         id: 'profile-1',
//         user_id: 'demo-user-1',
//         role: 'applicant',
//         full_name: 'Sarah Chen',
//         display_name: 'Sarah Chen',
//         profile_picture_url: 'https://images.unsplash.com/photo-1494790108755-2616b6e0b8a3?w=150&h=150&fit=crop&crop=face',
//         timezone: 'America/Los_Angeles',
//         email_notifications: true,
//         push_notifications: true,
//         sms_notifications: false,
//         profile_visibility: 'public',
//         search_visibility: true,
//         language_preference: 'en',
//         theme_preference: 'light',
//         notification_frequency: 'immediate',
//         is_verified: true,
//         verification_status: 'verified',
//         verification_documents: [],
//         last_active_at: new Date().toISOString(),
//         onboarding_completed: true,
//         onboarding_step: 15,
//         profile_completion_percentage: 95,
//         two_factor_enabled: false,
//         account_locked: false,
//         login_attempts: 0,
//         privacy_settings: {},
//         total_posts: 12,
//         total_comments: 45,
//         total_likes: 234,
//         reputation_score: 850,
//         created_at: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
//         updated_at: new Date().toISOString()
//       },
//       is_liked: false
//     },
//     {
//       id: 'demo-2',
//       author_id: 'demo-user-2',
//       content: 'Looking for advice on writing a strong statement of purpose for graduate school. What are the key elements that admissions committees look for?',
//       post_type: 'question',
//       visibility: 'public',
//       tags: ['SOP', 'Graduate School', 'Advice'],
//       likes_count: 23,
//       comments_count: 18,
//       shares_count: 5,
//       created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
//       updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
//       author: {
//         id: 'demo-user-2',
//         display_name: 'Michael Rodriguez',
//         profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
//         field_of_study: 'Engineering',
//         academic_level: 'Master\'s Applicant',
//         verified_status: false
//       },
//       is_liked: true,
//       is_saved: true
//     },
//     {
//       id: 'demo-3',
//       author_id: 'demo-user-3',
//       content: 'Found this amazing resource for GRE preparation! It\'s a free practice test platform with detailed explanations. Link in the first comment 👇',
//       post_type: 'resource',
//       visibility: 'public',
//       tags: ['GRE', 'Test Prep', 'Free Resources'],
//       likes_count: 67,
//       comments_count: 25,
//       shares_count: 34,
//       created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
//       updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
//       author: {
//         id: 'demo-user-3',
//         display_name: 'Dr. Emily Watson',
//         profile_image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
//         field_of_study: 'Education',
//         academic_level: 'Professor',
//         verified_status: true
//       },
//       is_liked: false,
//       is_saved: false
//     }
//   ];

//   useEffect(() => {
//     ensureUserProfile();
//     loadPosts();
    
//     // TODO: Add real-time subscription support to gradnetService
//     // For now, we'll rely on manual refreshing
    
//     return () => {
//       // Cleanup subscriptions when component unmounts
//     };
//   }, [user.id]);


//   const ensureUserProfile = async () => {
//     if (!user.id) {return;}
    
//     try {
//       // Check if user profile exists
//       const { data: existingProfile, error } = await gradnetService.getUserProfile(user.id);
      
//       if (!existingProfile) {
//         console.log('User profile not found for GradNet features...');
//         toast.info('Please complete your profile setup to use all GradNet features.');
//       } else {
//         setUserProfile(existingProfile);
//         console.log('User profile loaded:', existingProfile);
//         toast.success('Welcome to GradNet! Your profile has been created.');
//       }
//     } catch (error) {
//       console.error('Error ensuring user profile:', error);
//       // Show info message if it's a database issue, but continue with demo mode
//       if (error?.code === '42P01') {
//         console.warn('Database tables missing, continuing with demo mode');
//         toast.info('GradNet is running in demo mode. Full functionality requires database setup.');
//       }
//     }
//   };

//   const loadPosts = async (filter?: string) => {
//     if (!user.id) {return;}
    
//     setLoading(true);
//     try {
//       const options: any = {
//         limit: 20,
//         offset: 0
//       };

//       // Apply post type filter
//       if (filter && filter !== 'all' && filter !== 'connections') {
//         switch (filter) {
//           case 'achievements':
//             options.post_type = 'achievement';
//             break;
//           case 'questions':
//             options.post_type = 'question';
//             break;
//           case 'resources':
//             options.post_type = 'resource';
//             break;
//           case 'discussions':
//             options.post_type = 'discussion';
//             break;
//           case 'jobs':
//             options.post_type = 'job_posting';
//             break;
//           case 'study_groups':
//             options.post_type = 'study_group';
//             break;
//           case 'success_stories':
//             options.post_type = 'success_story';
//             break;
//           default:
//             break;
//         }
//       }

//       // Apply visibility filter
//       if (filter === 'connections') {
//         options.visibility = 'connections';
//       }
      
//       const { data: feedPosts, error } = await gradnetService.getFeedPosts(user.id, options);
      
//       if (error) {
//         throw new Error(error);
//       }
      
//       setPosts(feedPosts || []);
//     } catch (error) {
//       console.error('Error loading posts:', error);
//       // If database tables don't exist, load demo posts
//       if (error?.code === '42P01' || error?.message?.includes('relation') || error?.message?.includes('table')) {
//         console.warn('Database tables missing, loading demo posts');
//         setPosts(getDemoPosts());
//       }
//     } finally {
//       setLoading(false);
//     }
//   };



//   const handleCreatePost = async () => {
//     if (!newPost.trim() || !user.id) {return;}
    
//     setCreating(true);
//     try {
//       // Extract hashtags from content
//       const extractedTags = extractHashtags(newPost);
      
//       // Auto-categorize post based on content and type
//       let categories: string[] = [];
//       switch (postType) {
//         case 'achievement':
//           categories = ['achievements', 'success'];
//           break;
//         case 'question':
//           categories = ['questions', 'help'];
//           break;
//         case 'resource':
//           categories = ['resources', 'sharing'];
//           break;
//         case 'job_posting':
//           categories = ['jobs', 'opportunities'];
//           break;
//         case 'study_group':
//           categories = ['study', 'collaboration'];
//           break;
//         case 'mentor_request':
//           categories = ['mentorship', 'guidance'];
//           break;
//         default:
//           categories = ['general'];
//       }
      
//       const postData = {
//         content: newPost,
//         post_type: postType,
//         tags: extractedTags,
//         categories: categories,
//         media_urls: uploadedMedia,
//         visibility: 'public' as const
//       };
      
//       const { data: createdPost, error } = await gradnetService.createPost(user.id, postData);
      
//       if (error) {
//         throw new Error(error);
//       }
      
//       if (createdPost) {
//         setNewPost('');
//         setPostType('general');
//         setUploadedMedia([]);
        
//         // Add the new post to the top of the feed immediately
//         setPosts(prev => [createdPost, ...prev]);
        
//         // Also refresh the feed to ensure consistency
//         await loadPosts();
        
//         toast.success('Post created successfully!');
//       }
//     } catch (error) {
//       console.error('Error creating post:', error);
//       // Handle database table missing errors gracefully
//       if (error?.code === '42P01' || error?.message?.includes('relation') || error?.message?.includes('table')) {
//         toast.info('GradNet is running in demo mode. Posts cannot be saved, but you can explore the interface.');
//       } else {
//         toast.error('Failed to create post. Please try again.');
//       }
//     } finally {
//       setCreating(false);
//     }
//   };

//   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'document') => {
//     if (!event.target.files || !user.id) {return;}
    
//     const files = Array.from(event.target.files);
//     const { valid, invalid } = mediaUploadService.validateFiles(files);
    
//     if (invalid.length > 0) {
//       invalid.forEach(({ file, reason }) => {
//         toast.error(`${file.name}: ${reason}`);
//       });
//     }
    
//     if (valid.length === 0) {return;}
    
//     setUploading(true);
//     try {
//       const uploadResults = await mediaUploadService.uploadMultipleFiles(valid, user.id);
//       setUploadedMedia(prev => [...prev, ...uploadResults]);
//     } catch (error) {
//       console.error('Error uploading files:', error);
//     } finally {
//       setUploading(false);
//       // Reset input
//       event.target.value = '';
//     }
//   };

//   const removeUploadedMedia = (index: number) => {
//     setUploadedMedia(prev => prev.filter((_, i) => i !== index));
//   };

//   const extractHashtags = (content: string): string[] => {
//     const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
//     const matches = content.match(hashtagRegex);
//     return matches ? matches.map(tag => tag.substring(1)) : [];
//   };

//   const handleLike = async (postId: string) => {
//     if (!user.id) {return;}
    
//     // Get current post state for rollback
//     const currentPost = posts.find(p => p.id === postId);
//     if (!currentPost) {return;}
    
//     const wasLiked = currentPost.is_liked;
//     const currentCount = currentPost.like_count;
    
//     // Optimistic update
//     setPosts(prev => prev.map(post => {
//       if (post.id === postId) {
//         return {
//           ...post,
//           is_liked: !wasLiked,
//           like_count: currentCount + (!wasLiked ? 1 : -1)
//         };
//       }
//       return post;
//     }));
    
//     try {
//       const { error } = await gradnetService.togglePostLike(postId, user.id);
      
//       if (error) {
//         throw new Error(error);
//       }
      
//       // The optimistic update is already applied above
//     } catch (error) {
//       console.error('Error toggling like:', error);
      
//       // Rollback optimistic update on error
//       setPosts(prev => prev.map(post => {
//         if (post.id === postId) {
//           return {
//             ...post,
//             is_liked: wasLiked,
//             like_count: currentCount
//           };
//         }
//         return post;
//       }));
      
//       toast.error('Failed to update like. Please try again.');
//     }
//   };

//   const handleSave = async (postId: string) => {
//     if (!user.id) {return;}
    
//     // TODO: Implement save functionality in gradnetService
//     toast.info('Save functionality coming soon!');
//   };

//   const handleShare = async (postId: string) => {
//     if (!user.id) {return;}
    
//     // Get current post state for rollback
//     const currentPost = posts.find(p => p.id === postId);
//     if (!currentPost) {return;}
    
//     const currentShareCount = currentPost.share_count;
    
//     // Optimistic update
//     setPosts(prev => prev.map(post => {
//       if (post.id === postId) {
//         return { ...post, share_count: currentShareCount + 1 };
//       }
//       return post;
//     }));
    
//     try {
//       // TODO: Implement share functionality in gradnetService
//       toast.success('Post shared! (Feature in development)');
//       // For now, keep the optimistic update
//     } catch (error) {
//       console.error('Error sharing post:', error);
      
//       // Rollback optimistic update on error
//       setPosts(prev => prev.map(post => {
//         if (post.id === postId) {
//           return { ...post, share_count: currentShareCount };
//         }
//         return post;
//       }));
      
//       toast.error('Failed to share post. Please try again.');
//     }
//   };

//   const formatTimeAgo = (dateString: string): string => {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
//     if (diffInSeconds < 60) {return 'Just now';}
//     if (diffInSeconds < 3600) {return `${Math.floor(diffInSeconds / 60)}m ago`;}
//     if (diffInSeconds < 86400) {return `${Math.floor(diffInSeconds / 3600)}h ago`;}
//     return `${Math.floor(diffInSeconds / 86400)}d ago`;
//   };

//   const getPostIcon = (type: string) => {
//     switch (type) {
//       case 'achievement':
//         return <Trophy className="h-4 w-4 text-yellow-500" />;
//       case 'advice':
//         return <GraduationCap className="h-4 w-4 text-blue-500" />;
//       case 'question':
//         return <MessageCircle className="h-4 w-4 text-green-500" />;
//       case 'resource':
//         return <FileText className="h-4 w-4 text-purple-500" />;
//       default:
//         return null;
//     }
//   };

//   const getPostTypeLabel = (type: string) => {
//     switch (type) {
//       case 'achievement':
//         return 'Achievement';
//       case 'advice':
//         return 'Advice';
//       case 'question':
//         return 'Question';
//       case 'resource':
//         return 'Resource';
//       default:
//         return 'Post';
//     }
//   };


//   return (
//     <div className="max-w-2xl mx-auto space-y-6">
        
//         {/* Create Post */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-lg">Share with the GradNet Community</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               <div className="flex gap-3">
//                 <Avatar className="w-10 h-10">
//                   <AvatarFallback>
//                     {(user.user_metadata?.full_name || user.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
//                   </AvatarFallback>
//                 </Avatar>
//                 <div className="flex-1 space-y-3">
//                   <Select value={postType} onValueChange={(value: any) => setPostType(value)}>
//                     <SelectTrigger className="w-48">
//                       <SelectValue placeholder="Post type" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="text">General Post</SelectItem>
//                       <SelectItem value="achievement">🏆 Achievement</SelectItem>
//                       <SelectItem value="question">❓ Question</SelectItem>
//                       <SelectItem value="resource">📚 Resource</SelectItem>
//                       <SelectItem value="event">📅 Event</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <Textarea
//                     placeholder="Share your graduate school journey, ask questions, or celebrate achievements..."
//                     value={newPost}
//                     onChange={(e) => setNewPost(e.target.value)}
//                     className="min-h-[100px] resize-none border-gray-200 focus:ring-gradapp-primary focus:border-gradapp-primary"
//                   />
//                 </div>
//               </div>
              
//               {/* Uploaded Media Preview */}
//               {uploadedMedia.length > 0 && (
//                 <div className="space-y-2">
//                   <p className="text-sm font-medium text-gray-700">Attached Files:</p>
//                   <div className="space-y-2">
//                     {uploadedMedia.map((media, index) => (
//                       <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
//                         <div className="flex items-center gap-3">
//                           <span className="text-lg">{mediaUploadService.getFileTypeIcon(media.fileType)}</span>
//                           <div>
//                             <p className="text-sm font-medium text-gray-900">{media.fileName}</p>
//                             <p className="text-xs text-gray-500">{mediaUploadService.formatFileSize(media.fileSize)}</p>
//                           </div>
//                         </div>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => removeUploadedMedia(index)}
//                           className="text-red-500 hover:text-red-700"
//                         >
//                           ✕
//                         </Button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
              
//               <div className="flex items-center justify-between">
//                 <div className="flex gap-2">
//                   <input
//                     type="file"
//                     id="photo-upload"
//                     multiple
//                     accept="image/*"
//                     onChange={(e) => handleFileUpload(e, 'photo')}
//                     className="hidden"
//                   />
//                   <Button 
//                     variant="outline" 
//                     size="sm"
//                     onClick={() => document.getElementById('photo-upload')?.click()}
//                     disabled={uploading}
//                   >
//                     {uploading ? (
//                       <LoadingSpinner variant="micro" size="xs" className="mr-2" />
//                     ) : (
//                       <ImageIcon className="h-4 w-4 mr-2" />
//                     )}
//                     Photo
//                   </Button>
                  
//                   <input
//                     type="file"
//                     id="document-upload"
//                     multiple
//                     accept=".pdf,.doc,.docx"
//                     onChange={(e) => handleFileUpload(e, 'document')}
//                     className="hidden"
//                   />
//                   <Button 
//                     variant="outline" 
//                     size="sm"
//                     onClick={() => document.getElementById('document-upload')?.click()}
//                     disabled={uploading}
//                   >
//                     {uploading ? (
//                       <LoadingSpinner variant="micro" size="xs" className="mr-2" />
//                     ) : (
//                       <FileText className="h-4 w-4 mr-2" />
//                     )}
//                     Document
//                   </Button>
//                 </div>
//                 <Button 
//                   onClick={handleCreatePost}
//                   disabled={!newPost.trim() || creating}
//                   className="bg-gradapp-primary hover:bg-gradapp-accent"
//                 >
//                   {creating ? (
//                     <LoadingSpinner variant="micro" size="xs" className="mr-2" />
//                   ) : (
//                     <Send className="h-4 w-4 mr-2" />
//                   )}
//                   {creating ? 'Posting...' : 'Share Post'}
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Posts Feed */}
//         {loading ? (
//           <div className="flex items-center justify-center py-12">
//             <LoadingSpinner size="lg" message="Loading posts..." />
//           </div>
//         ) : (
//           <div className="space-y-6">
//             {posts.length > 0 ? (
//               posts.map((post) => (
//             <Card key={post.id} className="hover:shadow-lg transition-shadow">
//               <CardHeader>
//                 <div className="flex items-start justify-between">
//                   <div className="flex gap-3">
//                     <Avatar className="w-12 h-12">
//                       <AvatarImage src={post.author?.profile_image_url} />
//                       <AvatarFallback>
//                         {(post.author?.display_name || 'U').charAt(0).toUpperCase()}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div className="flex-1">
//                       <div className="flex items-center gap-2">
//                         <h3 className="font-semibold text-gray-900">
//                           {post.author?.display_name || 'Unknown User'}
//                         </h3>
//                         {post.author?.verified_status && (
//                           <Badge variant="default" className="text-xs flex items-center gap-1">
//                             <CheckCircle className="h-3 w-3" />
//                             Verified
//                           </Badge>
//                         )}
//                         <Badge variant="outline" className="text-xs flex items-center gap-1">
//                           {getPostIcon(post.post_type)}
//                           {getPostTypeLabel(post.post_type)}
//                         </Badge>
//                       </div>
//                       <p className="text-sm text-gray-600">
//                         {post.author?.academic_level} 
//                         {post.author?.field_of_study && ` • ${post.author.field_of_study}`}
//                       </p>
//                       <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
//                         <Clock className="h-3 w-3" />
//                         {formatTimeAgo(post.created_at)}
//                       </div>
//                     </div>
//                   </div>
//                   <Button variant="ghost" size="sm">
//                     <MoreHorizontal className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </CardHeader>
              
//               <CardContent>
//                 <div className="space-y-4">
//                   <p className="text-gray-800 leading-relaxed">{post.content}</p>
                  
//                   {/* Media/Documents */}
//                   {post.media_urls && post.media_urls.length > 0 && (
//                     <div className="space-y-3">
//                       {post.media_urls.map((mediaUrl, index) => {
//                         const isImage = mediaUrl.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(mediaUrl);
//                         const isPDF = mediaUrl.includes('pdf') || mediaUrl.endsWith('.pdf');
//                         const isVideo = mediaUrl.includes('video') || /\.(mp4|mov|avi)$/i.test(mediaUrl);
                        
//                         if (isImage) {
//                           return (
//                             <div key={index} className="rounded-lg overflow-hidden border border-gray-200">
//                               <img 
//                                 src={mediaUrl} 
//                                 alt="Post media" 
//                                 className="w-full max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
//                                 onClick={() => window.open(mediaUrl, '_blank')}
//                               />
//                             </div>
//                           );
//                         } else if (isVideo) {
//                           return (
//                             <div key={index} className="rounded-lg overflow-hidden border border-gray-200">
//                               <video 
//                                 src={mediaUrl} 
//                                 controls 
//                                 className="w-full max-h-96 object-cover"
//                               />
//                             </div>
//                           );
//                         } 
//                           return (
//                             <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
//                               <div className="flex items-center gap-3">
//                                 {isPDF ? (
//                                   <span className="text-2xl">📄</span>
//                                 ) : (
//                                   <FileText className="h-8 w-8 text-gradapp-primary" />
//                                 )}
//                                 <div className="flex-1">
//                                   <h4 className="font-medium text-sm text-gray-900">Document Attachment</h4>
//                                   <p className="text-xs text-gray-500 truncate">Click to view or download</p>
//                                 </div>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => window.open(mediaUrl, '_blank')}
//                                   className="text-gradapp-primary hover:text-gradapp-accent"
//                                 >
//                                   <ExternalLink className="h-4 w-4" />
//                                 </Button>
//                               </div>
//                             </div>
//                           );
                        
//                       })}
//                     </div>
//                   )}
                  
//                   {/* Tags */}
//                   <div className="flex flex-wrap gap-2">
//                     {(post.tags || []).map((tag: string) => (
//                       <Badge key={tag} variant="secondary" className="text-xs cursor-pointer hover:bg-gray-200">
//                         #{tag}
//                       </Badge>
//                     ))}
//                   </div>
                  
//                   {/* Engagement Stats */}
//                   <div className="flex items-center justify-between pt-3 border-t border-gray-100">
//                     <div className="flex items-center gap-4 text-sm">
//                       <span className={`flex items-center gap-1 ${post.like_count > 0 ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
//                         <Heart className={`h-3 w-3 ${post.like_count > 0 ? 'fill-current' : ''}`} />
//                         {post.like_count || 0} {post.like_count === 1 ? 'like' : 'likes'}
//                       </span>
//                       <span className={`flex items-center gap-1 ${post.comment_count > 0 ? 'text-blue-500 font-medium' : 'text-gray-600'}`}>
//                         <MessageCircle className="h-3 w-3" />
//                         {post.comment_count || 0} {post.comment_count === 1 ? 'comment' : 'comments'}
//                       </span>
//                       <span className={`flex items-center gap-1 ${post.share_count > 0 ? 'text-green-500 font-medium' : 'text-gray-600'}`}>
//                         <Share2 className="h-3 w-3" />
//                         {post.shares_count || 0} {post.shares_count === 1 ? 'share' : 'shares'}
//                       </span>
//                     </div>
//                   </div>
                  
//                   {/* Action Buttons */}
//                   <div className="flex items-center justify-between pt-2">
//                     <div className="flex gap-2">
//                       <Button 
//                         variant="ghost" 
//                         size="sm" 
//                         onClick={() => handleLike(post.id)}
//                         className={`flex items-center gap-2 hover:text-red-500 transition-colors ${
//                           post.is_liked ? 'text-red-500 bg-red-50' : ''
//                         }`}
//                         title={`${post.like_count} ${post.like_count === 1 ? 'like' : 'likes'}`}
//                       >
//                         <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
//                         Like{post.like_count > 0 && ` (${post.like_count})`}
//                       </Button>
//                       <Button 
//                         variant="ghost" 
//                         size="sm" 
//                         onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
//                         className={`flex items-center gap-2 hover:text-blue-500 transition-colors ${
//                           openComments === post.id ? 'text-blue-500 bg-blue-50' : ''
//                         }`}
//                         title={`${post.comment_count} ${post.comment_count === 1 ? 'comment' : 'comments'}`}
//                       >
//                         <MessageCircle className="h-4 w-4" />
//                         Comment{post.comment_count > 0 && ` (${post.comment_count})`}
//                       </Button>
//                       <Button 
//                         variant="ghost" 
//                         size="sm" 
//                         onClick={() => setShareModalOpen(post.id)}
//                         className="flex items-center gap-2 hover:text-green-500 transition-colors"
//                         title={`${post.shares_count} ${post.shares_count === 1 ? 'share' : 'shares'}`}
//                       >
//                         <Share2 className="h-4 w-4" />
//                         Share{post.shares_count > 0 && ` (${post.shares_count})`}
//                       </Button>
//                     </div>
//                     <Button 
//                       variant="ghost" 
//                       size="sm" 
//                       onClick={() => handleSave(post.id)}
//                       className={`hover:text-gradapp-primary ${
//                         post.is_saved ? 'text-gradapp-primary' : ''
//                       }`}
//                     >
//                       <Bookmark className={`h-4 w-4 ${post.is_saved ? 'fill-current' : ''}`} />
//                     </Button>
//                   </div>

//                   {/* Comment Section */}
//                   <CommentSection
//                     postId={post.id}
//                     user={user}
//                     isOpen={openComments === post.id}
//                     onClose={() => setOpenComments(null)}
//                     onCommentCountChange={(newCount) => {
//                       // Update the comment count for this specific post
//                       setPosts(prev => prev.map(p => 
//                         p.id === post.id 
//                           ? { ...p, comment_count: newCount }
//                           : p
//                       ));
//                     }}
//                   />
//                 </div>
//               </CardContent>
//             </Card>
//               ))
//             ) : (
//               <Card className="text-center py-12">
//                 <CardContent>
//                   <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
//                   <h3 className="text-lg font-semibold text-gray-700 mb-2">No posts yet</h3>
//                   <p className="text-gray-500 mb-6">Be the first to share something with the GradNet community!</p>
//                   <Button 
//                     onClick={() => document.querySelector('textarea')?.focus()}
//                     className="bg-gradapp-primary hover:bg-gradapp-accent"
//                   >
//                     Create First Post
//                   </Button>
//                 </CardContent>
//               </Card>
//             )}
//           </div>
//         )}

//         {/* Load More */}
//         <div className="text-center">
//           <Button 
//             variant="outline" 
//             className="w-full"
//             onClick={() => {
//               // TODO: Implement pagination
//               toast.info('Load more functionality coming soon!');
//             }}
//           >
//             Load More Posts
//           </Button>
//         </div>

//       {/* Share Modal */}
//       {shareModalOpen && (
//         <ShareModal
//           postId={shareModalOpen}
//           postContent={posts.find(p => p.id === shareModalOpen)?.content || ''}
//           authorName={posts.find(p => p.id === shareModalOpen)?.author?.display_name || 'Unknown User'}
//           isOpen={Boolean(shareModalOpen)}
//           onClose={() => setShareModalOpen(null)}
//           onShare={() => handleShare(shareModalOpen)}
//           userId={user.id}
//           onRepost={(newPost) => {
//             // Add the repost to the top of the feed
//             setPosts(prev => [newPost, ...prev]);
//             // Also refresh the feed to ensure consistency
//             loadPosts();
//           }}
//         />
//       )}
//     </div>
//   );
// };

// export default SocialFeed;






import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Image as ImageIcon,
  FileText,
  Trophy,
  GraduationCap,
  MapPin,
  Clock,
  ThumbsUp,
  Send,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import { socialFeedService, Post, PostInput } from '@/services/socialFeedService';
import { userProfileService } from '@/services/userProfileService';
import { mediaUploadService, MediaUploadResult } from '@/utils/mediaUpload';
import { contentModerationService } from '@/utils/contentModeration';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
// import DatabaseSetupPrompt from './DatabaseSetupPrompt'; // Not needed with existing database

interface SocialFeedProps {
  user: User;
}

const SocialFeed: React.FC<SocialFeedProps> = ({ user }) => {
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState<'text' | 'achievement' | 'question' | 'resource' | 'event'>('text');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState<string | null>(null);
  // const [showDatabaseSetup, setShowDatabaseSetup] = useState(false); // Not needed

  // Demo data for when database tables don't exist
  const getDemoPosts = (): Post[] => [
    {
      id: 'demo-1',
      author_id: 'demo-user-1',
      content: 'Just got accepted to Stanford\'s PhD program in Computer Science! 🎉 The journey was tough but worth it. Happy to share my experience with anyone applying.',
      post_type: 'achievement',
      visibility: 'public',
      tags: ['PhD', 'Stanford', 'Computer Science'],
      likes_count: 45,
      comments_count: 12,
      shares_count: 8,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      author: {
        id: 'demo-user-1',
        display_name: 'Sarah Chen',
        profile_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b6e0b8a3?w=150&h=150&fit=crop&crop=face',
        field_of_study: 'Computer Science',
        academic_level: 'PhD Candidate',
        verified_status: true
      },
      is_liked: false,
      is_saved: false
    },
    {
      id: 'demo-2',
      author_id: 'demo-user-2',
      content: 'Looking for advice on writing a strong statement of purpose for graduate school. What are the key elements that admissions committees look for?',
      post_type: 'question',
      visibility: 'public',
      tags: ['SOP', 'Graduate School', 'Advice'],
      likes_count: 23,
      comments_count: 18,
      shares_count: 5,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      author: {
        id: 'demo-user-2',
        display_name: 'Michael Rodriguez',
        profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        field_of_study: 'Engineering',
        academic_level: 'Master\'s Applicant',
        verified_status: false
      },
      is_liked: true,
      is_saved: true
    },
    {
      id: 'demo-3',
      author_id: 'demo-user-3',
      content: 'Found this amazing resource for GRE preparation! It\'s a free practice test platform with detailed explanations. Link in the first comment 👇',
      post_type: 'resource',
      visibility: 'public',
      tags: ['GRE', 'Test Prep', 'Free Resources'],
      likes_count: 67,
      comments_count: 25,
      shares_count: 34,
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      author: {
        id: 'demo-user-3',
        display_name: 'Dr. Emily Watson',
        profile_image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        field_of_study: 'Education',
        academic_level: 'Professor',
        verified_status: true
      },
      is_liked: false,
      is_saved: false
    }
  ];

  useEffect(() => {
    ensureUserProfile();
    loadPosts();
    
    // Subscribe to real-time updates
    socialFeedService.subscribeToFeedUpdates(
      (newPost) => {
        setPosts(prev => [newPost, ...prev]);
      },
      (updatedPost) => {
        setPosts(prev => prev.map(post => 
          post.id === updatedPost.id ? updatedPost : post
        ));
      },
      (deletedPostId) => {
        setPosts(prev => prev.filter(post => post.id !== deletedPostId));
      }
    );

    // Subscribe to interaction updates
    socialFeedService.subscribeToInteractionUpdates(
      (postId, interactionType, delta) => {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            if (interactionType === 'like') {
              return { ...post, likes_count: post.likes_count + delta };
            } else if (interactionType === 'share') {
              return { ...post, shares_count: post.shares_count + delta };
            }
          }
          return post;
        }));
      }
    );

    // Subscribe to comment interaction updates
    socialFeedService.subscribeToCommentInteractions(
      (commentId, interactionType, delta) => {
        // Update comment like counts in real-time across all users
        // This will be handled by the CommentSection component when it's open
        // For now, we could trigger a refresh of trending topics when comments get lots of engagement
      }
    );

    return () => {
      socialFeedService.unsubscribeAll();
    };
  }, [user.id]);


  const ensureUserProfile = async () => {
    if (!user.id) {return;}
    
    try {
      // Check if user profile exists
      const existingProfile = await userProfileService.getUserProfile(user.id);
      
      if (!existingProfile) {
        console.log('Creating basic user profile for social features...');
        
        // Create a basic profile using the new method
        const basicProfile = await userProfileService.createBasicUserProfile(user);
        
        if (!basicProfile) {
          // If profile creation fails due to missing tables, continue with demo mode
          console.warn('Database tables missing, continuing with demo mode');
          toast.info('GradNet is running in demo mode. Full functionality requires database setup.');
          // Don't return, continue loading with mock data
        }
        
        console.log('Basic user profile created successfully:', basicProfile);
        toast.success('Welcome to GradNet! Your profile has been created.');
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      // Show info message if it's a database issue, but continue with demo mode
      if (error?.code === '42P01') {
        console.warn('Database tables missing, continuing with demo mode');
        toast.info('GradNet is running in demo mode. Full functionality requires database setup.');
      }
    }
  };

  const loadPosts = async (filter?: string) => {
    if (!user.id) {return;}
    
    setLoading(true);
    try {
      const feedType = filter === 'connections' ? 'connections' : 'all';
      const feedPosts = await socialFeedService.getFeedPosts(user.id, 20, 0, feedType);
      
      // Apply client-side filtering for post types
      let filteredPosts = feedPosts;
      if (filter && filter !== 'all' && filter !== 'connections') {
        filteredPosts = feedPosts.filter(post => {
          switch (filter) {
            case 'achievements':
              return post.post_type === 'achievement';
            case 'advice':
              return post.post_type === 'advice';
            case 'questions':
              return post.post_type === 'question';
            case 'resources':
              return post.post_type === 'resource';
            default:
              return true;
          }
        });
      }
      
      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      // For errors, show demo posts as fallback
      setPosts(getDemoPosts());
      toast.error('Unable to load posts from database. Showing demo content.');
    } finally {
      setLoading(false);
    }
  };



  const handleCreatePost = async () => {
    if (!newPost.trim() || !user.id) {return;}
    
    setCreating(true);
    try {
      // Content moderation check
      const moderationResult = contentModerationService.moderateContent(newPost);
      
      if (moderationResult.suggestedAction === 'block') {
        toast.error('Your post contains inappropriate content and cannot be published.');
        setCreating(false);
        return;
      }
      
      if (moderationResult.suggestedAction === 'flag') {
        toast.warning('Your post has been flagged for review. It may not appear immediately.');
      }
      
      // Auto-categorize post if type is 'text'
      let finalPostType = postType;
      if (postType === 'text') {
        const categorization = contentModerationService.categorizePost(newPost);
        if (categorization.confidence > 0.6) {
          finalPostType = categorization.category === 'general' ? 'text' : categorization.category;
        }
      }
      
      // Extract and clean hashtags
      const extractedTags = contentModerationService.extractHashtags(newPost);
      const allTags = [...new Set([...extractedTags, ...extractHashtags(newPost)])];
      
      const postData: PostInput = {
        content: contentModerationService.sanitizeContent(newPost),
        post_type: finalPostType,
        visibility: 'public',
        tags: allTags,
        media_urls: uploadedMedia.map(media => media.url)
      };
      
      const createdPost = await socialFeedService.createPost(postData, user.id);
      if (createdPost) {
        setNewPost('');
        setPostType('text');
        setUploadedMedia([]);
        
        // Add the new post to the top of the feed immediately
        setPosts(prev => [createdPost, ...prev]);
        
        // Also refresh the feed to ensure consistency
        await loadPosts();
        
        // Show success message with auto-categorization info
        if (finalPostType !== postType) {
          toast.success(`Post created and automatically categorized as "${finalPostType}"!`);
        } else {
          toast.success('Post created successfully!');
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      // Handle database table missing errors gracefully
      if (error?.code === '42P01' || error?.message?.includes('relation') || error?.message?.includes('table')) {
        toast.info('GradNet is running in demo mode. Posts cannot be saved, but you can explore the interface.');
      } else {
        toast.error('Failed to create post. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'document') => {
    if (!event.target.files || !user.id) {return;}
    
    const files = Array.from(event.target.files);
    const { valid, invalid } = mediaUploadService.validateFiles(files);
    
    if (invalid.length > 0) {
      invalid.forEach(({ file, reason }) => {
        toast.error(`${file.name}: ${reason}`);
      });
    }
    
    if (valid.length === 0) {return;}
    
    setUploading(true);
    try {
      const uploadResults = await mediaUploadService.uploadMultipleFiles(valid, user.id);
      setUploadedMedia(prev => [...prev, ...uploadResults]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const removeUploadedMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const extractHashtags = (content: string): string[] => {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const handleLike = async (postId: string) => {
    if (!user.id) {return;}
    
    // Get current post state for rollback
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) {return;}
    
    const wasLiked = currentPost.is_liked;
    const currentCount = currentPost.likes_count;
    
    // Optimistic update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          is_liked: !wasLiked,
          likes_count: currentCount + (!wasLiked ? 1 : -1)
        };
      }
      return post;
    }));
    
    try {
      const isLiked = await socialFeedService.togglePostLike(postId, user.id);
      
      // Sync with actual result from server
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: isLiked,
            likes_count: currentCount + (isLiked ? 1 : -1)
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Rollback optimistic update on error
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: wasLiked,
            likes_count: currentCount
          };
        }
        return post;
      }));
      
      toast.error('Failed to update like. Please try again.');
    }
  };

  const handleSave = async (postId: string) => {
    if (!user.id) {return;}
    
    try {
      const isSaved = await socialFeedService.togglePostSave(postId, user.id);
      
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return { ...post, is_saved: isSaved };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleShare = async (postId: string) => {
    if (!user.id) {return;}
    
    // Get current post state for rollback
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) {return;}
    
    const currentShareCount = currentPost.shares_count;
    
    // Optimistic update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, shares_count: currentShareCount + 1 };
      }
      return post;
    }));
    
    try {
      const success = await socialFeedService.sharePost(postId, user.id);
      
      if (!success) {
        // Rollback if share failed
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return { ...post, shares_count: currentShareCount };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      
      // Rollback optimistic update on error
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return { ...post, shares_count: currentShareCount };
        }
        return post;
      }));
      
      toast.error('Failed to share post. Please try again.');
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

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'advice':
        return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case 'question':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'resource':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'Achievement';
      case 'advice':
        return 'Advice';
      case 'question':
        return 'Question';
      case 'resource':
        return 'Resource';
      default:
        return 'Post';
    }
  };


  // Database tables exist, no setup prompt needed

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Create Post */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Share with the GradNet Community</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {(user.user_metadata?.full_name || user.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Select value={postType} onValueChange={(value: any) => setPostType(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Post type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">General Post</SelectItem>
                      <SelectItem value="achievement">🏆 Achievement</SelectItem>
                      <SelectItem value="question">❓ Question</SelectItem>
                      <SelectItem value="resource">📚 Resource</SelectItem>
                      <SelectItem value="event">📅 Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Share your graduate school journey, ask questions, or celebrate achievements..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[100px] resize-none border-gray-200 focus:ring-gradapp-primary focus:border-gradapp-primary"
                  />
                </div>
              </div>
              
              {/* Uploaded Media Preview */}
              {uploadedMedia.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Attached Files:</p>
                  <div className="space-y-2">
                    {uploadedMedia.map((media, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{mediaUploadService.getFileTypeIcon(media.fileType)}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{media.fileName}</p>
                            <p className="text-xs text-gray-500">{mediaUploadService.formatFileSize(media.fileSize)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUploadedMedia(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="photo-upload"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'photo')}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <LoadingSpinner variant="micro" size="xs" className="mr-2" />
                    ) : (
                      <ImageIcon className="h-4 w-4 mr-2" />
                    )}
                    Photo
                  </Button>
                  
                  <input
                    type="file"
                    id="document-upload"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, 'document')}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('document-upload')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <LoadingSpinner variant="micro" size="xs" className="mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Document
                  </Button>
                </div>
                <Button 
                  onClick={handleCreatePost}
                  disabled={!newPost.trim() || creating}
                  className="bg-gradapp-primary hover:bg-gradapp-accent"
                >
                  {creating ? (
                    <LoadingSpinner variant="micro" size="xs" className="mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {creating ? 'Posting...' : 'Share Post'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" message="Loading posts..." />
          </div>
        ) : (
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={post.author?.profile_image_url} />
                      <AvatarFallback>
                        {(post.author?.display_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {post.author?.display_name || 'Unknown User'}
                        </h3>
                        {post.author?.verified_status && (
                          <Badge variant="default" className="text-xs flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {getPostIcon(post.post_type)}
                          {getPostTypeLabel(post.post_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {post.author?.academic_level} 
                        {post.author?.field_of_study && ` • ${post.author.field_of_study}`}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(post.created_at)}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-800 leading-relaxed">{post.content}</p>
                  
                  {/* Media/Documents */}
                  {post.media_urls && post.media_urls.length > 0 && (
                    <div className="space-y-3">
                      {post.media_urls.map((mediaUrl, index) => {
                        const isImage = mediaUrl.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(mediaUrl);
                        const isPDF = mediaUrl.includes('pdf') || mediaUrl.endsWith('.pdf');
                        const isVideo = mediaUrl.includes('video') || /\.(mp4|mov|avi)$/i.test(mediaUrl);
                        
                        if (isImage) {
                          return (
                            <div key={index} className="rounded-lg overflow-hidden border border-gray-200">
                              <img 
                                src={mediaUrl} 
                                alt="Post media" 
                                className="w-full max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(mediaUrl, '_blank')}
                              />
                            </div>
                          );
                        } else if (isVideo) {
                          return (
                            <div key={index} className="rounded-lg overflow-hidden border border-gray-200">
                              <video 
                                src={mediaUrl} 
                                controls 
                                className="w-full max-h-96 object-cover"
                              />
                            </div>
                          );
                        } 
                          return (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3">
                                {isPDF ? (
                                  <span className="text-2xl">📄</span>
                                ) : (
                                  <FileText className="h-8 w-8 text-gradapp-primary" />
                                )}
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm text-gray-900">Document Attachment</h4>
                                  <p className="text-xs text-gray-500 truncate">Click to view or download</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(mediaUrl, '_blank')}
                                  className="text-gradapp-primary hover:text-gradapp-accent"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        
                      })}
                    </div>
                  )}
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {(post.tags || []).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs cursor-pointer hover:bg-gray-200">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Engagement Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`flex items-center gap-1 ${post.likes_count > 0 ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                        <Heart className={`h-3 w-3 ${post.likes_count > 0 ? 'fill-current' : ''}`} />
                        {post.likes_count || 0} {post.likes_count === 1 ? 'like' : 'likes'}
                      </span>
                      <span className={`flex items-center gap-1 ${post.comments_count > 0 ? 'text-blue-500 font-medium' : 'text-gray-600'}`}>
                        <MessageCircle className="h-3 w-3" />
                        {post.comments_count || 0} {post.comments_count === 1 ? 'comment' : 'comments'}
                      </span>
                      <span className={`flex items-center gap-1 ${post.shares_count > 0 ? 'text-green-500 font-medium' : 'text-gray-600'}`}>
                        <Share2 className="h-3 w-3" />
                        {post.shares_count || 0} {post.shares_count === 1 ? 'share' : 'shares'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 hover:text-red-500 transition-colors ${
                          post.is_liked ? 'text-red-500 bg-red-50' : ''
                        }`}
                        title={`${post.likes_count} ${post.likes_count === 1 ? 'like' : 'likes'}`}
                      >
                        <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                        Like{post.likes_count > 0 && ` (${post.likes_count})`}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
                        className={`flex items-center gap-2 hover:text-blue-500 transition-colors ${
                          openComments === post.id ? 'text-blue-500 bg-blue-50' : ''
                        }`}
                        title={`${post.comments_count} ${post.comments_count === 1 ? 'comment' : 'comments'}`}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Comment{post.comments_count > 0 && ` (${post.comments_count})`}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShareModalOpen(post.id)}
                        className="flex items-center gap-2 hover:text-green-500 transition-colors"
                        title={`${post.shares_count} ${post.shares_count === 1 ? 'share' : 'shares'}`}
                      >
                        <Share2 className="h-4 w-4" />
                        Share{post.shares_count > 0 && ` (${post.shares_count})`}
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSave(post.id)}
                      className={`hover:text-gradapp-primary ${
                        post.is_saved ? 'text-gradapp-primary' : ''
                      }`}
                    >
                      <Bookmark className={`h-4 w-4 ${post.is_saved ? 'fill-current' : ''}`} />
                    </Button>
                  </div>

                  {/* Comment Section */}
                  <CommentSection
                    postId={post.id}
                    user={user}
                    isOpen={openComments === post.id}
                    onClose={() => setOpenComments(null)}
                    onCommentCountChange={(newCount) => {
                      // Update the comment count for this specific post
                      setPosts(prev => prev.map(p => 
                        p.id === post.id 
                          ? { ...p, comments_count: newCount }
                          : p
                      ));
                    }}
                  />
                </div>
              </CardContent>
            </Card>
              ))
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No posts yet</h3>
                  <p className="text-gray-500 mb-6">Be the first to share something with the GradNet community!</p>
                  <Button 
                    onClick={() => document.querySelector('textarea')?.focus()}
                    className="bg-gradapp-primary hover:bg-gradapp-accent"
                  >
                    Create First Post
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Load More */}
        <div className="text-center">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              // TODO: Implement pagination
              toast.info('Load more functionality coming soon!');
            }}
          >
            Load More Posts
          </Button>
        </div>

      {/* Share Modal */}
      {shareModalOpen && (
        <ShareModal
          postId={shareModalOpen}
          postContent={posts.find(p => p.id === shareModalOpen)?.content || ''}
          authorName={posts.find(p => p.id === shareModalOpen)?.author?.display_name || 'Unknown User'}
          isOpen={Boolean(shareModalOpen)}
          onClose={() => setShareModalOpen(null)}
          onShare={() => handleShare(shareModalOpen)}
          userId={user.id}
          onRepost={(newPost) => {
            // Add the repost to the top of the feed
            setPosts(prev => [newPost, ...prev]);
            // Also refresh the feed to ensure consistency
            loadPosts();
          }}
        />
      )}
    </div>
  );
};

export default SocialFeed;