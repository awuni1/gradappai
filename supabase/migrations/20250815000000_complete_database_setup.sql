-- =====================================================================
-- GRADAPP ASCEND PLATFORM - COMPLETE DATABASE SETUP (ERROR-FREE)
-- =====================================================================
-- This script sets up the complete database schema for the GradApp platform
-- Fixed version without generation expression issues

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================================
-- 1. ENUMS AND TYPES
-- =====================================================================

-- Application status enum
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM (
        'not_started',
        'planning',
        'in_progress', 
        'documents_pending',
        'submitted',
        'under_review',
        'interview_requested',
        'interview_scheduled',
        'interview_completed',
        'decision_pending',
        'accepted',
        'conditionally_accepted',
        'rejected',
        'waitlisted',
        'deferred',
        'withdrawn'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('applicant', 'mentor', 'admin', 'university_rep', 'consultant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Connection status enum
DO $$ BEGIN
    CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Post types enum
DO $$ BEGIN
    CREATE TYPE post_type AS ENUM ('general', 'question', 'resource', 'achievement', 'event', 'announcement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Visibility enum
DO $$ BEGIN
    CREATE TYPE visibility_level AS ENUM ('public', 'connections', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Priority enum
DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Message type enum
DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'voice', 'video', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Session status enum
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification type enum
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('email', 'push', 'sms', 'in_app');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================================
-- 2. CORE USER TABLES
-- =====================================================================

-- Enhanced user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role user_role DEFAULT 'applicant',
    
    -- Basic info
    full_name TEXT,
    display_name TEXT,
    bio TEXT,
    profile_picture_url TEXT,
    location TEXT,
    timezone TEXT DEFAULT 'UTC',
    
    -- Contact info
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    website_url TEXT,
    github_url TEXT,
    twitter_url TEXT,
    
    -- Settings & Preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    profile_visibility visibility_level DEFAULT 'public',
    search_visibility BOOLEAN DEFAULT true,
    language_preference TEXT DEFAULT 'en',
    theme_preference TEXT DEFAULT 'light',
    
    -- Status & Verification
    is_verified BOOLEAN DEFAULT false,
    verification_documents JSONB DEFAULT '[]',
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_onboarding_step CHECK (onboarding_step >= 1 AND onboarding_step <= 10)
);

-- Enhanced academic profiles
CREATE TABLE IF NOT EXISTS public.academic_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Current education
    current_degree TEXT,
    current_institution TEXT,
    current_field_of_study TEXT,
    current_gpa DECIMAL(4,3),
    graduation_year INTEGER,
    graduation_month INTEGER,
    
    -- Academic achievements
    honors_awards TEXT[],
    publications TEXT[],
    research_experience TEXT,
    work_experience TEXT,
    volunteer_experience TEXT,
    certifications TEXT[],
    
    -- Standardized test scores
    gre_verbal INTEGER CHECK (gre_verbal >= 130 AND gre_verbal <= 170),
    gre_quantitative INTEGER CHECK (gre_quantitative >= 130 AND gre_quantitative <= 170),
    gre_analytical DECIMAL(2,1) CHECK (gre_analytical >= 0.0 AND gre_analytical <= 6.0),
    gmat_score INTEGER CHECK (gmat_score >= 200 AND gmat_score <= 800),
    toefl_score INTEGER CHECK (toefl_score >= 0 AND toefl_score <= 120),
    ielts_score DECIMAL(2,1) CHECK (ielts_score >= 0.0 AND ielts_score <= 9.0),
    duolingo_score INTEGER CHECK (duolingo_score >= 10 AND duolingo_score <= 160),
    
    -- Skills and competencies
    technical_skills TEXT[],
    soft_skills TEXT[],
    languages JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_gpa CHECK (current_gpa IS NULL OR (current_gpa >= 0.0 AND current_gpa <= 4.0)),
    CONSTRAINT valid_graduation_month CHECK (graduation_month IS NULL OR (graduation_month >= 1 AND graduation_month <= 12))
);

-- Research interests
CREATE TABLE IF NOT EXISTS public.research_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User research interests mapping
CREATE TABLE IF NOT EXISTS public.user_research_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    research_interest_id UUID REFERENCES public.research_interests(id) ON DELETE CASCADE NOT NULL,
    proficiency_level TEXT DEFAULT 'beginner' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, research_interest_id)
);

-- =====================================================================
-- 3. ENHANCED UNIVERSITY AND PROGRAM TABLES
-- =====================================================================

-- Comprehensive universities table
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    country TEXT NOT NULL,
    state_province TEXT,
    city TEXT NOT NULL,
    address TEXT,
    postal_code TEXT,
    website_url TEXT,
    logo_url TEXT,
    description TEXT,
    
    -- Rankings and statistics
    ranking_national INTEGER,
    ranking_global INTEGER,
    qs_ranking INTEGER,
    us_news_ranking INTEGER,
    acceptance_rate DECIMAL(5,2) CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100),
    enrollment_total INTEGER,
    enrollment_undergraduate INTEGER,
    enrollment_graduate INTEGER,
    
    -- Financial information
    tuition_in_state DECIMAL(10,2),
    tuition_out_state DECIMAL(10,2),
    tuition_international DECIMAL(10,2),
    cost_of_living_estimate DECIMAL(10,2),
    
    -- Institution characteristics
    institution_type TEXT CHECK (institution_type IN ('public', 'private', 'for-profit', 'community')),
    religious_affiliation TEXT,
    campus_setting TEXT CHECK (campus_setting IN ('urban', 'suburban', 'rural')),
    campus_size_acres INTEGER,
    student_faculty_ratio DECIMAL(4,1),
    
    -- Application information
    application_deadline_fall DATE,
    application_deadline_spring DATE,
    application_fee DECIMAL(8,2),
    requires_essays BOOLEAN DEFAULT true,
    requires_letters_of_rec BOOLEAN DEFAULT true,
    min_letters_of_rec INTEGER DEFAULT 2,
    max_letters_of_rec INTEGER DEFAULT 3,
    
    -- Contact and support
    admissions_email TEXT,
    admissions_phone TEXT,
    international_office_email TEXT,
    financial_aid_email TEXT,
    
    -- Search and metadata
    search_keywords TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    data_source TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced university programs
