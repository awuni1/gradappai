-- =====================================================================
-- SECURITY AND STORAGE SETUP
-- =====================================================================

-- =====================================================================
-- 1. STORAGE BUCKETS
-- =====================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_research_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selected_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_analysis ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Academic profiles policies
CREATE POLICY "Users can manage own academic profile" ON public.academic_profiles FOR ALL USING (auth.uid() = user_id);

-- Applications policies
CREATE POLICY "Users can manage own applications" ON public.applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own application requirements" ON public.application_requirements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND user_id = auth.uid())
);

-- Deadlines policies
CREATE POLICY "Users can manage own deadlines" ON public.deadlines FOR ALL USING (auth.uid() = user_id);

-- Resume policies
CREATE POLICY "Users can manage own resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id);

-- Selected universities policies
CREATE POLICY "Users can manage own selected universities" ON public.selected_universities FOR ALL USING (auth.uid() = user_id);

-- Research interests policies
CREATE POLICY "Everyone can view research interests" ON public.research_interests FOR SELECT USING (true);
CREATE POLICY "Users can manage own research interest mappings" ON public.user_research_interests FOR ALL USING (auth.uid() = user_id);

-- University and program policies (public read access)
CREATE POLICY "Everyone can view universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Everyone can view university programs" ON public.university_programs FOR SELECT USING (true);

-- Posts policies
CREATE POLICY "Users can view public posts" ON public.posts FOR SELECT USING (
    visibility = 'public' OR 
    user_id = auth.uid() OR 
    (visibility = 'connections' AND EXISTS (
        SELECT 1 FROM public.user_connections 
        WHERE (requester_id = auth.uid() AND addressee_id = user_id AND status = 'accepted')
           OR (addressee_id = auth.uid() AND requester_id = user_id AND status = 'accepted')
    ))
);
CREATE POLICY "Users can manage own posts" ON public.posts FOR ALL USING (auth.uid() = user_id);

-- Post likes policies
CREATE POLICY "Users can view likes on visible posts" ON public.post_likes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.posts p 
        WHERE p.id = post_id 
        AND (
            p.visibility = 'public' OR 
            p.user_id = auth.uid() OR 
            (p.visibility = 'connections' AND EXISTS (
                SELECT 1 FROM public.user_connections 
                WHERE (requester_id = auth.uid() AND addressee_id = p.user_id AND status = 'accepted')
                   OR (addressee_id = auth.uid() AND requester_id = p.user_id AND status = 'accepted')
            ))
        )
    )
);
CREATE POLICY "Users can manage own likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

-- Post comments policies
CREATE POLICY "Users can view comments on visible posts" ON public.post_comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.posts p 
        WHERE p.id = post_id 
        AND (
            p.visibility = 'public' OR 
            p.user_id = auth.uid() OR 
            (p.visibility = 'connections' AND EXISTS (
                SELECT 1 FROM public.user_connections 
                WHERE (requester_id = auth.uid() AND addressee_id = p.user_id AND status = 'accepted')
                   OR (addressee_id = auth.uid() AND requester_id = p.user_id AND status = 'accepted')
            ))
        )
    )
);
CREATE POLICY "Users can manage own comments" ON public.post_comments FOR ALL USING (auth.uid() = user_id);

-- Connection policies
CREATE POLICY "Users can view own connections" ON public.user_connections FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = addressee_id
);
CREATE POLICY "Users can create connection requests" ON public.user_connections FOR INSERT WITH CHECK (
    auth.uid() = requester_id
);
CREATE POLICY "Users can update connections they're part of" ON public.user_connections FOR UPDATE USING (
    auth.uid() = requester_id OR auth.uid() = addressee_id
);

-- Messaging policies
CREATE POLICY "Users can view conversations they participate in" ON public.conversations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_id = id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp2 
        WHERE cp2.conversation_id = conversation_id AND cp2.user_id = auth.uid()
    )
);

CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
);

-- Mentor platform policies
CREATE POLICY "Everyone can view verified mentor profiles" ON public.mentor_profiles FOR SELECT USING (is_verified = true);
CREATE POLICY "Users can manage own mentor profile" ON public.mentor_profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their mentorship sessions" ON public.mentorship_sessions FOR SELECT USING (
    auth.uid() = mentor_id OR auth.uid() = student_id
);
CREATE POLICY "Users can manage their mentorship sessions" ON public.mentorship_sessions FOR ALL USING (
    auth.uid() = mentor_id OR auth.uid() = student_id
);

-- University chat policies
CREATE POLICY "Users can manage own chat conversations" ON public.university_chat_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage messages in own conversations" ON public.university_chat_messages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.university_chat_conversations 
        WHERE id = conversation_id AND user_id = auth.uid()
    )
);

-- CV analysis policies
CREATE POLICY "Users can manage own CV analysis" ON public.cv_analysis FOR ALL USING (auth.uid() = user_id);

-- =====================================================================
-- 3. STORAGE POLICIES
-- =====================================================================

-- Resume bucket policies
CREATE POLICY "Users can view own resumes" ON storage.objects FOR SELECT USING (
    bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can upload own resumes" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can update own resumes" ON storage.objects FOR UPDATE USING (
    bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can delete own resumes" ON storage.objects FOR DELETE USING (
    bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Profile pictures bucket policies
CREATE POLICY "Anyone can view profile pictures" ON storage.objects FOR SELECT USING (bucket_id = 'profile-pictures');
CREATE POLICY "Users can upload own profile pictures" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can update own profile pictures" ON storage.objects FOR UPDATE USING (
    bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can delete own profile pictures" ON storage.objects FOR DELETE USING (
    bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Documents bucket policies
CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can upload own documents" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can update own documents" ON storage.objects FOR UPDATE USING (
    bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can delete own documents" ON storage.objects FOR DELETE USING (
    bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================================
-- 4. FUNCTIONS AND TRIGGERS
-- =====================================================================

-- Update updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_academic_profiles_updated_at BEFORE UPDATE ON public.academic_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON public.universities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_university_programs_updated_at BEFORE UPDATE ON public.university_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- 5. HELPFUL VIEWS
-- =====================================================================

-- Create a view for application overview
CREATE OR REPLACE VIEW public.application_overview AS
SELECT 
    a.id,
    a.user_id,
    u.name as university_name,
    up.name as program_name,
    a.status,
    a.progress,
    a.submission_date,
    a.created_at
FROM public.applications a
JOIN public.selected_universities su ON a.selected_university_id = su.id
JOIN public.universities u ON su.university_id = u.id
LEFT JOIN public.university_programs up ON su.program_id = up.id;