import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  user_id: string;
  role: 'applicant' | 'mentor' | 'admin' | 'university_rep' | 'consultant' | 'super_admin';
  full_name: string;
  display_name?: string;
  bio?: string;
  profile_picture_url?: string;
  cover_photo_url?: string;
  location?: string;
  timezone: string;
  date_of_birth?: string;
  nationality?: string;
  email?: string;
  phone?: string;
  alternate_email?: string;
  linkedin_url?: string;
  website_url?: string;
  github_url?: string;
  twitter_url?: string;
  orcid_id?: string;
  google_scholar_url?: string;
  researchgate_url?: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  profile_visibility: 'public' | 'private' | 'connections';
  search_visibility: boolean;
  language_preference: string;
  theme_preference: string;
  notification_frequency: string;
  is_verified: boolean;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  verification_documents: any[];
  verification_notes?: string;
  last_active_at: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  profile_completion_percentage: number;
  two_factor_enabled: boolean;
  account_locked: boolean;
  login_attempts: number;
  last_password_change?: string;
  privacy_settings: any;
  total_posts: number;
  total_comments: number;
  total_likes: number;
  reputation_score: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Post {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  post_type: 'general' | 'question' | 'resource' | 'achievement' | 'announcement' | 'discussion' | 'job_posting' | 'study_group' | 'mentor_request' | 'success_story';
  media_urls?: string[];
  media_types?: string[];
  media_captions?: string[];
  tags?: string[];
  categories?: string[];
  university_tags?: string[];
  program_tags?: string[];
  visibility: 'public' | 'private' | 'connections' | 'mentors';
  allowed_viewers?: string[];
  comments_enabled: boolean;
  sharing_enabled: boolean;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  is_flagged: boolean;
  flag_reason?: string;
  is_approved: boolean;
  moderated_by?: string;
  moderated_at?: string;
  is_scheduled: boolean;
  scheduled_for?: string;
  is_pinned: boolean;
  is_archived: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  last_activity: string;
  user_profile?: UserProfile;
  is_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  media_url?: string;
  like_count: number;
  reply_count: number;
  is_flagged: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
  is_liked?: boolean;
  replies?: Comment[];
}

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  connection_type: 'peer' | 'mentor' | 'mentee' | 'colleague' | 'alumni';
  request_message?: string;
  response_message?: string;
  mutual_connections: number;
  common_interests?: string[];
  common_universities?: string[];
  interaction_score: number;
  is_visible: boolean;
  requested_at: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  requester_profile?: UserProfile;
  receiver_profile?: UserProfile;
}

export interface Conversation {
  id: string;
  title?: string;
  description?: string;
  conversation_type: 'direct' | 'group' | 'support' | 'mentor_session';
  is_group: boolean;
  max_participants: number;
  admin_user_id?: string;
  is_active: boolean;
  is_archived: boolean;
  is_muted: boolean;
  is_encrypted: boolean;
  visibility: 'public' | 'private' | 'connections';
  participant_count: number;
  message_count: number;
  last_message_at?: string;
  last_activity: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'document' | 'link' | 'location' | 'contact' | 'voice_note';
  media_url?: string;
  media_type?: string;
  file_size?: number;
  file_name?: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  reply_to_message_id?: string;
  is_system_message: boolean;
  delivery_status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reaction_count: number;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  read_at?: string;
  sender_profile?: UserProfile;
}

// Add academic profile interface for enhanced user data
export interface AcademicProfile {
  id: string;
  user_id: string;
  current_degree?: string;
  current_institution?: string;
  current_field_of_study?: string;
  current_gpa?: number;
  current_cgpa?: number;
  graduation_year?: number;
  graduation_month?: number;
  expected_graduation?: string;
  previous_education?: any[];
  honors_awards?: string[];
  scholarships?: string[];
  dean_list_semesters?: string[];
  publications?: string[];
  conferences_attended?: string[];
  presentations_given?: string[];
  research_experience?: string;
  work_experience?: string;
  internships?: string[];
  volunteer_experience?: string;
  leadership_experience?: string;
  certifications?: string[];
  professional_memberships?: string[];
  gre_verbal?: number;
  gre_quantitative?: number;
  gre_analytical?: number;
  gre_date?: string;
  gmat_score?: number;
  gmat_date?: string;
  toefl_score?: number;
  toefl_date?: string;
  ielts_score?: number;
  ielts_date?: string;
  duolingo_score?: number;
  duolingo_date?: string;
  technical_skills?: string[];
  soft_skills?: string[];
  programming_languages?: string[];
  tools_and_technologies?: string[];
  languages?: any[];
  research_interests?: string[];
  career_goals?: string;
  target_industries?: string[];
  preferred_work_locations?: string[];
  reference_contacts?: any[];
  profile_strength_score: number;
  last_cv_upload?: string;
  cv_analysis_score?: number;
  created_at: string;
  updated_at: string;
}