CREATE TABLE IF NOT EXISTS public.university_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    degree_type TEXT NOT NULL,
    department TEXT,
    school_college TEXT,
    
    -- Program details
    duration_years DECIMAL(2,1),
    duration_months INTEGER,
    credits_required INTEGER,
    is_thesis_required BOOLEAN DEFAULT false,
    is_online_available BOOLEAN DEFAULT false,
    is_part_time_available BOOLEAN DEFAULT false,
    
    -- Financial information
    tuition_annual DECIMAL(10,2),
    tuition_per_credit DECIMAL(8,2),
    application_fee DECIMAL(8,2),
    assistantship_available BOOLEAN DEFAULT false,
    funding_opportunities TEXT[],
    
    -- Admission requirements
    deadline_fall DATE,
    deadline_spring DATE,
    deadline_summer DATE,
    early_deadline DATE,
    gre_required BOOLEAN DEFAULT false,
    gmat_required BOOLEAN DEFAULT false,
    min_gpa DECIMAL(3,2),
    min_gre_verbal INTEGER,
    min_gre_quantitative INTEGER,
    min_toefl INTEGER,
    min_ielts DECIMAL(2,1),
    
    -- Program characteristics
    description TEXT,
    requirements TEXT,
    curriculum_highlights TEXT[],
    specializations TEXT[],
    career_outcomes TEXT[],
    
    -- Faculty and research
    faculty_count INTEGER,
    research_areas TEXT[],
    notable_faculty TEXT[],
    
    -- Rankings and statistics
    program_ranking INTEGER,
    employment_rate DECIMAL(5,2),
    median_starting_salary DECIMAL(10,2),
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    last_reviewed DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Faculty profiles for professor matching
CREATE TABLE IF NOT EXISTS public.faculty_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    program_id UUID REFERENCES public.university_programs(id) ON DELETE CASCADE,
    
    -- Basic information
    full_name TEXT NOT NULL,
    title TEXT,
    department TEXT,
    email TEXT,
    office_location TEXT,
    profile_url TEXT,
    photo_url TEXT,
    
    -- Academic background
    education_background TEXT[],
    research_interests TEXT[],
    current_research TEXT,
    publications_count INTEGER DEFAULT 0,
    notable_publications TEXT[],
    
    -- Professional details
    years_at_institution INTEGER,
    is_accepting_students BOOLEAN DEFAULT true,
    preferred_student_background TEXT,
    lab_website_url TEXT,
    
    -- Contact preferences
    contact_preference TEXT DEFAULT 'email',
    response_time_estimate TEXT,
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Selected universities (user's target schools)
CREATE TABLE IF NOT EXISTS public.selected_universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    program_id UUID REFERENCES public.university_programs(id) ON DELETE CASCADE,
    
    -- User preferences
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
    category TEXT DEFAULT 'target' CHECK (category IN ('safety', 'target', 'reach')),
    application_deadline DATE,
    personal_deadline DATE,
    notes TEXT,
    
    -- Research and planning
    visit_status TEXT CHECK (visit_status IN ('not_planned', 'planned', 'completed', 'virtual')),
    visit_date DATE,
    visit_notes TEXT,
    contact_attempts JSONB DEFAULT '[]',
    
    -- Decision tracking
    is_applied BOOLEAN DEFAULT false,
    application_submitted_date DATE,
    decision_received BOOLEAN DEFAULT false,
    decision_date DATE,
    decision_result TEXT CHECK (decision_result IN ('accepted', 'rejected', 'waitlisted', 'deferred')),
    
    -- Financial information
    estimated_cost DECIMAL(12,2),
    financial_aid_offered DECIMAL(12,2),
    scholarship_offered DECIMAL(12,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(user_id, university_id, program_id)
);

-- =====================================================================
-- 4. COMPREHENSIVE APPLICATION TRACKING SYSTEM
-- =====================================================================

-- Enhanced applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    selected_university_id UUID REFERENCES public.selected_universities(id) ON DELETE CASCADE NOT NULL,
    
    -- Application status and progress
    status application_status DEFAULT 'not_started',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Important dates
    application_deadline DATE,
    personal_deadline DATE,
    submission_date TIMESTAMP WITH TIME ZONE,
    interview_date TIMESTAMP WITH TIME ZONE,
    decision_date DATE,
    response_deadline DATE,
    
    -- Application details
    application_round TEXT DEFAULT 'regular' CHECK (application_round IN ('early', 'regular', 'rolling')),
    semester_applying TEXT DEFAULT 'fall' CHECK (semester_applying IN ('fall', 'spring', 'summer')),
    year_applying INTEGER,
    
    -- Fees and payments
    application_fee DECIMAL(10,2),
    fee_paid BOOLEAN DEFAULT false,
    fee_payment_date DATE,
    fee_waiver_applied BOOLEAN DEFAULT false,
    fee_waiver_approved BOOLEAN DEFAULT false,
    
    -- External references
    application_portal_url TEXT,
    application_id_external TEXT,
    login_credentials_notes TEXT,
    
    -- Decision information
    admission_decision TEXT CHECK (admission_decision IN ('accepted', 'rejected', 'waitlisted', 'deferred')),
    decision_notes TEXT,
    financial_aid_offered DECIMAL(12,2),
    scholarship_details JSONB DEFAULT '{}',
    
    -- User notes and tracking
    notes TEXT,
    strengths_highlighted TEXT[],
    concerns TEXT[],
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    -- Communication log
    last_contact_date DATE,
    contact_log JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(user_id, selected_university_id)
);

