// =====================================================================
// MENTOR PLATFORM TYPE DEFINITIONS
// =====================================================================

export type MentorVerificationTier = 'university_verified' | 'industry_verified' | 'community' | 'pending';

export type MentorshipStatus = 'pending' | 'active' | 'paused' | 'completed' | 'terminated';

export type MentorshipType = 'application_review' | 'career_guidance' | 'research_mentorship' | 'general_support';

export type ReviewStatus = 'pending' | 'in_review' | 'reviewed' | 'revision_requested' | 'approved';

export type ReviewPriority = 'low' | 'medium' | 'high' | 'urgent';

export type DocumentType = 'cv' | 'sop' | 'personal_statement' | 'research_proposal' | 'cover_letter' | 'other';

export type ResourceType = 'guide' | 'template' | 'video' | 'article' | 'webinar' | 'tool';

export type ResourceVisibility = 'public' | 'mentees_only' | 'connections' | 'private';

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

// =====================================================================
// CORE INTERFACES
// =====================================================================

export interface MentorInstitution {
  id: string;
  name: string;
  domain: string;
  logo_url?: string;
  sso_provider?: string;
  sso_config: Record<string, any>;
  sso_domain_whitelist: string[];
  verification_required: boolean;
  auto_approve_domains: string[];
  requires_background_check: boolean;
  institution_type?: string;
  country?: string;
  region?: string;
  website_url?: string;
  description?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface MentorProfile {
  id: string;
  user_id: string;
  
  // Institution & Verification
  institution_id?: string;
  verification_tier: MentorVerificationTier;
  verification_date?: string;
  verification_notes?: string;
  sso_provider?: string;
  sso_identifier?: string;
  
  // Professional Information
  current_position?: string;
  department?: string;
  years_of_experience?: number;
  industry_experience: Record<string, any>;
  
  // Academic Background
  highest_degree?: string;
  academic_achievements: Record<string, any>;
  publications_count: number;
  h_index?: number;
  research_areas: string[];
  
  // Mentorship Configuration
  mentoring_capacity: number;
  current_mentees: number;
  mentoring_areas: string[];
  expertise_keywords: string[];
  preferred_mentee_levels: string[];
  
  // Availability & Preferences
  availability_status: string;
  response_time_hours: number;
  communication_preferences: Record<string, any>;
  timezone: string;
  languages_spoken: string[];
  
  // Profile Enhancement
  bio?: string;
  mentoring_philosophy?: string;
  success_stories: Record<string, any>[];
  
  // Metrics & Recognition
  total_mentees_helped: number;
  total_sessions_conducted: number;
  average_rating: number;
  badges: Record<string, any>[];
  
  // Security & Compliance
  background_check_date?: string;
  background_check_status?: string;
  training_completed: Record<string, any>;
  agreed_to_terms: boolean;
  data_retention_consent: boolean;
  
  // Profile Status
  is_active: boolean;
  is_public: boolean;
  profile_completion_percentage: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Related data
  institution?: MentorInstitution;
}

export interface MentorshipRelationship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  
  // Relationship Details
  status: MentorshipStatus;
  relationship_type: MentorshipType;
  
  // Goals & Progress Tracking
  goals: Record<string, any>[];
  milestones: Record<string, any>[];
  progress_percentage: number;
  
  // Communication & Interaction
  last_interaction?: string;
  total_sessions: number;
  total_messages: number;
  
  // Scheduling
  meeting_frequency?: string;
  next_scheduled_session?: string;
  preferred_meeting_times: Record<string, any>;
  
  // Outcomes & Feedback
  mentee_outcomes: Record<string, any>;
  mentor_notes?: string;
  mentee_feedback?: string;
  mentor_rating?: number;
  mentee_rating?: number;
  
  // Duration Tracking
  expected_duration_weeks?: number;
  actual_duration_weeks?: number;
  
  // Timestamps
  started_at?: string;
  paused_at?: string;
  resumed_at?: string;
  completed_at?: string;
  terminated_at?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  mentor_profile?: MentorProfile;
  mentee_profile?: any; // User profile from existing system
}