class GradNetService {
  /**
   * Get user profile with academic data
   */
  async getUserProfile(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          academic_profile:academic_profiles(*),
          research_interests:user_research_interests(
            research_interest:research_interests(name)
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {throw error;}

      // Format research interests
      if (profile) {
        profile.research_interests = profile.research_interests?.map(
          (ri: any) => ri.research_interest.name
        ) || [];
      }

      return { data: profile, error: null };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch profile' 
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {throw error;}

      return { data: profile, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      };
    }
  }

  /**
   * Get feed posts with pagination using schema tables
   */
  async getFeedPosts(userId?: string, options: {
    limit?: number;
    offset?: number;
    categories?: string[];
    post_type?: string;
    visibility?: 'public' | 'private' | 'connections' | 'mentors';
  } = {}) {
    try {
      let query = supabase
        .from('gradnet_posts')
        .select(`
          *,
          user_profile:user_profiles!user_id(
            full_name,
            display_name,
            profile_picture_url,
            role,
            academic_profile:academic_profiles(
              current_institution,
              current_field_of_study,
              current_degree
            )
          ),
          gradnet_likes!left(user_id),
          gradnet_comments(count)
        `)
        .eq('is_approved', true)
        .eq('is_archived', false);

      // Apply visibility filter - default to public for non-authenticated users
      if (!userId) {
        query = query.eq('visibility', 'public');
      } else {
        // For authenticated users, show public and their own posts
        query = query.or(`visibility.eq.public,user_id.eq.${userId}`);
      }

      // Apply filters
      if (options.categories && options.categories.length > 0) {
        query = query.overlaps('categories', options.categories);
      }

      if (options.post_type) {
        query = query.eq('post_type', options.post_type);
      }

      if (options.visibility) {
        query = query.eq('visibility', options.visibility);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      // Order by last_activity descending for engagement-based feed
      query = query.order('last_activity', { ascending: false });

      const { data: posts, error } = await query;

      if (error) {throw error;}

      // Format posts with like status
      const formattedPosts = posts?.map(post => ({
        ...post,
        is_liked: userId ? post.gradnet_likes?.some((like: any) => like.user_id === userId) : false,
        comments_count: post.gradnet_comments?.[0]?.count || 0
      })) || [];

      return { data: formattedPosts, error: null };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch posts' 
      };
    }
  }

  /**
   * Create a new post using schema structure
   */
  async createPost(userId: string, postData: {
    title?: string;
    content: string;
    post_type: 'general' | 'question' | 'resource' | 'achievement' | 'announcement' | 'discussion' | 'job_posting' | 'study_group' | 'mentor_request' | 'success_story';
    media_urls?: string[];
    media_types?: string[];
    media_captions?: string[];
    tags?: string[];
    categories?: string[];
    university_tags?: string[];
    program_tags?: string[];
    visibility?: 'public' | 'private' | 'connections' | 'mentors';
  }) {
    try {
      const { data: post, error } = await supabase
        .from('gradnet_posts')
        .insert({
          user_id: userId,
          title: postData.title,
          content: postData.content,
          post_type: postData.post_type,
          media_urls: postData.media_urls || [],
          media_types: postData.media_types || [],
          media_captions: postData.media_captions || [],
          tags: postData.tags || [],
          categories: postData.categories || [],
          university_tags: postData.university_tags || [],
          program_tags: postData.program_tags || [],
          visibility: postData.visibility || 'public',
          comments_enabled: true,
          sharing_enabled: true,
          like_count: 0,
          comment_count: 0,
          share_count: 0,
          view_count: 0,
          is_flagged: false,
          is_approved: true,
          is_scheduled: false,
          is_pinned: false,
          is_archived: false,
          last_activity: new Date().toISOString(),
          published_at: new Date().toISOString()
        })
        .select(`
          *,
          user_profile:user_profiles!user_id(
            full_name,
            display_name,
            profile_picture_url,
            role,
            academic_profile:academic_profiles(
              current_institution,
              current_field_of_study,
              current_degree
            )
          )
        `)
        .single();

      if (error) {throw error;}

      return { data: post, error: null };
    } catch (error) {
      console.error('Error creating post:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create post' 
      };
    }
  }