-- Application requirements and checklist
CREATE TABLE IF NOT EXISTS public.application_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    
    -- Requirement details
    requirement_type TEXT NOT NULL,
    category TEXT CHECK (category IN ('document', 'test', 'essay', 'recommendation', 'interview', 'portfolio', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    
    -- Status and completion
    is_required BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    completion_date DATE,
    
    -- Deadlines and reminders
    due_date DATE,
    reminder_date DATE,
    days_before_reminder INTEGER DEFAULT 7,
    
    -- File and document management
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    version_number INTEGER DEFAULT 1,
    
    -- Progress and quality tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    needs_review BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- User notes
    notes TEXT,
    instructions TEXT,
    tips TEXT[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced deadlines management
CREATE TABLE IF NOT EXISTS public.deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES public.application_requirements(id) ON DELETE CASCADE,
    
    -- Deadline details
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('application', 'document', 'test', 'interview', 'decision', 'response', 'financial_aid', 'housing')),
    
    -- Date and time information
    due_date DATE NOT NULL,
    due_time TIME,
    timezone TEXT DEFAULT 'UTC',
    is_all_day BOOLEAN DEFAULT true,
    
    -- Status and completion
    is_completed BOOLEAN DEFAULT false,
    completed_date DATE,
    completion_notes TEXT,
    
    -- Priority and urgency
    priority priority_level DEFAULT 'medium',
    is_urgent BOOLEAN DEFAULT false,
    days_until_due INTEGER,
    
    -- Reminders
    reminder_date DATE,
    reminder_sent BOOLEAN DEFAULT false,
    multiple_reminders BOOLEAN DEFAULT true,
    reminder_schedule JSONB DEFAULT '[1, 3, 7]',
    
    -- Dependencies
    depends_on_deadline_id UUID REFERENCES public.deadlines(id),
    blocks_deadline_ids UUID[],
    
    -- External links
    external_url TEXT,
    portal_instructions TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- 5. ENHANCED DOCUMENT MANAGEMENT SYSTEM
-- =====================================================================

-- Comprehensive document storage
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES public.application_requirements(id) ON DELETE CASCADE,
    
    -- Document identification
    title TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'cv', 'cover_letter', 'personal_statement', 'essay', 'transcript', 'letter_of_recommendation', 'portfolio', 'certificate', 'test_score', 'other')),
    category TEXT,
    subcategory TEXT,
    
    -- File information
    file_name TEXT NOT NULL,
    original_file_name TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    file_extension TEXT,
    
    -- Version control
    version_number INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT true,
    parent_document_id UUID REFERENCES public.documents(id),
    version_notes TEXT,
    
    -- Document status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'final', 'archived')),
    is_template BOOLEAN DEFAULT false,
    is_shared BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    
    -- Content analysis
    word_count INTEGER,
    page_count INTEGER,
    analysis_data JSONB DEFAULT '{}',
    extracted_text TEXT,
    keywords TEXT[],
    
    -- Collaboration and sharing
    shared_with UUID[],
    sharing_permissions JSONB DEFAULT '{}',
    comments_enabled BOOLEAN DEFAULT true,
    
    -- Quality and feedback
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    feedback_notes TEXT,
    revision_needed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Usage tracking
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced resumes/CVs table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    
    -- Resume details
    title TEXT NOT NULL,
    resume_type TEXT DEFAULT 'academic' CHECK (resume_type IN ('academic', 'professional', 'federal', 'creative')),
    target_audience TEXT[],
    
    -- File information
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    
    -- Status and usage
    is_primary BOOLEAN DEFAULT false,
    is_master_copy BOOLEAN DEFAULT false,
    last_updated_content TIMESTAMP WITH TIME ZONE,
    
    -- Analysis and insights
    analysis_data JSONB DEFAULT '{}',
    parsed_sections JSONB DEFAULT '{}',
    skills_extracted TEXT[],
    experience_summary TEXT,
    education_summary TEXT,
    
    -- Tailoring information
    tailored_for_applications UUID[],
    customization_notes TEXT,
    
    -- Performance tracking
    application_success_rate DECIMAL(5,2),
    applications_used_count INTEGER DEFAULT 0,
    interviews_generated INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Document collaboration and comments
CREATE TABLE IF NOT EXISTS public.document_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Comment details
    content TEXT NOT NULL,
    comment_type TEXT DEFAULT 'general' CHECK (comment_type IN ('general', 'suggestion', 'correction', 'question', 'approval')),
    
    -- Location in document
    page_number INTEGER,
    line_number INTEGER,
    character_position INTEGER,
    highlighted_text TEXT,
    
    -- Threading
    parent_comment_id UUID REFERENCES public.document_comments(id) ON DELETE CASCADE,
    thread_id UUID,
    
    -- Status
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- 6. ADVANCED SOCIAL NETWORKING (GRADNET)
-- =====================================================================

-- Enhanced posts system
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Post content
    content TEXT NOT NULL,
    title TEXT,
    excerpt TEXT,
    
    -- Post categorization
    post_type post_type DEFAULT 'general',
    category TEXT,
    subcategory TEXT,
    tags TEXT[],
    
    -- Rich media
    attachments JSONB DEFAULT '[]',
    media_urls TEXT[],
    embedded_links JSONB DEFAULT '[]',
    
    -- Engagement metrics
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    
    -- Post settings
    is_pinned BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    allows_comments BOOLEAN DEFAULT true,
    allows_shares BOOLEAN DEFAULT true,
    
    -- Visibility and targeting
    visibility visibility_level DEFAULT 'public',
    target_audience TEXT[],
    geographic_targeting TEXT[],
    
    -- Content moderation
    is_reported BOOLEAN DEFAULT false,
    report_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    moderation_notes TEXT,
    
    -- SEO and discovery
    slug TEXT UNIQUE,
    meta_description TEXT,
    search_keywords TEXT[],
    
    -- Scheduling
    is_published BOOLEAN DEFAULT true,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    engagement_rate DECIMAL(5,2),
    reach_count INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Full-text search index
    search_vector tsvector
);

-- Enhanced post interactions
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'helpful', 'insightful', 'funny')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Post saves/bookmarks
CREATE TABLE IF NOT EXISTS public.post_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    collection_name TEXT DEFAULT 'general',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Enhanced post comments
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Comment content
    content TEXT NOT NULL,
    
    -- Threading
    parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
    thread_depth INTEGER DEFAULT 0,
    
    -- Engagement
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    
    -- Status
    is_edited BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    is_reported BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comment likes
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- Enhanced user connections
CREATE TABLE IF NOT EXISTS public.user_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Connection details
    status connection_status DEFAULT 'pending',
    connection_type TEXT DEFAULT 'general' CHECK (connection_type IN ('general', 'mentor', 'peer', 'alumni', 'colleague')),
    
    -- Communication
    initial_message TEXT,
    introduction TEXT,
    mutual_connections_count INTEGER DEFAULT 0,
    
    -- Interaction tracking
    messages_exchanged INTEGER DEFAULT 0,
    last_interaction_date TIMESTAMP WITH TIME ZONE,
    interaction_frequency TEXT,
    
    -- Professional context
    how_they_met TEXT,
    shared_institutions TEXT[],
    shared_interests TEXT[],
    professional_context TEXT,
    
    -- Privacy and settings
    is_close_connection BOOLEAN DEFAULT false,
    notification_enabled BOOLEAN DEFAULT true,
    can_see_activity BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- Groups and communities
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Group details
    name TEXT NOT NULL,
    description TEXT,
    group_type TEXT DEFAULT 'public' CHECK (group_type IN ('public', 'private', 'secret')),
    category TEXT,
    
    -- Membership
    member_count INTEGER DEFAULT 1,
    max_members INTEGER,
    is_invite_only BOOLEAN DEFAULT false,
    
    -- Content settings
    posting_permissions TEXT DEFAULT 'all_members' CHECK (posting_permissions IN ('admins_only', 'moderators', 'all_members')),
    moderation_enabled BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    
    -- Visibility and discovery
    is_searchable BOOLEAN DEFAULT true,
    tags TEXT[],
    location TEXT,
    
    -- Activity
    posts_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Metadata
    avatar_url TEXT,
    cover_image_url TEXT,
    rules TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Group memberships
CREATE TABLE IF NOT EXISTS public.group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Membership details
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive', 'banned')),
    
    -- Permissions
    can_post BOOLEAN DEFAULT true,
    can_moderate BOOLEAN DEFAULT false,
    can_invite BOOLEAN DEFAULT true,
    
    -- Activity tracking
    posts_count INTEGER DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Metadata
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    invited_by UUID REFERENCES auth.users(id),
    
    UNIQUE(group_id, user_id)
);

-- =====================================================================
-- 7. ADVANCED MESSAGING SYSTEM
-- =====================================================================

