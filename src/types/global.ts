// 🔒 ULTRA-SECURE TYPE DEFINITIONS
// Complete type safety for all application interfaces

import { Database, Tables, Enums } from '@/integrations/supabase/types';

// =============================================================================
// DATABASE TYPES - Direct from Supabase
// =============================================================================

export type UserProfile = Tables<'user_profiles'>;
export type AcademicProfile = Tables<'academic_profiles'>;
export type MentorProfile = Tables<'mentor_profiles'>;
export type Application = Tables<'applications'>;
export type ApplicationRequirement = Tables<'application_requirements'>;
export type Deadline = Tables<'deadlines'>;
export type Post = Tables<'posts'>;
export type Message = Tables<'messages'>;
export type Conversation = Tables<'conversations'>;
export type UniversityProgram = Tables<'university_programs'>;
export type University = Tables<'universities'>;
export type Resume = Tables<'resumes'>;
export type CVAnalysis = Tables<'cv_analysis'>;
export type MentorshipSession = Tables<'mentorship_sessions'>;
export type UserConnection = Tables<'user_connections'>;

// =============================================================================
// ENUM TYPES - Type-safe enums
// =============================================================================

export type ApplicationStatus = Enums<'application_status'>;
export type ConnectionStatus = Enums<'connection_status'>;
export type UserRole = Enums<'user_role'>;

// =============================================================================
// API RESPONSE TYPES - Standardized response interfaces
// =============================================================================

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  success: boolean;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =============================================================================
// CHAT & MESSAGING TYPES - Real-time communication
// =============================================================================

export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachments?: MessageAttachment[];
  reply_to_id?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  file_url: string;
  file_size: number;
  mime_type: string;
}

export interface ConversationDetails extends Conversation {
  participants: UserProfile[];
  last_message?: ChatMessage;
  unread_count: number;
}

// =============================================================================
// UNIVERSITY & PROGRAM TYPES - Academic data structures
// =============================================================================

export interface UniversityDetails extends University {
  programs: UniversityProgram[];
  ranking_info?: {
    global_rank?: number;
    national_rank?: number;
    field_rankings?: Record<string, number>;
  };
}

export interface MatchedUniversity {
  id: string;
  university_name: string;
  program_name: string;
  location: string;
  match_score: number;
  match_reason: string;
  website_url?: string;
  application_deadline?: string;
  tuition_fee?: string;
  ranking?: string;
  category: 'reach' | 'target' | 'safety';
  admission_requirements?: {
    gpa_requirement?: string;
    gre_requirement?: string;
    toefl_requirement?: string;
  };
}

export interface ProfessorMatch {
  id: string;
  professor_name: string;
  university: string;
  department: string;
  research_areas: string[];
  match_score: number;
  match_reason: string;
  email?: string;
  profile_url?: string;
}

// =============================================================================
// APPLICATION TRACKING TYPES - Progress management
// =============================================================================

export interface ApplicationProgress extends Application {
  university_name: string;
  program_name: string;
  requirements: ApplicationRequirement[];
  deadlines: Deadline[];
  completed_requirements: number;
  total_requirements: number;
  next_deadline?: Deadline;
  status_history?: ApplicationStatusHistory[];
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  previous_status: ApplicationStatus;
  new_status: ApplicationStatus;
  changed_at: string;
  notes?: string;
}

export interface DeadlineAlert {
  id: string;
  application_id: string;
  deadline: Deadline;
  university_name: string;
  program_name: string;
  days_remaining: number;
  is_urgent: boolean;
  notification_sent: boolean;
}

// =============================================================================
// MENTOR PLATFORM TYPES - Mentorship system
// =============================================================================

export interface MentorDetails extends MentorProfile {
  user_profile: UserProfile;
  specializations: string[];
  availability_schedule: MentorAvailability;
  recent_sessions: MentorshipSession[];
  student_testimonials: MentorTestimonial[];
  verification_documents: VerificationDocument[];
}

export interface MentorAvailability {
  timezone: string;
  weekly_schedule: Record<string, {
      start_time: string;
      end_time: string;
      available: boolean;
    }>;
  blocked_dates: string[];
  booking_window_days: number;
}

export interface MentorTestimonial {
  id: string;
  student_id: string;
  student_name: string;
  rating: number;
  review: string;
  session_date: string;
  created_at: string;
}

export interface VerificationDocument {
  id: string;
  document_type: 'degree' | 'certification' | 'employment' | 'other';
  title: string;
  file_url: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_at?: string;
}

// =============================================================================
// SOCIAL PLATFORM TYPES - GradNet networking
// =============================================================================