export interface DocumentReview {
  id: string;
  mentorship_id: string;
  
  // Document Information
  document_id?: string;
  document_url?: string;
  document_type: DocumentType;
  document_title?: string;
  original_filename?: string;
  file_size?: number;
  
  // Review Process
  status: ReviewStatus;
  priority: ReviewPriority;
  deadline?: string;
  assigned_at: string;
  
  // Feedback & Collaboration
  feedback: Record<string, any>;
  suggestions?: string;
  tracked_changes: Record<string, any>[];
  version: number;
  previous_version_id?: string;
  
  // Review Metrics
  review_started_at?: string;
  review_completed_at?: string;
  time_spent_minutes: number;
  
  // Quality Metrics
  thoroughness_score?: number;
  helpfulness_rating?: number;
  mentee_satisfaction?: number;
  
  // AI Integration
  ai_suggestions: Record<string, any>;
  ai_confidence_score?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Related data
  mentorship?: MentorshipRelationship;
}

export interface MentorAvailability {
  id: string;
  mentor_id: string;
  
  // Availability Schedule
  day_of_week: number; // 0 = Sunday
  start_time: string;
  end_time: string;
  
  // Recurrence
  is_recurring: boolean;
  effective_from: string;
  effective_until?: string;
  
  // Exceptions and Overrides
  exceptions: Record<string, any>[];
  timezone: string;
  
  // Booking Rules
  min_booking_notice_hours: number;
  max_booking_advance_days: number;
  session_duration_minutes: number;
  buffer_minutes: number;
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface MentorResource {
  id: string;
  mentor_id: string;
  
  // Resource Details
  title: string;
  description?: string;
  content?: string;
  resource_type: ResourceType;
  
  // File Handling
  file_url?: string;
  file_type?: string;
  file_size?: number;
  thumbnail_url?: string;
  
  // Categorization
  tags: string[];
  category?: string;
  target_audience: string[];
  
  // Visibility & Access
  visibility: ResourceVisibility;
  password_protected: boolean;
  access_password?: string;
  
  // Engagement Metrics
  views_count: number;
  likes_count: number;
  downloads_count: number;
  shares_count: number;
  
  // Quality & Moderation
  is_featured: boolean;
  is_approved: boolean;
  moderation_notes?: string;
  
  // SEO & Discovery
  slug?: string;
  search_keywords: string[];
  
  // Timestamps
  published_at?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  mentor_profile?: MentorProfile;
}

export interface MentorSession {
  id: string;
  mentorship_id: string;
  
  // Session Details
  title?: string;
  description?: string;
  session_type: string;
  
  // Scheduling
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  timezone: string;
  
  // Meeting Platform
  meeting_platform?: string;
  meeting_url?: string;
  meeting_id?: string;
  meeting_password?: string;
  
  // Session Status
  status: SessionStatus;
  cancellation_reason?: string;
  
  // Session Content
  agenda: Record<string, any>[];
  notes?: string;
  action_items: Record<string, any>[];
  resources_shared: Record<string, any>[];
  
  // Feedback & Rating
  mentor_feedback?: string;
  mentee_feedback?: string;
  session_rating?: number;
  