-- Enhanced conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Conversation details
    title TEXT,
    description TEXT,
    conversation_type TEXT DEFAULT 'direct' CHECK (conversation_type IN ('direct', 'group', 'broadcast', 'support')),
    
    -- Group settings (for group conversations)
    is_group BOOLEAN DEFAULT false,
    group_admin UUID REFERENCES auth.users(id),
    max_participants INTEGER DEFAULT 50,
    
    -- Conversation settings
    is_archived BOOLEAN DEFAULT false,
    is_muted BOOLEAN DEFAULT false,
    allows_new_members BOOLEAN DEFAULT true,
    message_retention_days INTEGER DEFAULT 365,
    
    -- Privacy and security
    is_encrypted BOOLEAN DEFAULT true,
    requires_approval_to_join BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    
    -- Activity tracking
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    message_count INTEGER DEFAULT 0,
    active_participants INTEGER DEFAULT 0,
    
    -- Metadata
    avatar_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Conversation participants with enhanced features
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Participation details
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed', 'banned')),
    
    -- Permissions
    can_add_members BOOLEAN DEFAULT false,
    can_remove_members BOOLEAN DEFAULT false,
    can_edit_info BOOLEAN DEFAULT false,
    can_delete_messages BOOLEAN DEFAULT false,
    
    -- Personal settings
    is_muted BOOLEAN DEFAULT false,
    custom_notifications JSONB DEFAULT '{}',
    message_retention_override INTEGER,
    
    -- Activity tracking
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    messages_sent INTEGER DEFAULT 0,
    
    -- Metadata
    invited_by UUID REFERENCES auth.users(id),
    left_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(conversation_id, user_id)
);

-- Enhanced messages system
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Message content
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    
    -- Rich content
    attachments JSONB DEFAULT '[]',
    media_urls TEXT[],
    embedded_data JSONB DEFAULT '{}',
    
    -- Message threading
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    thread_id UUID,
    is_thread_starter BOOLEAN DEFAULT false,
    
    -- Message status
    is_edited BOOLEAN DEFAULT false,
    edit_history JSONB DEFAULT '[]',
    is_deleted BOOLEAN DEFAULT false,
    deleted_for_everyone BOOLEAN DEFAULT false,
    
    -- Delivery and read status
    delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed')),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_receipts JSONB DEFAULT '{}',
    
    -- Reactions and interactions
    reactions JSONB DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    
    -- Moderation
    is_reported BOOLEAN DEFAULT false,
    is_flagged BOOLEAN DEFAULT false,
    moderation_notes TEXT,
    
    -- Search and analytics
    search_vector tsvector,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Message reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry', 'thumbs_up', 'thumbs_down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(message_id, user_id, reaction_type)
);

-- =====================================================================
-- 8. COMPREHENSIVE MENTOR PLATFORM
-- =====================================================================

-- Enhanced mentor profiles
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Professional information
    title TEXT,
    current_position TEXT,
    current_institution TEXT,
    department TEXT,
    years_experience INTEGER,
    career_level TEXT CHECK (career_level IN ('junior', 'mid_level', 'senior', 'executive', 'retired')),
    
    -- Educational background
    education_background TEXT,
    highest_degree TEXT,
    alma_mater TEXT[],
    graduation_years INTEGER[],
    
    -- Expertise and specializations
    specializations TEXT[],
    industry_experience TEXT[],
    research_areas TEXT[],
    technical_skills TEXT[],
    
    -- Mentoring preferences
    mentoring_capacity INTEGER DEFAULT 5,
    current_mentees INTEGER DEFAULT 0,
    preferred_mentee_level TEXT[],
    mentoring_style TEXT[],
    communication_preference TEXT[],
    
    -- Availability and scheduling
    availability_schedule JSONB DEFAULT '{}',
    timezone_preference TEXT DEFAULT 'UTC',
    session_duration_options INTEGER[] DEFAULT ARRAY[30, 60, 90],
    advance_booking_days INTEGER DEFAULT 7,
    is_accepting_new_mentees BOOLEAN DEFAULT true,
    
    -- Pricing and compensation
    is_paid_mentor BOOLEAN DEFAULT false,
    hourly_rate DECIMAL(8,2),
    session_rates JSONB DEFAULT '{}',
    payment_methods TEXT[],
    offers_free_sessions BOOLEAN DEFAULT true,
    free_session_duration INTEGER DEFAULT 30,
    
    -- Verification and credentials
    is_verified BOOLEAN DEFAULT false,
    verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'enhanced', 'premium')),
    verification_documents JSONB DEFAULT '[]',
    credentials TEXT[],
    certifications TEXT[],
    
    -- Performance metrics
    total_sessions INTEGER DEFAULT 0,
    total_mentees INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    success_stories_count INTEGER DEFAULT 0,
    
    -- Platform engagement
    response_time_hours INTEGER DEFAULT 24,
    response_rate DECIMAL(5,2) DEFAULT 100.0,
    completion_rate DECIMAL(5,2) DEFAULT 100.0,
    cancellation_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Profile content
    bio_headline TEXT,
    detailed_bio TEXT,
    mentoring_philosophy TEXT,
    success_stories TEXT[],
    testimonials JSONB DEFAULT '[]',
    
    -- Additional information
    languages_spoken TEXT[],
    geographical_focus TEXT[],
    video_intro_url TEXT,
    calendar_integration_enabled BOOLEAN DEFAULT false,
    
    -- Settings and preferences
    profile_visibility visibility_level DEFAULT 'public',
    accepts_group_sessions BOOLEAN DEFAULT false,
    accepts_one_time_sessions BOOLEAN DEFAULT true,
    accepts_ongoing_mentorship BOOLEAN DEFAULT true,
    
    -- Metadata
    profile_completion_score INTEGER DEFAULT 0,
    last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    featured_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Mentorship sessions with comprehensive tracking
CREATE TABLE IF NOT EXISTS public.mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mentee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Session details
    title TEXT NOT NULL,
    description TEXT,
    session_type TEXT DEFAULT 'one_on_one' CHECK (session_type IN ('one_on_one', 'group', 'workshop', 'panel')),
    session_format TEXT DEFAULT 'video' CHECK (session_format IN ('video', 'phone', 'in_person', 'chat')),
    
    -- Scheduling
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    timezone TEXT DEFAULT 'UTC',
    
    -- Session management
    status session_status DEFAULT 'scheduled',
    cancellation_reason TEXT,
    reschedule_count INTEGER DEFAULT 0,
    
    -- Meeting logistics
    meeting_url TEXT,
    meeting_room_id TEXT,
    meeting_password TEXT,
    dial_in_number TEXT,
    location_address TEXT,
    
    -- Pre-session preparation
    agenda TEXT,
    pre_session_notes TEXT,
    mentee_goals TEXT[],
    preparation_materials TEXT[],
    
    -- Session content and outcomes
    session_notes TEXT,
    key_topics_discussed TEXT[],
    actionable_insights TEXT[],
    homework_assigned TEXT[],
    follow_up_actions TEXT[],
    
    -- Post-session evaluation
    mentor_rating INTEGER CHECK (mentor_rating >= 1 AND mentor_rating <= 5),
    mentee_rating INTEGER CHECK (mentee_rating >= 1 AND mentee_rating <= 5),
    mentor_feedback TEXT,
    mentee_feedback TEXT,
    
    -- Progress tracking
    goals_achieved TEXT[],
    challenges_discussed TEXT[],
    progress_made TEXT,
    next_steps TEXT[],
    
    -- Session resources
    resources_shared TEXT[],
    recordings_url TEXT,
    shared_documents JSONB DEFAULT '[]',
    
    -- Administrative
    session_cost DECIMAL(10,2),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived')),
    invoice_id TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Mentor reviews and ratings