export interface PostDetails extends Post {
  author: UserProfile;
  interactions: PostInteraction[];
  comments: PostComment[];
  is_liked_by_user: boolean;
  is_saved_by_user: boolean;
  engagement_stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

export interface PostInteraction {
  id: string;
  post_id: string;
  user_id: string;
  interaction_type: 'like' | 'save' | 'share' | 'report';
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author: UserProfile;
  content: string;
  parent_comment_id?: string;
  replies?: PostComment[];
  likes_count: number;
  is_liked_by_user: boolean;
  created_at: string;
  updated_at: string;
}

export interface NetworkConnection extends UserConnection {
  requester_profile: UserProfile;
  addressee_profile: UserProfile;
  mutual_connections: number;
  connection_strength: 'strong' | 'medium' | 'weak';
}

// =============================================================================
// DOCUMENT MANAGEMENT TYPES - File handling
// =============================================================================

export interface DocumentDetails {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type: string;
  file_size: number;
  owner: UserProfile;
  access_level: 'private' | 'mentors_only' | 'connections' | 'public';
  collaboration_enabled: boolean;
  version_number: number;
  download_count: number;
  view_count: number;
  tags: string[];
  permissions: DocumentPermission[];
  versions: DocumentVersion[];
  comments: DocumentComment[];
  created_at: string;
  updated_at: string;
}

export interface DocumentPermission {
  id: string;
  document_id: string;
  user: UserProfile;
  permission_type: 'view' | 'comment' | 'edit' | 'admin';
  granted_by: UserProfile;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  changes: string;
  file_path: string;
  editor: UserProfile;
  created_at: string;
}

export interface DocumentComment {
  id: string;
  document_id: string;
  user: UserProfile;
  content: string;
  position?: {
    page?: number;
    line?: number;
    selection?: string;
  };
  resolved: boolean;
  parent_comment_id?: string;
  replies?: DocumentComment[];
  created_at: string;
  updated_at: string;
}

// =============================================================================
// CV ANALYSIS TYPES - Resume processing
// =============================================================================

export interface CVAnalysisResult extends CVAnalysis {
  user_profile: {
    academic_background: string;
    gpa?: number;
    test_scores: {
      gre?: {
        verbal?: number;
        quantitative?: number;
        analytical?: number;
      };
      toefl?: number;
      ielts?: number;
      gmat?: number;
    };
    research_experience: string[];
    work_experience: string[];
    skills: string[];
    research_interests: string[];
    languages: string[];
  };
  analysis_details: {
    strengths: string[];
    areas_for_improvement: string[];
    profile_tier: 'top-tier' | 'mid-tier' | 'entry-level';
    recommended_university_range: string;
    confidence_score: number;
  };
  recommendations: {
    immediate_actions: string[];
    long_term_goals: string[];
    skill_development: string[];
    research_opportunities: string[];
  };
}

// =============================================================================
// EVENT MANAGEMENT TYPES - Networking events
// =============================================================================

export interface NetworkingEvent {
  id: string;
  title: string;
  description: string;
  organizer: UserProfile;
  event_date: string;
  event_time: string;
  timezone: string;
  duration_minutes: number;
  meeting_link?: string;
  max_attendees?: number;
  current_attendees: number;
  event_type: 'workshop' | 'networking' | 'webinar' | 'social' | 'training';
  is_public: boolean;
  registration_required: boolean;
  tags: string[];
  attendees: EventAttendee[];
  registration_status?: 'not_registered' | 'registered' | 'attended' | 'no_show';
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user: UserProfile;
  registration_date: string;
  attendance_status: 'registered' | 'attended' | 'no_show';
}

// =============================================================================
// NOTIFICATION TYPES - Real-time alerts
// =============================================================================

export interface NotificationDetails {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 
    | 'message' 
    | 'connection_request' 
    | 'connection_accepted' 
    | 'session_scheduled' 
    | 'session_reminder' 
    | 'post_like' 
    | 'post_comment' 
    | 'deadline_reminder' 
    | 'application_update'
    | 'mentor_verification'
    | 'document_shared'
    | 'event_invitation';
  related_id?: string;
  related_data?: Record<string, unknown>;
  read: boolean;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
  created_at: string;
}

// =============================================================================
// ANALYTICS TYPES - Performance metrics
// =============================================================================

export interface UserAnalytics {
  user_id: string;
  profile_completion: number;
  application_progress: {
    total_applications: number;
    completed_applications: number;
    average_progress: number;
    success_rate: number;
  };
  social_engagement: {
    connections: number;
    posts_created: number;
    post_likes_received: number;
    comments_made: number;
    events_attended: number;
  };
  mentorship_activity: {
    sessions_completed: number;
    hours_mentored: number;
    average_rating: number;
    active_mentorships: number;
  };
  platform_usage: {
    last_login: string;
    total_logins: number;
    average_session_duration: number;
    most_used_features: string[];
  };
}

export interface PlatformMetrics {
  total_users: number;
  active_users_30d: number;
  total_applications: number;
  successful_applications: number;
  mentor_sessions_completed: number;
  platform_satisfaction_score: number;
  feature_usage: Record<string, number>;
  growth_metrics: {
    user_growth_rate: number;
    engagement_growth_rate: number;
    retention_rate: number;
  };
}

// =============================================================================
// FORM & VALIDATION TYPES - Input handling
// =============================================================================

export interface FormField<T = unknown> {
  value: T;
  error?: string;
  touched: boolean;
  required: boolean;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  helpText?: string;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean;
}

export interface FormState<T extends Record<string, unknown> = Record<string, unknown>> {
  fields: {
    [K in keyof T]: FormField<T[K]>;
  };
  isValid: boolean;
  isSubmitting: boolean;
  errors: string[];
  touched: boolean;
}

// =============================================================================
// SEARCH & FILTER TYPES - Discovery functionality
// =============================================================================

export interface SearchFilters {
  query?: string;
  categories?: string[];
  location?: string[];
  price_range?: {
    min?: number;
    max?: number;
  };
  rating_min?: number;
  date_range?: {
    start?: string;
    end?: string;
  };
  tags?: string[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SearchResult<T = unknown> {
  items: T[];
  total_count: number;
  filters_applied: SearchFilters;
  suggestions?: string[];
  facets?: Record<string, { value: string; count: number }[]>;
  search_time_ms: number;
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export type {
  Database,
  Tables,
  Enums,
} from '@/integrations/supabase/types';

// Re-export commonly used types for convenience
export type Json = Database['public']['Tables']['posts']['Row']['attachments'];