  /**
   * Like/unlike a post using schema tables
   */
  async togglePostLike(postId: string, userId: string) {
    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('gradnet_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('gradnet_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        // Decrease likes count and update last activity
        await supabase
          .from('gradnet_posts')
          .update({ 
            like_count: supabase.sql`like_count - 1`,
            last_activity: new Date().toISOString()
          })
          .eq('id', postId);
      } else {
        // Like
        await supabase
          .from('gradnet_likes')
          .insert({ 
            post_id: postId, 
            user_id: userId,
            reaction_type: 'like'
          });

        // Increase likes count and update last activity
        await supabase
          .from('gradnet_posts')
          .update({ 
            like_count: supabase.sql`like_count + 1`,
            last_activity: new Date().toISOString()
          })
          .eq('id', postId);
      }

      return { error: null };
    } catch (error) {
      console.error('Error toggling post like:', error);
      return { error: error instanceof Error ? error.message : 'Failed to toggle like' };
    }
  }

  /**
   * Get post comments using schema tables
   */
  async getPostComments(postId: string, userId?: string) {
    try {
      const { data: comments, error } = await supabase
        .from('gradnet_comments')
        .select(`
          *,
          user_profile:user_profiles!user_id(
            full_name,
            display_name,
            profile_picture_url,
            role
          ),
          gradnet_likes!left(user_id, comment_id)
        `)
        .eq('post_id', postId)
        .eq('is_approved', true)
        .order('created_at', { ascending: true });

      if (error) {throw error;}

      // Format comments with like status
      const formattedComments = comments?.map(comment => ({
        ...comment,
        is_liked: userId ? comment.gradnet_likes?.some((like: any) => like.user_id === userId) : false
      })) || [];

      return { data: formattedComments, error: null };
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch comments' 
      };
    }
  }

  /**
   * Add comment to post using schema tables
   */
  async addComment(postId: string, userId: string, content: string, parentCommentId?: string, mediaUrl?: string) {
    try {
      const { data: comment, error } = await supabase
        .from('gradnet_comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content,
          parent_comment_id: parentCommentId,
          media_url: mediaUrl,
          like_count: 0,
          reply_count: 0,
          is_flagged: false,
          is_approved: true
        })
        .select(`
          *,
          user_profile:user_profiles!user_id(
            full_name,
            display_name,
            profile_picture_url,
            role
          )
        `)
        .single();

      if (error) {throw error;}

      // Increment post comments count and update last activity
      await supabase
        .from('gradnet_posts')
        .update({ 
          comment_count: supabase.sql`comment_count + 1`,
          last_activity: new Date().toISOString()
        })
        .eq('id', postId);

      // If this is a reply, increment parent comment reply count
      if (parentCommentId) {
        await supabase
          .from('gradnet_comments')
          .update({ reply_count: supabase.sql`reply_count + 1` })
          .eq('id', parentCommentId);
      }

      return { data: comment, error: null };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to add comment' 
      };
    }
  }

  /**
   * Search users for networking using enhanced schema
   */
  async searchUsers(query: string, filters: {
    role?: 'applicant' | 'mentor' | 'admin' | 'university_rep' | 'consultant';
    location?: string;
    university?: string;
    field_of_study?: string;
    current_degree?: string;
    research_interests?: string[];
    skills?: string[];
  } = {}) {
    try {
      let dbQuery = supabase
        .from('user_profiles')
        .select(`
          *,
          academic_profile:academic_profiles(*),
          research_interests:user_research_interests(
            research_interest:research_interests(name)
          )
        `)
        .eq('search_visibility', true)
        .eq('account_locked', false)
        .eq('profile_visibility', 'public');

      // Apply text search across multiple fields
      if (query) {
        dbQuery = dbQuery.or(`full_name.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%,location.ilike.%${query}%`);
      }

      // Apply role filter
      if (filters.role) {
        dbQuery = dbQuery.eq('role', filters.role);
      }

      // Apply location filter
      if (filters.location) {
        dbQuery = dbQuery.ilike('location', `%${filters.location}%`);
      }

      const { data: users, error } = await dbQuery.limit(20);

      if (error) {throw error;}

      // Format and filter users based on academic criteria
      let formattedUsers = users?.map(user => ({
        ...user,
        research_interests: user.research_interests?.map(
          (ri: any) => ri.research_interest.name
        ) || []
      })) || [];

      // Apply academic filters if provided
      if (filters.university && formattedUsers) {
        formattedUsers = formattedUsers.filter(user => 
          user.academic_profile?.current_institution?.toLowerCase().includes(filters.university!.toLowerCase())
        );
      }

      if (filters.field_of_study && formattedUsers) {
        formattedUsers = formattedUsers.filter(user =>
          user.academic_profile?.current_field_of_study?.toLowerCase().includes(filters.field_of_study!.toLowerCase())
        );
      }

      if (filters.current_degree && formattedUsers) {
        formattedUsers = formattedUsers.filter(user =>
          user.academic_profile?.current_degree?.toLowerCase().includes(filters.current_degree!.toLowerCase())
        );
      }

      if (filters.research_interests && filters.research_interests.length > 0 && formattedUsers) {
        formattedUsers = formattedUsers.filter(user =>
          user.research_interests.some((interest: string) =>
            filters.research_interests!.some(filterInterest =>
              interest.toLowerCase().includes(filterInterest.toLowerCase())
            )
          )
        );
      }

      return { data: formattedUsers, error: null };
    } catch (error) {
      console.error('Error searching users:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to search users' 
      };
    }
  }

  /**
   * Send connection request using schema tables
   */
  async sendConnectionRequest(requesterId: string, receiverId: string, message?: string, connectionType: 'peer' | 'mentor' | 'mentee' | 'colleague' | 'alumni' = 'peer') {
    try {
      // Check if connection already exists
      const { data: existingConnection } = await supabase
        .from('gradnet_connections')
        .select('id, status')
        .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`)
        .single();

      if (existingConnection) {
        throw new Error('Connection already exists or pending');
      }

      // Get mutual connections and common interests for enhanced matching
      const [mutualConnections, commonInterests, commonUniversities] = await Promise.all([
        this.getMutualConnectionsCount(requesterId, receiverId),
        this.getCommonInterests(requesterId, receiverId),
        this.getCommonUniversities(requesterId, receiverId)
      ]);

      const { data: connection, error } = await supabase
        .from('gradnet_connections')
        .insert({
          requester_id: requesterId,
          receiver_id: receiverId,
          status: 'pending',
          connection_type: connectionType,
          request_message: message,
          mutual_connections: mutualConnections.count || 0,
          common_interests: commonInterests,
          common_universities: commonUniversities,
          interaction_score: 0,
          is_visible: true,
          requested_at: new Date().toISOString()
        })
        .select(`
          *,
          requester_profile:user_profiles!requester_id(
            full_name, 
            display_name, 
            profile_picture_url, 
            role,
            academic_profile:academic_profiles(current_institution, current_field_of_study)
          ),
          receiver_profile:user_profiles!receiver_id(
            full_name, 
            display_name, 
            profile_picture_url, 
            role,
            academic_profile:academic_profiles(current_institution, current_field_of_study)
          )
        `)
        .single();

      if (error) {throw error;}

      // Send notification
      await this.sendConnectionNotification(connection.id, 'connection_request');

      return { data: connection, error: null };
    } catch (error) {
      console.error('Error sending connection request:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to send connection request' 
      };
    }
  }

  /**
   * Respond to connection request using schema tables
   */
  async respondToConnectionRequest(connectionId: string, userId: string, response: 'accepted' | 'declined', responseMessage?: string) {
    try {
      const { data: connection, error } = await supabase
        .from('gradnet_connections')
        .update({ 
          status: response,
          response_message: responseMessage,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
        .eq('receiver_id', userId)
        .select(`
          *,
          requester_profile:user_profiles!requester_id(
            full_name, 
            display_name, 
            profile_picture_url
          ),
          receiver_profile:user_profiles!receiver_id(
            full_name, 
            display_name, 
            profile_picture_url
          )
        `)
        .single();

      if (error) {throw error;}

      // Send notification
      await this.sendConnectionNotification(connectionId, `connection_${response}`);

      return { data: connection, error: null };
    } catch (error) {
      console.error('Error responding to connection request:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to respond to connection request' 
      };
    }
  }

  /**
   * Get user connections using schema tables
   */
  async getUserConnections(userId: string, status: 'pending' | 'accepted' | 'declined' | 'blocked' = 'accepted') {
    try {
      const { data: connections, error } = await supabase
        .from('gradnet_connections')
        .select(`
          *,
          requester_profile:user_profiles!requester_id(
            user_id, 
            full_name,
            display_name, 
            profile_picture_url, 
            role,
            location,
            academic_profile:academic_profiles(
              current_institution, 
              current_field_of_study,
              current_degree
            )
          ),
          receiver_profile:user_profiles!receiver_id(
            user_id, 
            full_name,
            display_name, 
            profile_picture_url, 
            role,
            location,
            academic_profile:academic_profiles(
              current_institution, 
              current_field_of_study,
              current_degree
            )
          )
        `)
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', status)
        .eq('is_visible', true)
        .order('updated_at', { ascending: false });

      if (error) {throw error;}

      // Format connections to show the other person's profile
      const formattedConnections = connections?.map(connection => {
        const isRequester = connection.requester_id === userId;
        return {
          ...connection,
          connected_user: isRequester ? connection.receiver_profile : connection.requester_profile
        };
      }) || [];

      return { data: formattedConnections, error: null };
    } catch (error) {
      console.error('Error fetching connections:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch connections' 
      };
    }
  }

  /**
   * Get pending connection requests using schema tables
   */
  async getPendingConnectionRequests(userId: string) {
    try {
      const { data: requests, error } = await supabase
        .from('gradnet_connections')
        .select(`
          *,
          requester_profile:user_profiles!requester_id(
            full_name,
            display_name, 
            profile_picture_url, 
            role,
            bio,
            location,
            academic_profile:academic_profiles(
              current_institution, 
              current_field_of_study,
              current_degree
            )
          )
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .eq('is_visible', true)
        .order('requested_at', { ascending: false });

      if (error) {throw error;}

      return { data: requests || [], error: null };
    } catch (error) {
      console.error('Error fetching connection requests:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch connection requests' 
      };
    }
  }

  /**
   * Create or get conversation
   */
  async createOrGetConversation(participants: string[], conversationType: 'direct' | 'group' = 'direct', title?: string) {
    try {
      // For direct messages, check if conversation already exists
      if (conversationType === 'direct' && participants.length === 2) {
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('conversation_type', 'direct')
          .contains('participants', participants)
          .single();

        if (existingConversation) {
          return { data: existingConversation, error: null };
        }
      }

      // Create new conversation
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          participants,
          conversation_type: conversationType,
          title,
          last_activity: new Date().toISOString(),
          is_archived: false,
          created_by: participants[0]
        })
        .select()
        .single();

      if (error) {throw error;}

      return { data: conversation, error: null };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create conversation' 
      };
    }
  }

  /**
   * Send message
   */
  async sendMessage(conversationId: string, senderId: string, content: string, messageType = 'text') {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
          is_edited: false,
          is_read: false,
          read_by: [senderId]
        })
        .select(`
          *,
          sender_profile:user_profiles!sender_id(display_name, profile_image_url)
        `)
        .single();

      if (error) {throw error;}

      // Update conversation last activity
      await supabase
        .from('conversations')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', conversationId);

      return { data: message, error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      };
    }
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId: string) {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages!inner(
            id, content, sender_id, created_at, message_type,
            sender_profile:user_profiles!sender_id(display_name, profile_image_url)
          )
        `)
        .contains('participants', [userId])
        .eq('is_archived', false)
        .order('last_activity', { ascending: false });

      if (error) {throw error;}

      // Get the latest message for each conversation
      const formattedConversations = conversations?.map(conversation => {
        const sortedMessages = conversation.messages.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return {
          ...conversation,
          last_message: sortedMessages[0] || null,
          messages: undefined // Remove messages array from response
        };
      }) || [];

      return { data: formattedConversations, error: null };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch conversations' 
      };
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string, limit = 50) {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:user_profiles!sender_id(display_name, profile_image_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {throw error;}

      return { data: messages?.reverse() || [], error: null };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch messages' 
      };
    }
  }

  /**
   * Get mentors based on user's field and interests
   */
  async findMentors(userId: string, filters: {
    field_of_study?: string;
    research_interests?: string[];
    experience_level?: string;
    location?: string;
  } = {}) {
    try {
      const { data: mentors, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          academic_profile:academic_profiles(*),
          mentor_profile:mentor_profiles(*),
          research_interests:user_research_interests(
            research_interest:research_interests(name)
          )
        `)
        .eq('role', 'mentor')
        .eq('account_locked', false)
        .eq('profile_visibility', 'public');

      if (error) {throw error;}

      // Format and filter mentors
      let formattedMentors = mentors?.map(mentor => ({
        ...mentor,
        research_interests: mentor.research_interests?.map(
          (ri: any) => ri.research_interest.name
        ) || []
      })) || [];

      // Apply filters
      if (filters.field_of_study && formattedMentors) {
        formattedMentors = formattedMentors.filter(mentor =>
          mentor.academic_profile?.current_field_of_study?.toLowerCase().includes(filters.field_of_study!.toLowerCase())
        );
      }

      if (filters.research_interests && filters.research_interests.length > 0 && formattedMentors) {
        formattedMentors = formattedMentors.filter(mentor =>
          mentor.research_interests.some((interest: string) =>
            filters.research_interests!.some(filterInterest =>
              interest.toLowerCase().includes(filterInterest.toLowerCase())
            )
          )
        );
      }

      if (filters.location && formattedMentors) {
        formattedMentors = formattedMentors.filter(mentor =>
          mentor.location?.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }

      return { data: formattedMentors, error: null };
    } catch (error) {
      console.error('Error finding mentors:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to find mentors' 
      };
    }
  }

  /**
   * Helper method to get mutual connections count
   */
  private async getMutualConnectionsCount(userId1: string, userId2: string) {
    try {
      // Get all connections for both users
      const [connections1, connections2] = await Promise.all([
        this.getUserConnections(userId1, 'accepted'),
        this.getUserConnections(userId2, 'accepted')
      ]);

      // Find common connections
      const userIds1 = connections1.data?.map(conn => conn.connected_user.user_id) || [];
      const userIds2 = connections2.data?.map(conn => conn.connected_user.user_id) || [];
      const mutualCount = userIds1.filter(id => userIds2.includes(id)).length;

      return { count: mutualCount, error: null };
    } catch (error) {
      console.error('Error getting mutual connections:', error);
      return { count: 0, error: error instanceof Error ? error.message : 'Failed to get mutual connections' };
    }
  }

  /**
   * Helper method to get common interests between users
   */
  private async getCommonInterests(userId1: string, userId2: string): Promise<string[]> {
    try {
      const [profile1, profile2] = await Promise.all([
        this.getUserProfile(userId1),
        this.getUserProfile(userId2)
      ]);

      const interests1 = profile1.data?.research_interests || [];
      const interests2 = profile2.data?.research_interests || [];
      
      return interests1.filter(interest => interests2.includes(interest));
    } catch (error) {
      console.error('Error getting common interests:', error);
      return [];
    }
  }

  /**
   * Helper method to get common universities between users
   */
  private async getCommonUniversities(userId1: string, userId2: string): Promise<string[]> {
    try {
      const [profile1, profile2] = await Promise.all([
        this.getUserProfile(userId1),
        this.getUserProfile(userId2)
      ]);

      const uni1 = profile1.data?.academic_profile?.current_institution;
      const uni2 = profile2.data?.academic_profile?.current_institution;
      
      if (uni1 && uni2 && uni1.toLowerCase() === uni2.toLowerCase()) {
        return [uni1];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting common universities:', error);
      return [];
    }
  }

  /**
   * Private helper methods
   */
  private async sendConnectionNotification(connectionId: string, type: string) {
    try {
      // This would integrate with the notification service
      console.log(`Sending ${type} notification for connection ${connectionId}`);
    } catch (error) {
      console.error('Error sending connection notification:', error);
    }
  }

  /**
   * Get unread message count for user
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_unread_message_count', { 
        user_id: userId 
      });
      
      if (error) {
        console.warn('Error calling get_unread_message_count RPC:', error);
        return 0;
      }
      
      return data || 0;
    } catch (error) {
      console.warn('Error fetching unread message count:', error);
      return 0;
    }
  }

  /**
   * Get CV analysis statistics for dashboard
   */
  async getCvAnalysisStats(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_cv_analysis_stats', { 
        user_id: userId 
      });
      
      if (error) {
        console.warn('Error calling get_cv_analysis_stats RPC:', error);
        return { total_analyses: 0, latest_score: 0, avg_score: 0, last_analysis: null };
      }
      
      return data || { total_analyses: 0, latest_score: 0, avg_score: 0, last_analysis: null };
    } catch (error) {
      console.warn('Error fetching CV analysis stats:', error);
      return { total_analyses: 0, latest_score: 0, avg_score: 0, last_analysis: null };
    }
  }
}

// Export singleton instance
export const gradnetService = new GradNetService();
export default gradnetService;