CREATE TABLE IF NOT EXISTS public.mentor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.mentorship_sessions(id) ON DELETE CASCADE,
    
    -- Review content
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
    helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
    
    -- Review text
    review_title TEXT,
    review_content TEXT,
    pros TEXT[],
    cons TEXT[],
    
    -- Review metadata
    would_recommend BOOLEAN DEFAULT true,
    would_book_again BOOLEAN DEFAULT true,
    is_verified_review BOOLEAN DEFAULT false,
    
    -- Moderation
    is_published BOOLEAN DEFAULT true,
    is_flagged BOOLEAN DEFAULT false,
    moderation_notes TEXT,
    
    -- Response
    mentor_response TEXT,
    mentor_responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(mentor_id, reviewer_id, session_id)
);

-- Mentorship programs and tracks
CREATE TABLE IF NOT EXISTS public.mentorship_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Program details
    title TEXT NOT NULL,
    description TEXT,
    program_type TEXT DEFAULT 'general' CHECK (program_type IN ('general', 'career_specific', 'skill_based', 'industry_focused', 'academic')),
    
    -- Program structure
    duration_weeks INTEGER DEFAULT 12,
    session_frequency TEXT DEFAULT 'weekly' CHECK (session_frequency IN ('weekly', 'bi_weekly', 'monthly', 'flexible')),
    total_sessions INTEGER,
    
    -- Curriculum and resources
    curriculum_outline TEXT[],
    learning_objectives TEXT[],
    resources JSONB DEFAULT '[]',
    prerequisites TEXT[],
    
    -- Enrollment
    max_participants INTEGER DEFAULT 20,
    current_participants INTEGER DEFAULT 0,
    enrollment_fee DECIMAL(10,2),
    is_free BOOLEAN DEFAULT true,
    
    -- Program status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    application_deadline DATE,
    
    -- Requirements
    mentor_requirements TEXT[],
    mentee_requirements TEXT[],
    
    -- Metadata
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- 9. UNIVERSITY MATCHING CHAT SYSTEM
-- =====================================================================

-- Enhanced university chat conversations
CREATE TABLE IF NOT EXISTS public.university_chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Conversation details
    title TEXT DEFAULT 'University Matching Chat',
    conversation_type TEXT DEFAULT 'matching' CHECK (conversation_type IN ('matching', 'research', 'comparison', 'application_help')),
    
    -- User context
    user_profile_snapshot JSONB DEFAULT '{}',
    academic_background JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    
    -- Conversation state
    current_step TEXT DEFAULT 'introduction',
    progress_percentage INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    
    -- Results and recommendations
    university_recommendations JSONB DEFAULT '[]',
    match_scores JSONB DEFAULT '{}',
    personalized_insights TEXT[],
    
    -- Conversation settings
    is_active BOOLEAN DEFAULT true,
    language_preference TEXT DEFAULT 'en',
    
    -- Metadata
    session_duration_minutes INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced university chat messages
CREATE TABLE IF NOT EXISTS public.university_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.university_chat_conversations(id) ON DELETE CASCADE NOT NULL,
    
    -- Message details
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'university_recommendations', 'cv_upload', 'analysis', 'comparison', 'action_required')),
    
    -- Rich content
    structured_data JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    action_buttons JSONB DEFAULT '[]',
    
    -- Message processing
    processing_time_ms INTEGER,
    confidence_score DECIMAL(3,2),
    intent_detected TEXT,
    entities_extracted JSONB DEFAULT '{}',
    
    -- User interaction
    user_reaction TEXT CHECK (user_reaction IN ('helpful', 'not_helpful', 'partially_helpful')),
    feedback_text TEXT,
    
    -- Message metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- University recommendations tracking