  // Follow-up
  follow_up_required: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Related data
  mentorship?: MentorshipRelationship;
}

// =====================================================================
// DASHBOARD AND UI TYPES
// =====================================================================

export interface MentorDashboardStats {
  user_id: string;
  current_mentees: number;
  total_mentees_helped: number;
  average_rating: number;
  total_relationships: number;
  active_relationships: number;
  total_reviews: number;
  pending_reviews: number;
  avg_review_quality: number;
}

export interface MentorDashboardSummary {
  user_id: string;
  current_mentees: number;
  mentoring_capacity: number;
  total_mentees_helped: number;
  average_rating: number;
  active_mentorships: number;
  pending_reviews: number;
  upcoming_sessions: number;
  last_mentee_interaction?: string;
}

export interface PublicMentorProfile {
  user_id: string;
  verification_tier: MentorVerificationTier;
  current_position?: string;
  department?: string;
  years_of_experience?: number;
  mentoring_areas: string[];
  expertise_keywords: string[];
  preferred_mentee_levels: string[];
  availability_status: string;
  response_time_hours: number;
  languages_spoken: string[];
  bio?: string;
  mentoring_philosophy?: string;
  total_mentees_helped: number;
  average_rating: number;
  institution_name?: string;
  institution_logo?: string;
  booking_status: 'available' | 'limited' | 'full';
}

// =====================================================================
// ONBOARDING AND FORMS
// =====================================================================

export interface MentorOnboardingData {
  // Step 1: Institution
  institution_id?: string;
  sso_provider?: string;
  custom_institution?: string;
  
  // Step 2: Professional Info
  current_position?: string;
  department?: string;
  years_of_experience?: number;
  industry_experience?: Record<string, any>;
  
  // Step 3: Academic Background
  highest_degree?: string;
  academic_achievements?: Record<string, any>;
  research_areas?: string[];
  publications_count?: number;
  
  // Step 4: Expertise & Mentoring
  mentoring_areas?: string[];
  expertise_keywords?: string[];
  preferred_mentee_levels?: string[];
  mentoring_capacity?: number;
  mentoring_philosophy?: string;
  
  // Step 5: Availability
  availability_schedule?: MentorAvailability[];
  timezone?: string;
  response_time_hours?: number;
  
  // Step 6: Profile
  bio?: string;
  languages_spoken?: string[];
  communication_preferences?: Record<string, any>;
}


// =====================================================================
// API AND SERVICE TYPES
// =====================================================================

export interface MentorServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface MentorSearchFilters {
  expertise_areas?: string[];
  verification_tier?: MentorVerificationTier[];
  availability_status?: string[];
  institution_types?: string[];
  languages?: string[];
  rating_min?: number;
  response_time_max?: number;
}

export interface MentorSearchResult {
  mentors: PublicMentorProfile[];
  total_count: number;
  page: number;
  per_page: number;
}

// =====================================================================
// SECURITY AND COMPLIANCE
// =====================================================================

export interface SecurityAuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata: Record<string, any>;
  sensitive_data_accessed: boolean;
  compliance_relevant: boolean;
  created_at: string;
}

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: string;
  granted: boolean;
  legal_basis?: string;
  purpose?: string;
  consent_version: string;
  withdrawal_date?: string;
  granted_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================================
// NOTIFICATION AND MESSAGING
// =====================================================================

export interface MentorNotification {
  id: string;
  user_id: string;
  type: 'mentorship_request' | 'document_review' | 'session_reminder' | 'feedback_received' | 'system_update';
  title: string;
  message: string;
  metadata: Record<string, any>;
  read: boolean;
  action_url?: string;
  created_at: string;
}

// =====================================================================
// UTILITY TYPES
// =====================================================================

export type MentorRole = 'mentor' | 'mentee' | 'admin';

export interface MentorFormError {
  field: string;
  message: string;
}

export interface MentorValidationResult {
  isValid: boolean;
  errors: MentorFormError[];
  warnings: string[];
}

export interface MentorPaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface MentorAnalytics {
  period: string;
  mentorships_created: number;
  sessions_conducted: number;
  documents_reviewed: number;
  average_response_time: number;
  satisfaction_rating: number;
  goals_achieved: number;
}

// =====================================================================
// THEME AND UI CONFIGURATION
// =====================================================================

export interface MentorThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    hero: string;
  };
  animations: {
    duration: string;
    easing: string;
  };
}

export type MentorComponentVariant = 'default' | 'mentor' | 'gradient' | 'elevated' | 'glass';

export type MentorComponentSize = 'sm' | 'md' | 'lg' | 'xl';

export type MentorComponentColor = 'blue' | 'purple' | 'green' | 'pink' | 'mentor' | 'gradient';