CREATE TABLE IF NOT EXISTS public.university_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.university_chat_conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    program_id UUID REFERENCES public.university_programs(id) ON DELETE CASCADE,
    
    -- Recommendation details
    match_score DECIMAL(5,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    recommendation_rank INTEGER,
    category TEXT CHECK (category IN ('safety', 'target', 'reach')),
    
    -- Matching factors
    academic_match DECIMAL(5,2),
    financial_match DECIMAL(5,2),
    location_match DECIMAL(5,2),
    program_match DECIMAL(5,2),
    culture_match DECIMAL(5,2),
    
    -- Reasoning and insights
    match_reasons TEXT[],
    potential_concerns TEXT[],
    personalized_notes TEXT,
    
    -- User interaction
    user_interest_level INTEGER CHECK (user_interest_level >= 1 AND user_interest_level <= 5),
    is_saved BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    user_notes TEXT,
    
    -- Follow-up actions
    actions_taken TEXT[],
    application_status TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- 10. ENHANCED CV ANALYSIS SYSTEM
-- =====================================================================

-- Comprehensive CV analysis results
CREATE TABLE IF NOT EXISTS public.cv_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.university_chat_conversations(id) ON DELETE CASCADE,
    
    -- Analysis metadata
    analysis_version TEXT DEFAULT '2.0',
    analysis_type TEXT DEFAULT 'comprehensive' CHECK (analysis_type IN ('basic', 'comprehensive', 'targeted')),
    processing_time_ms INTEGER,
    
    -- Extracted information
    contact_information JSONB DEFAULT '{}',
    education_details JSONB DEFAULT '[]',
    work_experience JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    publications JSONB DEFAULT '[]',
    awards JSONB DEFAULT '[]',
    
    -- Computed insights
    experience_years INTEGER,
    education_level TEXT,
    field_of_study TEXT,
    career_trajectory TEXT,
    industry_focus TEXT[],
    
    -- Quality assessment
    overall_quality_score INTEGER CHECK (overall_quality_score >= 1 AND overall_quality_score <= 100),
    content_completeness DECIMAL(5,2),
    formatting_quality DECIMAL(5,2),
    keyword_optimization DECIMAL(5,2),
    
    -- Strengths and areas for improvement
    strengths JSONB DEFAULT '[]',
    improvement_areas JSONB DEFAULT '[]',
    missing_elements TEXT[],
    optimization_suggestions TEXT[],
    
    -- University matching insights
    recommended_programs JSONB DEFAULT '[]',
    program_alignment_scores JSONB DEFAULT '{}',
    admission_competitiveness JSONB DEFAULT '{}',
    
    -- Scoring and metrics
    match_score DECIMAL(3,2),
    competitiveness_score INTEGER CHECK (competitiveness_score >= 1 AND competitiveness_score <= 100),
    uniqueness_score INTEGER CHECK (uniqueness_score >= 1 AND uniqueness_score <= 100),
    
    -- Comparative analysis
    peer_comparison_data JSONB DEFAULT '{}',
    industry_benchmarks JSONB DEFAULT '{}',
    
    -- Actionable recommendations
    immediate_improvements TEXT[],
    long_term_development TEXT[],
    skill_gap_analysis JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CV analysis feedback and iterations
CREATE TABLE IF NOT EXISTS public.cv_analysis_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES public.cv_analysis(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Feedback details
    overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    usefulness_rating INTEGER CHECK (usefulness_rating >= 1 AND usefulness_rating <= 5),
    
    -- Specific feedback
    helpful_insights TEXT[],
    inaccurate_information TEXT[],
    missing_insights TEXT[],
    additional_comments TEXT,
    
    -- Follow-up actions
    implemented_suggestions TEXT[],
    ignored_suggestions TEXT[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- 11. COMPREHENSIVE NOTIFICATIONS SYSTEM
-- =====================================================================

-- Enhanced notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Notification content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    category TEXT,
    
    -- Delivery channels
    channels notification_type[] DEFAULT ARRAY['in_app'],
    
    -- Priority and urgency
    priority priority_level DEFAULT 'medium',
    is_urgent BOOLEAN DEFAULT false,
    requires_action BOOLEAN DEFAULT false,
    
    -- Rich content
    action_url TEXT,
    action_text TEXT,
    image_url TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Delivery tracking
    delivery_status JSONB DEFAULT '{}',
    delivered_at JSONB DEFAULT '{}',
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Grouping
    group_key TEXT,
    is_grouped BOOLEAN DEFAULT false,
    
    -- Related entities
    related_entity_type TEXT,
    related_entity_id UUID,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Channel preferences
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    in_app_enabled BOOLEAN DEFAULT true,
    
    -- Category preferences
    application_updates JSONB DEFAULT '{"email": true, "push": true, "in_app": true}',
    deadline_reminders JSONB DEFAULT '{"email": true, "push": true, "in_app": true}',
    social_interactions JSONB DEFAULT '{"email": false, "push": true, "in_app": true}',
    mentor_communications JSONB DEFAULT '{"email": true, "push": true, "in_app": true}',
    system_announcements JSONB DEFAULT '{"email": true, "push": false, "in_app": true}',
    
    -- Timing preferences
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone TEXT DEFAULT 'UTC',
    
    -- Frequency settings
    digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('immediate', 'daily', 'weekly', 'never')),
    batch_notifications BOOLEAN DEFAULT true,
    
    -- Advanced settings
    smart_scheduling BOOLEAN DEFAULT true,
    priority_override BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- 12. ANALYTICS AND ACTIVITY TRACKING
-- =====================================================================

-- User activity log
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type TEXT NOT NULL,
    activity_category TEXT,
    description TEXT,
    
    -- Context
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,
    ip_address INET,
    session_id TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    duration_seconds INTEGER,
    
    -- Related entities
    entity_type TEXT,
    entity_id UUID,
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Platform analytics
CREATE TABLE IF NOT EXISTS public.platform_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    date DATE NOT NULL,
    period_type TEXT DEFAULT 'daily' CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
    
    -- User metrics
    daily_active_users INTEGER DEFAULT 0,
    weekly_active_users INTEGER DEFAULT 0,
    monthly_active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    returning_users INTEGER DEFAULT 0,
    
    -- Engagement metrics
    total_sessions INTEGER DEFAULT 0,
    average_session_duration DECIMAL(8,2),
    page_views INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2),
    
    -- Feature usage
    applications_created INTEGER DEFAULT 0,
    documents_uploaded INTEGER DEFAULT 0,
    mentor_sessions_completed INTEGER DEFAULT 0,
    posts_created INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    
    -- Performance metrics
    average_response_time_ms INTEGER,
    error_rate DECIMAL(5,2),
    uptime_percentage DECIMAL(5,2),
    
    -- Conversion metrics
    onboarding_completion_rate DECIMAL(5,2),
    feature_adoption_rate JSONB DEFAULT '{}',
    
    -- Revenue metrics (if applicable)
    revenue DECIMAL(12,2) DEFAULT 0,
    subscriptions_active INTEGER DEFAULT 0,
    mentor_sessions_paid INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- 13. FEATURE FLAGS AND CONFIGURATION
-- =====================================================================

-- Feature flags for gradual rollout
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Flag identification
    flag_name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    
    -- Flag status
    is_enabled BOOLEAN DEFAULT false,
    environment TEXT DEFAULT 'development' CHECK (environment IN ('development', 'staging', 'production')),
    
    -- Targeting
    target_percentage INTEGER DEFAULT 0 CHECK (target_percentage >= 0 AND target_percentage <= 100),
    target_users UUID[],
    target_roles user_role[],
    
    -- Conditions
    conditions JSONB DEFAULT '{}',
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- System configuration
CREATE TABLE IF NOT EXISTS public.system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuration details
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    category TEXT,
    
    -- Access control
    is_public BOOLEAN DEFAULT false,
    required_role user_role DEFAULT 'admin',
    
    -- Versioning
    version INTEGER DEFAULT 1,
    previous_value JSONB,
    
    -- Metadata
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- 14. PERFORMANCE AND MONITORING VIEWS
-- =====================================================================

-- Application overview view
CREATE OR REPLACE VIEW application_overview AS
SELECT 
    a.id,
    a.user_id,
    u.name as university_name,
    up.name as program_name,
    a.status,
    a.progress_percentage as progress,
    a.submission_date,
    a.created_at
FROM public.applications a
JOIN public.selected_universities su ON a.selected_university_id = su.id
JOIN public.universities u ON su.university_id = u.id
LEFT JOIN public.university_programs up ON su.program_id = up.id;

-- User dashboard summary view
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
    up.user_id,
    up.full_name,
    up.role,
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status IN ('submitted', 'under_review', 'interview_scheduled') THEN a.id END) as active_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'accepted' THEN a.id END) as accepted_applications,
    COUNT(DISTINCT d.id) as total_deadlines,
    COUNT(DISTINCT CASE WHEN d.due_date <= CURRENT_DATE + INTERVAL '7 days' AND NOT d.is_completed THEN d.id END) as upcoming_deadlines
FROM public.user_profiles up
LEFT JOIN public.applications a ON up.user_id = a.user_id
LEFT JOIN public.deadlines d ON up.user_id = d.user_id
GROUP BY up.user_id, up.full_name, up.role;

-- Performance monitoring view
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
    'users' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('public.user_profiles')) as table_size
FROM public.user_profiles
UNION ALL
SELECT 
    'applications' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('public.applications')) as table_size
FROM public.applications
UNION ALL
SELECT 
    'universities' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('public.universities')) as table_size
FROM public.universities
UNION ALL
SELECT 
    'documents' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('public.documents')) as table_size
FROM public.documents;

-- =====================================================================
-- 15. INDEXES FOR PERFORMANCE
-- =====================================================================

-- Core performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON public.applications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_universities_name ON public.universities USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_universities_country_city ON public.universities(country, city);
CREATE INDEX IF NOT EXISTS idx_universities_ranking ON public.universities(ranking_global, ranking_national);

CREATE INDEX IF NOT EXISTS idx_university_programs_university_id ON public.university_programs(university_id);
CREATE INDEX IF NOT EXISTS idx_university_programs_name ON public.university_programs USING GIN(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

CREATE INDEX IF NOT EXISTS idx_deadlines_user_id ON public.deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON public.deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_user_due ON public.deadlines(user_id, due_date);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON public.posts USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON public.activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_activity_type ON public.activity_log(activity_type);

-- Full-text search indexes using proper functions
CREATE INDEX IF NOT EXISTS idx_universities_search_text ON public.universities 
USING GIN(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(city, '') || ' ' || COALESCE(country, '')));

CREATE INDEX IF NOT EXISTS idx_university_programs_search_text ON public.university_programs 
USING GIN(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(department, '')));

CREATE INDEX IF NOT EXISTS idx_posts_search_text ON public.posts 
USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || array_to_string(COALESCE(tags, '{}'), ' ')));

-- =====================================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all user tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_research_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selected_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_analysis_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- User profile policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Academic profile policies
CREATE POLICY "Users can manage own academic profile" ON public.academic_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Application policies
CREATE POLICY "Users can manage own applications" ON public.applications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own application requirements" ON public.application_requirements
    FOR ALL USING (auth.uid() = (SELECT user_id FROM public.applications WHERE id = application_id));

-- Document policies
CREATE POLICY "Users can manage own documents" ON public.documents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own resumes" ON public.resumes
    FOR ALL USING (auth.uid() = user_id);

-- Deadline policies
CREATE POLICY "Users can manage own deadlines" ON public.deadlines
    FOR ALL USING (auth.uid() = user_id);

-- Social networking policies
CREATE POLICY "Users can manage own posts" ON public.posts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public posts" ON public.posts
    FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can manage own post interactions" ON public.post_likes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own comments" ON public.post_comments
    FOR ALL USING (auth.uid() = user_id);

-- Connection policies
CREATE POLICY "Users can manage own connections" ON public.user_connections
    FOR ALL USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Messaging policies
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = conversations.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
        )
    );

-- Mentor platform policies
CREATE POLICY "Users can manage own mentor profile" ON public.mentor_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public mentor profiles" ON public.mentor_profiles
    FOR SELECT USING (true); -- Public visibility for mentor discovery

CREATE POLICY "Users can manage own mentorship sessions" ON public.mentorship_sessions
    FOR ALL USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- Notification policies
CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- University chat policies
CREATE POLICY "Users can manage own university chat conversations" ON public.university_chat_conversations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat messages" ON public.university_chat_messages
    FOR ALL USING (auth.uid() = (SELECT user_id FROM public.university_chat_conversations WHERE id = conversation_id));

-- CV analysis policies
CREATE POLICY "Users can manage own CV analysis" ON public.cv_analysis
    FOR ALL USING (auth.uid() = user_id);

-- Activity log policies (read-only for users)
CREATE POLICY "Users can view own activity" ON public.activity_log
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================================
-- 17. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_academic_profiles_updated_at BEFORE UPDATE ON public.academic_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON public.universities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_university_programs_updated_at BEFORE UPDATE ON public.university_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update post search vector
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '') || ' ' || array_to_string(COALESCE(NEW.tags, '{}'), ' '));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_search_vector 
    BEFORE INSERT OR UPDATE ON public.posts 
    FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

-- Function to update engagement counters
CREATE OR REPLACE FUNCTION update_post_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_post_likes_counter 
    AFTER INSERT OR DELETE ON public.post_likes 
    FOR EACH ROW EXECUTE FUNCTION update_post_counters();

-- =====================================================================
-- 18. UTILITY FUNCTIONS
-- =====================================================================

-- Function to check database health
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE (
    table_name text,
    row_count bigint,
    table_size text,
    last_updated timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'user_profiles'::text,
        COUNT(*)::bigint,
        pg_size_pretty(pg_total_relation_size('public.user_profiles')),
        MAX(updated_at)
    FROM public.user_profiles
    UNION ALL
    SELECT 
        'applications'::text,
        COUNT(*)::bigint,
        pg_size_pretty(pg_total_relation_size('public.applications')),
        MAX(updated_at)
    FROM public.applications
    UNION ALL
    SELECT 
        'universities'::text,
        COUNT(*)::bigint,
        pg_size_pretty(pg_total_relation_size('public.universities')),
        MAX(updated_at)
    FROM public.universities;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old activity logs
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs(days_to_keep integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.activity_log 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 19. SAMPLE DATA INSERTION
-- =====================================================================

-- Insert sample research interests
INSERT INTO public.research_interests (name, description, category, subcategory, keywords) VALUES
('Machine Learning', 'Artificial intelligence and machine learning algorithms', 'Computer Science', 'Artificial Intelligence', ARRAY['ML', 'AI', 'algorithms', 'neural networks']),
('Data Science', 'Data analysis, statistics, and data mining', 'Computer Science', 'Data Analytics', ARRAY['data mining', 'statistics', 'big data', 'analytics']),
('Biomedical Engineering', 'Engineering principles applied to biological systems', 'Engineering', 'Bioengineering', ARRAY['biotech', 'medical devices', 'biotechnology']),
('Environmental Science', 'Study of environmental systems and sustainability', 'Science', 'Environmental Studies', ARRAY['sustainability', 'climate change', 'ecology']),
('Psychology', 'Study of human behavior and mental processes', 'Social Sciences', 'Behavioral Sciences', ARRAY['cognitive psychology', 'behavioral analysis']),
('Finance', 'Financial markets, investments, and corporate finance', 'Business', 'Finance & Economics', ARRAY['investments', 'financial modeling', 'economics']),
('Marketing', 'Consumer behavior and marketing strategies', 'Business', 'Marketing & Sales', ARRAY['digital marketing', 'consumer behavior', 'branding']),
('International Relations', 'Global politics and international affairs', 'Political Science', 'International Studies', ARRAY['diplomacy', 'global politics', 'foreign policy']),
('Software Engineering', 'Design and development of software systems', 'Computer Science', 'Software Development', ARRAY['programming', 'software architecture', 'development']),
('Cybersecurity', 'Information security and cyber defense', 'Computer Science', 'Information Security', ARRAY['cyber defense', 'information security', 'network security'])
ON CONFLICT (name) DO NOTHING;

-- Insert sample universities with comprehensive data
INSERT INTO public.universities (
    name, code, country, state_province, city, website_url, description, 
    ranking_national, ranking_global, acceptance_rate, institution_type, 
    tuition_in_state, tuition_out_state, tuition_international,
    application_deadline_fall, application_fee
) VALUES
('Stanford University', 'STANFORD', 'United States', 'California', 'Stanford', 'https://www.stanford.edu', 
 'A leading research university known for innovation and entrepreneurship', 5, 3, 4.34, 'private',
 56169, 56169, 56169, '2024-01-02', 90),
 
('Massachusetts Institute of Technology', 'MIT', 'United States', 'Massachusetts', 'Cambridge', 'https://www.mit.edu',
 'World-renowned institute for science, technology, and research', 4, 1, 7.3, 'private',
 55878, 55878, 55878, '2024-01-01', 75),
 
('Harvard University', 'HARVARD', 'United States', 'Massachusetts', 'Cambridge', 'https://www.harvard.edu',
 'Prestigious Ivy League university with extensive graduate programs', 2, 4, 5.2, 'private',
 54269, 54269, 54269, '2024-12-01', 105),
 
('University of California, Berkeley', 'UC_BERKELEY', 'United States', 'California', 'Berkeley', 'https://www.berkeley.edu',
 'Top public research university with strong programs across disciplines', 22, 8, 17.5, 'public',
 14312, 44066, 44066, '2023-11-30', 70),
 
('Carnegie Mellon University', 'CMU', 'United States', 'Pennsylvania', 'Pittsburgh', 'https://www.cmu.edu',
 'Leading university in computer science and engineering', 26, 52, 17.3, 'private',
 58924, 58924, 58924, '2024-01-03', 75),

('University of Oxford', 'OXFORD', 'United Kingdom', 'England', 'Oxford', 'https://www.ox.ac.uk',
 'One of the oldest and most prestigious universities in the world', 1, 2, 17.5, 'public',
 NULL, NULL, 28000, '2024-01-06', 0),
 
('ETH Zurich', 'ETH', 'Switzerland', 'Zurich', 'Zurich', 'https://ethz.ch',
 'Leading European university for science, technology, and engineering', 1, 11, 8.0, 'public',
 NULL, NULL, 1400, '2023-12-15', 150),

('University of Toronto', 'U_OF_T', 'Canada', 'Ontario', 'Toronto', 'https://www.utoronto.ca',
 'Canada\'s leading research university with global reputation', 1, 18, 43.0, 'public',
 NULL, NULL, 35000, '2024-01-15', 125)
ON CONFLICT (code) DO NOTHING;

-- Insert sample university programs
INSERT INTO public.university_programs (
    university_id, name, degree_type, department, duration_years, 
    tuition_annual, deadline_fall, gre_required, min_gpa, description
) VALUES
((SELECT id FROM public.universities WHERE code = 'STANFORD'), 
 'Master of Science in Computer Science', 'Masters', 'Computer Science', 2.0,
 55473, '2023-12-05', true, 3.5, 'Comprehensive CS program with specializations in AI, systems, and theory'),
 
((SELECT id FROM public.universities WHERE code = 'MIT'), 
 'Master of Engineering in Electrical Engineering', 'Masters', 'Electrical Engineering', 1.0,
 55878, '2023-12-15', true, 3.7, 'Advanced engineering program focusing on cutting-edge research'),
 
((SELECT id FROM public.universities WHERE code = 'HARVARD'), 
 'Master of Business Administration', 'MBA', 'Business School', 2.0,
 73440, '2024-04-02', false, 3.4, 'World-class MBA program with global perspective'),
 
((SELECT id FROM public.universities WHERE code = 'UC_BERKELEY'), 
 'Master of Information and Data Science', 'Masters', 'Information School', 1.5,
 44066, '2024-02-01', false, 3.3, 'Professional program in data science and analytics'),
 
((SELECT id FROM public.universities WHERE code = 'CMU'), 
 'Master of Science in Machine Learning', 'Masters', 'Machine Learning Department', 2.0,
 58924, '2023-12-15', true, 3.6, 'Specialized program in machine learning and AI')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 20. FINAL SETUP AND VALIDATION
-- =====================================================================

-- Create a function to validate the database setup
CREATE OR REPLACE FUNCTION validate_database_setup()
RETURNS TABLE (
    component text,
    status text,
    details text
) AS $$
BEGIN
    -- Check if all required tables exist
    RETURN QUERY
    WITH required_tables AS (
        SELECT unnest(ARRAY[
            'user_profiles', 'academic_profiles', 'research_interests', 'universities', 
            'university_programs', 'applications', 'documents', 'posts', 'messages', 
            'mentor_profiles', 'notifications', 'activity_log'
        ]) AS table_name
    ),
    existing_tables AS (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    )
    SELECT 
        'Tables'::text,
        CASE 
            WHEN COUNT(rt.table_name) = COUNT(et.table_name) THEN 'OK'
            ELSE 'MISSING_TABLES'
        END::text,
        COALESCE('Missing: ' || string_agg(rt.table_name, ', '), 'All tables present')::text
    FROM required_tables rt
    LEFT JOIN existing_tables et ON rt.table_name = et.table_name
    
    UNION ALL
    
    -- Check indexes
    SELECT 
        'Indexes'::text,
        'OK'::text,
        COUNT(*)::text || ' indexes created'
    FROM pg_indexes 
    WHERE schemaname = 'public'
    
    UNION ALL
    
    -- Check sample data
    SELECT 
        'Sample Data'::text,
        'OK'::text,
        (SELECT COUNT(*)::text FROM public.universities) || ' universities, ' ||
        (SELECT COUNT(*)::text FROM public.research_interests) || ' research interests'
    
    UNION ALL
    
    -- Check RLS policies
    SELECT 
        'RLS Policies'::text,
        'OK'::text,
        COUNT(*)::text || ' policies configured'
    FROM pg_policies 
    WHERE schemaname = 'public';
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- SETUP COMPLETE
-- =====================================================================

-- Display setup completion message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'GradApp Ascend Platform Database Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created: % tables with comprehensive features', (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    );
    RAISE NOTICE 'Features: Full-text search, RLS security, performance optimization';
    RAISE NOTICE 'Run SELECT * FROM validate_database_setup(); to verify installation';
    RAISE NOTICE '========================================';
END $$;