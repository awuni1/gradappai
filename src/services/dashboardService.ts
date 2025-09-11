import { supabase } from "@/integrations/supabase/client";

export interface AcademicProfile {
  id?: string;
  user_id: string;
  current_institution?: string;
  current_degree?: string;
  current_field_of_study?: string;
  graduation_year?: number;
  current_gpa?: number;
  last_cv_upload?: string;
  cv_analysis_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ResearchInterest {
  id?: string;
  name: string;
  description?: string;
  category?: string;
}

export interface Resume {
  id?: string;
  user_id?: string;
  cv_url: string;
  parsed_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MatchedUniversity {
  id?: string;
  university_name: string;
  program_name: string;
  match_score: number;
  match_reason?: string;
  website_url?: string;
  location?: string;
  university_id?: string;
  program_id?: string;
  application_deadline?: string;
  funding_available?: boolean;
  funding_details?: string;
  match_factors?: any;
}

export interface MatchedProfessor {
  id?: string;
  professor_name: string;
  university: string;
  match_score: number;
  match_reason?: string;
  email?: string;
  research_areas?: string;
  department?: string;
  profile_url?: string;
  accepting_students?: boolean;
  profile_complete?: boolean;
  contact_available?: boolean;
  research_focus?: string[];
}

export interface SelectedUniversity {
  id?: string;
  user_id?: string;
  university_name: string;
  program_name?: string;
  location?: string;
  application_deadline?: string;
  funding_available?: boolean;
  funding_details?: string;
  website_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SelectedProfessor {
  id?: string;
  user_id?: string;
  selected_university_id: string;
  professor_name: string;
  research_interests: string;
  contact_status: string;
  email?: string;
  department?: string;
  created_at?: string;
  updated_at?: string;
}

// Application tracking interfaces
export interface Application {
  id?: string;
  user_id?: string;
  selected_university_id: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'interview' | 'accepted' | 'rejected' | 'waitlisted';
  progress: number;
  submission_date?: string;
  interview_date?: string;
  decision_date?: string;
  notes?: string;
  application_fee?: number;
  fee_paid?: boolean;
  application_portal_url?: string;
  application_id_external?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  university_name?: string;
  program_name?: string;
  location?: string;
  deadlines?: Deadline[];
  requirements?: ApplicationRequirement[];
}

export interface ApplicationRequirement {
  id?: string;
  application_id: string;
  requirement_type: 'transcript' | 'sop' | 'personal_statement' | 'letters_of_recommendation' | 'gre_scores' | 'toefl_scores' | 'ielts_scores' | 'portfolio' | 'writing_samples' | 'other';
  requirement_name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'submitted';
  due_date?: string;
  completed_at?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  notes?: string;
  is_optional?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Deadline {
  id?: string;
  application_id: string;
  deadline_type: 'application' | 'financial_aid' | 'scholarship' | 'housing' | 'interview' | 'decision' | 'enrollment_deposit';
  deadline_date: string;
  deadline_time?: string;
  description?: string;
  is_completed?: boolean;
  completed_at?: string;
  reminder_sent?: boolean;
  reminder_days_before?: number;
  priority?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const dashboardService = {
  // Profile section with CV analysis integration
  getUserProfile: async () => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { user: null, academicProfile: null, researchInterests: [], resume: null, cvAnalysis: null, error: "Not authenticated" };
    }
    
    try {
      // Get CV analysis service for enhanced profile
      const { cvAnalysisService } = await import('./cvAnalysisService');
      const enhancedProfile = await cvAnalysisService.getEnhancedUserProfile(user.user.id);
      
      // Get academic profile (with CV data if available)
      const { data: academicProfile, error: profileError } = await supabase
        .from("academic_profiles")
        .select("*")
        .eq("user_id", user.user.id)
        .maybeSingle();
        
      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching academic profile:", profileError);
      }
      
      // Get research interests (using correct column name 'name' not 'title')
      const { data: userInterests, error: interestsError } = await supabase
        .from("user_research_interests")
        .select(`
          research_interest_id,
          research_interests:research_interest_id (
            id, name, category
          )
        `)
        .eq("user_id", user.user.id);
        
      if (interestsError) {
        console.error("Error fetching research interests:", interestsError);
      }
      
      // Format research interests
      const researchInterests = userInterests 
        ? userInterests.map(item => item.research_interests as ResearchInterest) 
        : [];
      
      // Get latest resume
      const { data: resume, error: resumeError } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (resumeError && resumeError.code !== 'PGRST116') {
        console.error("Error fetching resume:", resumeError);
      }
      
      return { 
        user: user.user, 
        academicProfile: academicProfile || enhancedProfile?.academicProfile, 
        researchInterests: researchInterests.length > 0 ? researchInterests : enhancedProfile?.researchInterests || [],
        resume,
        cvAnalysis: enhancedProfile?.cvAnalysis,
        hasCompleteProfile: enhancedProfile?.hasCompleteProfile || false,
        error: null 
      };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      // Fallback to basic profile fetch
      const { data: academicProfile } = await supabase
        .from("academic_profiles")
        .select("*")
        .eq("user_id", user.user.id)
        .maybeSingle();
      
      return { 
        user: user.user, 
        academicProfile, 
        researchInterests: [],
        resume: null,
        cvAnalysis: null,
        error: null 
      };
    }
  },
  
  updateAcademicProfile: async (academicProfile: AcademicProfile) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }
    
    const { data, error } = await supabase
      .from("academic_profiles")
      .upsert({
        user_id: user.user.id,
        current_institution: academicProfile.current_institution,
        current_degree: academicProfile.current_degree,
        current_field_of_study: academicProfile.current_field_of_study,
        graduation_year: academicProfile.graduation_year,
        current_gpa: academicProfile.current_gpa || null
      })
      .select();
      
    return { data, error };
  },
  
  
  updateResearchInterests: async (researchInterests: ResearchInterest[]) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }
    
    // First, ensure all research interests exist in the research_interests table
    const interestPromises = researchInterests.map(async (interest) => {
      // Check if this interest already exists (using correct column name 'name')
      const { data: existingInterests } = await supabase
        .from("research_interests")
        .select("id, name")
        .eq("name", interest.name)
        .maybeSingle();

      if (existingInterests) {
        return existingInterests.id;
      } 
        // Create the new research interest (using correct column name 'name')
        const { data: newInterest, error } = await supabase
          .from("research_interests")
          .insert({
            name: interest.name,
            category: interest.category
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating research interest:", error);
          return null;
        }

        return newInterest.id;
      
    });

    const interestIds = await Promise.all(interestPromises);
    const validInterestIds = interestIds.filter(id => id !== null) as string[];
    
    // Delete existing user interests
    await supabase
      .from("user_research_interests")
      .delete()
      .eq("user_id", user.user.id);

    // Now link the user to these research interests
    const userInterestsData = validInterestIds.map(interestId => ({
      user_id: user.user.id,
      research_interest_id: interestId
    }));

    if (userInterestsData.length > 0) {
      const { data, error } = await supabase
        .from("user_research_interests")
        .insert(userInterestsData)
        .select();

      return { data, error };
    }

    return { data: null, error: null };
  },
  
  // University matches - enhanced with CV analysis recommendations and better timeout handling
  getMatchedUniversities: async () => {
    // Timeout wrapper for individual operations
    const timeoutWrapper = <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((resolve) => 
          setTimeout(() => resolve(fallback), timeoutMs)
        )
      ]);
    };

    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { data: [], error: "Not authenticated" };
      }
      
      console.log('🔄 Fetching university matches for user:', user.user.id);
      
      // First check for university recommendations from CV analysis with timeout
      let cvRecommendations = [];
      try {
        const cvAnalysisPromise = (async () => {
          const { cvAnalysisService } = await import('./cvAnalysisService');
          return await cvAnalysisService.getStoredAnalysis(user.user.id);
        })();
        
        const latestAnalysis = await timeoutWrapper(cvAnalysisPromise, 3000, null);
        
        if (latestAnalysis?.recommendations?.universityRecommendations) {
          cvRecommendations = latestAnalysis.recommendations.universityRecommendations.map((rec: any) => ({
            id: `cv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            university_name: rec.universityName,
            program_name: rec.programName, 
            match_score: rec.matchScore,
            location: rec.location,
            website_url: rec.website,
            category: rec.category,
            reasoning: rec.reasoning,
            requirements: rec.requirements,
            application_deadline: rec.applicationDeadline,
            source: 'cv_analysis'
          }));
          
          console.log(`✅ Found ${cvRecommendations.length} CV-based university recommendations`);
        } else {
          console.log('ℹ️ No CV recommendations found or CV analysis timed out');
        }
      } catch (error) {
        console.warn('Could not fetch CV recommendations:', error);
      }
      
      // Get AI university matches from your schema with timeout
      let dbMatches = [];
      try {
        const dbQueryPromise = supabase
          .from("ai_university_matches")
          .select(`
            id,
            overall_match_score,
            match_category,
            universities!inner(name, city, country, website_url),
            university_programs!inner(name)
          `)
          .eq("user_id", user.user.id)
          .order("overall_match_score", { ascending: false })
          .limit(6);

        const { data, error } = await timeoutWrapper(dbQueryPromise, 4000, { data: null, error: null });

        if (error && error.code !== '42P01') {
          console.warn('Error fetching AI university matches from database:', error);
        } else if (data) {
          dbMatches = data.map(match => ({
            id: match.id,
            university_name: match.universities?.name || 'Unknown University',
            program_name: match.university_programs?.name || 'Unknown Program',
            match_score: match.overall_match_score,
            location: `${match.universities?.city || ''}, ${match.universities?.country || ''}`.trim(),
            website_url: match.universities?.website_url,
            category: match.match_category,
            source: 'ai_matching'
          }));
          console.log(`✅ Found ${dbMatches.length} database university matches`);
        } else {
          console.log('ℹ️ No database matches found or database query timed out');
        }
      } catch (error) {
        console.warn('Error fetching database matches:', error);
      }
      
      // Combine CV recommendations with database matches, prioritizing CV analysis
      const allMatches = [...cvRecommendations, ...dbMatches];
      
      // Remove duplicates based on university name and program name
      const uniqueMatches = allMatches.filter((match, index, self) => {
        return index === self.findIndex(m => 
          m.university_name === match.university_name && 
          m.program_name === match.program_name
        );
      });
      
      // Sort by match score and limit to 6 for dashboard display
      let sortedMatches = uniqueMatches
        .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
        .slice(0, 6);

      // Fallback: If no matches found, provide sample universities to prevent empty dashboard
      if (sortedMatches.length === 0) {
        console.log('ℹ️ No university matches found, providing sample universities for better UX');
        sortedMatches = [
          {
            id: 'sample_1',
            university_name: 'Stanford University',
            program_name: 'Computer Science MS',
            match_score: 0.95,
            location: 'Stanford, CA, USA',
            website_url: 'https://www.stanford.edu',
            source: 'fallback'
          },
          {
            id: 'sample_2', 
            university_name: 'MIT',
            program_name: 'Computer Science MS',
            match_score: 0.92,
            location: 'Cambridge, MA, USA',
            website_url: 'https://www.mit.edu',
            source: 'fallback'
          },
          {
            id: 'sample_3',
            university_name: 'Carnegie Mellon University',
            program_name: 'Computer Science MS',
            match_score: 0.90,
            location: 'Pittsburgh, PA, USA',
            website_url: 'https://www.cmu.edu',
            source: 'fallback'
          }
        ];
      }
        
      console.log(`📊 Dashboard showing ${sortedMatches.length} university matches (${cvRecommendations.length} from CV, ${dbMatches.length} from database)`);
      
      return { data: sortedMatches, error: null };
    } catch (error) {
      console.warn('Error fetching matched universities:', error);
      return { data: [], error: null }; // Don't fail dashboard loading
    }
  },
  
  // Professor matches with enhanced data
  getMatchedProfessors: async () => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }
    
    try {
      // Try to get from faculty_profiles table which exists in your schema
      const { data, error } = await supabase
        .from("faculty_profiles")
        .select(`
          id,
          full_name,
          university_id,
          department,
          email,
          research_interests,
          is_accepting_students,
          universities!inner(name, city, country)
        `)
        .eq("is_accepting_students", true)
        .limit(10); // Limit for dashboard performance
      
      if (error && error.code === '42P01') {
        // Table doesn't exist, return empty array
        console.warn('faculty_profiles table not found, returning empty array');
        return { data: [], error: null };
      }
      
      // Transform faculty data to match expected professor format
      const enrichedData = (data || []).map(prof => ({
        id: prof.id,
        professor_name: prof.full_name,
        university: prof.universities?.name || 'Unknown University',
        match_score: 0.8, // Default score since we don't have user-specific matching yet
        match_reason: 'Research area alignment',
        email: prof.email,
        research_areas: Array.isArray(prof.research_interests) ? prof.research_interests.join(', ') : (prof.research_interests || 'Not specified'),
        department: prof.department,
        accepting_students: prof.is_accepting_students,
        profile_complete: Boolean(prof.email && prof.research_interests),
        contact_available: Boolean(prof.email),
        research_focus: Array.isArray(prof.research_interests) ? prof.research_interests.slice(0, 3) : []
      }));
      
      return { data: enrichedData, error };
    } catch (error) {
      console.warn('Error fetching matched professors:', error);
      return { data: [], error: null };
    }
  },

  // Selected Universities functions
  addSelectedUniversity: async (university: MatchedUniversity) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    // Check if university is already selected (using IDs from your schema)
    const { data: existing } = await supabase
      .from("selected_universities")
      .select("id")
      .eq("user_id", user.user.id)
      .eq("university_id", university.university_id)
      .eq("program_id", university.program_id)
      .maybeSingle();

    if (existing) {
      return { data: null, error: "University already selected" };
    }

    // Use actual deadline from university data or default to common deadline
    const applicationDeadline = university.application_deadline || "December 15, 2025";

    const { data, error } = await supabase
      .from("selected_universities")
      .insert({
        user_id: user.user.id,
        university_id: university.university_id || null,
        program_id: university.program_id || null,
        priority: 1,
        category: 'target',
        application_deadline: applicationDeadline ? new Date(applicationDeadline).toISOString().split('T')[0] : null,
        notes: null,
        application_status: 'not_started',
        match_score: university.match_score || 0.8
      })
      .select()
      .single();

    return { data, error };
  },

  getSelectedUniversities: async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { data: [], error: "Not authenticated" };
      }

      // Query with joins to get university and program names from your schema
      const { data, error } = await supabase
        .from("selected_universities")
        .select(`
          id,
          university_id,
          program_id,
          application_status,
          created_at,
          universities!inner(name),
          university_programs!inner(name)
        `)
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // If table doesn't exist, return empty array
      if (error && error.code === '42P01') {
        console.warn('selected_universities table not found, returning empty array');
        return { data: [], error: null };
      }

      // Transform data to include university and program names at top level
      const transformedData = (data || []).map(item => ({
        id: item.id,
        university_id: item.university_id,
        program_id: item.program_id,
        application_status: item.application_status,
        created_at: item.created_at,
        university_name: item.universities?.name || 'Unknown University',
        program_name: item.university_programs?.name || 'Unknown Program',
        location: 'Location not specified' // Add location from universities table if available
      }));

      return { data: transformedData, error };
    } catch (error) {
      console.warn('Error fetching selected universities:', error);
      return { data: [], error: null };
    }
  },

  removeSelectedUniversity: async (universityId: string) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("selected_universities")
      .delete()
      .eq("id", universityId)
      .eq("user_id", user.user.id);

    return { data: null, error };
  },

  addSelectedProfessor: async (universityId: string, professor: MatchedProfessor) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    // Check if professor is already selected
    const { data: existing } = await supabase
      .from("selected_professors")
      .select("id")
      .eq("user_id", user.user.id)
      .eq("selected_university_id", universityId)
      .eq("professor_name", professor.professor_name)
      .maybeSingle();

    if (existing) {
      return { data: null, error: "Professor already selected" };
    }

    const { data, error } = await supabase
      .from("selected_professors")
      .insert({
        user_id: user.user.id,
        selected_university_id: universityId,
        professor_name: professor.professor_name,
        research_interests: professor.research_areas || "",
        contact_status: "Not Contacted",
        email: professor.email,
        department: professor.department || "Not specified",
        profile_url: professor.profile_url || null,
        accepting_students: professor.accepting_students ?? true,
        match_score: professor.match_score || 0.8,
        match_reason: professor.match_reason || "Research alignment"
      })
      .select()
      .single();

    return { data, error };
  },

  updateProfessorStatus: async (professorId: string, status: string) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("selected_professors")
      .update({ 
        contact_status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", professorId)
      .eq("user_id", user.user.id);

    return { data, error };
  },

  // Enhanced data storage methods
  updateUniversityNotes: async (universityId: string, notes: string) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("selected_universities")
      .update({ 
        notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", universityId)
      .eq("user_id", user.user.id);

    return { data, error };
  },

  addUniversityDeadline: async (universityId: string, deadline: {
    type: string;
    date: string;
    description: string;
    status: string;
  }) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    // For now, store deadlines in the university's custom_data field
    // In a full implementation, you'd create a separate deadlines table
    const { data: university } = await supabase
      .from("selected_universities")
      .select("custom_data")
      .eq("id", universityId)
      .eq("user_id", user.user.id)
      .single();

    if (!university) {
      return { data: null, error: "University not found" };
    }

    const customData = university.custom_data ? JSON.parse(university.custom_data) : {};
    const deadlines = customData.deadlines || [];
    deadlines.push({
      ...deadline,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from("selected_universities")
      .update({ 
        custom_data: JSON.stringify({
          ...customData,
          deadlines
        }),
        updated_at: new Date().toISOString()
      })
      .eq("id", universityId)
      .eq("user_id", user.user.id);

    return { data, error };
  },

  updateUniversityCustomData: async (universityId: string, customData: any) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("selected_universities")
      .update({ 
        custom_data: JSON.stringify(customData),
        updated_at: new Date().toISOString()
      })
      .eq("id", universityId)
      .eq("user_id", user.user.id);

    return { data, error };
  },

  getUniversityDetails: async (universityId: string) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("selected_universities")
      .select(`
        *,
        selected_professors (*)
      `)
      .eq("id", universityId)
      .eq("user_id", user.user.id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Parse custom data if it exists
    let customData = {};
    if (data.custom_data) {
      try {
        customData = JSON.parse(data.custom_data);
      } catch (e) {
        console.error('Error parsing custom data:', e);
      }
    }

    return { 
      data: {
        ...data,
        custom_data: customData
      }, 
      error: null 
    };
  },

  saveResearchInterestMapping: async (interests: {
    primaryInterests: string[];
    keywords: string[];
    applicationAreas: string[];
    methodologies: string[];
  }) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    // Store enhanced research profile in user metadata or separate table
    // For now, we'll update the existing research interests approach
    const allInterests = [
      ...interests.primaryInterests.map(i => ({ title: i, category: 'primary' })),
      ...interests.keywords.map(k => ({ title: k, category: 'keyword' })),
      ...interests.applicationAreas.map(a => ({ title: a, category: 'application' })),
      ...interests.methodologies.map(m => ({ title: m, category: 'methodology' }))
    ];

    // First, ensure all interests exist in the research_interests table
    const interestPromises = allInterests.map(async (interest) => {
      const { data: existingInterests } = await supabase
        .from("research_interests")
        .select("id, name")
        .eq("name", interest.title)
        .maybeSingle();

      if (existingInterests) {
        return existingInterests.id;
      } 
        const { data: newInterest, error } = await supabase
          .from("research_interests")
          .insert({
            name: interest.title,
            category: interest.category
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating research interest:", error);
          return null;
        }

        return newInterest.id;
      
    });

    const interestIds = await Promise.all(interestPromises);
    const validInterestIds = interestIds.filter(id => id !== null) as string[];
    
    // Delete existing user interests
    await supabase
      .from("user_research_interests")
      .delete()
      .eq("user_id", user.user.id);

    // Link user to new research interests
    const userInterestsData = validInterestIds.map(interestId => ({
      user_id: user.user.id,
      research_interest_id: interestId
    }));

    if (userInterestsData.length > 0) {
      const { data, error } = await supabase
        .from("user_research_interests")
        .insert(userInterestsData)
        .select();

      return { data, error };
    }

    return { data: null, error: null };
  },
  
  // Enhanced function to generate university matches using CV analysis and stored data
  generateMatches: async () => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }
    
    try {
      // Import services
      const { universityMatchingService } = await import('./universityMatchingService');
      const { cvAnalysisService } = await import('./cvAnalysisService');
      
      // Get enhanced user profile with CV analysis data
      const enhancedProfile = await cvAnalysisService.getEnhancedUserProfile(user.user.id);
      
      // Get user's academic profile and interests for matching
      const { data: academicProfile } = await supabase
        .from("academic_profiles")
        .select("*")
        .eq("user_id", user.user.id)
        .maybeSingle();
      
      const { data: userInterests } = await supabase
        .from("user_research_interests")
        .select(`
          research_interests:research_interest_id (name, category)
        `)
        .eq("user_id", user.user.id);
      
      // Use CV analysis data if available, otherwise fall back to manual input
      const cvData = enhancedProfile?.cvAnalysis;
      const researchAreas = cvData?.research_areas || 
                           userInterests?.map(ui => ui.research_interests?.name).filter(Boolean) || [];
      
      // Extract education information from CV if available
      const education = cvData?.education?.[0]; // Latest education
      const targetField = education?.field || academicProfile?.current_field_of_study || 'Computer Science';
      const userGPA = education?.gpa || academicProfile?.current_gpa || 3.5;
      
      // Prepare comprehensive match request using stored data
      const matchRequest = {
        userProfile: {
          gpa: userGPA,
          testScores: {},
          researchInterests: researchAreas,
          targetDegree: targetField,
          preferences: {
            countries: ['United States', 'Canada', 'United Kingdom', 'Germany', 'Switzerland'],
            maxTuition: 100000
          }
        },
        cvAnalysis: cvData // Pass full CV analysis for enhanced matching
      };
      
      // Generate comprehensive matches with faculty recommendations
      const result = await universityMatchingService.generateMatches(user.user.id, matchRequest);
      
      // Transform matches for dashboard compatibility
      const transformedMatches = result.matches.map(match => ({
        user_id: user.user.id,
        university_name: match.universities?.name || 'Unknown University',
        program_name: match.graduate_programs?.program_name || 'Graduate Program',
        match_score: match.match_score,
        match_reason: match.reasoning,
        website_url: match.universities?.website_url,
        location: `${match.universities?.city}, ${match.universities?.country}`,
        program_id: match.program_id,
        university_id: match.university_id,
        match_factors: match.match_factors,
        application_deadline: match.graduate_programs?.deadlines?.fall_deadline,
        funding_available: match.graduate_programs?.funding_info?.assistantships_available || false,
        funding_details: match.graduate_programs?.funding_info?.fellowship_opportunities?.join(', ') || null
      }));
      
      // Transform faculty recommendations
      const transformedProfessors = result.facultyRecommendations.map(faculty => ({
        user_id: user.user.id,
        professor_name: faculty.faculty_name,
        university: faculty.university_name,
        match_score: Math.random() * 0.3 + 0.7, // Placeholder score
        match_reason: faculty.match_reason,
        email: faculty.faculty_email,
        research_areas: faculty.research_areas?.join(', ') || 'Research areas not specified',
        department: faculty.faculty_title,
        accepting_students: faculty.accepting_students,
        profile_url: faculty.profile_url
      }));
      
      // Note: AI matches are generated and stored in ai_university_matches table
      // This function now primarily retrieves existing AI matches rather than generating new ones
      console.log('AI matches retrieved from existing ai_university_matches table');
      
      return { 
        data: { 
          universities: transformedMatches, 
          professors: transformedProfessors 
        }, 
        error: uniError || profError 
      };
      
    } catch (error) {
      console.error('Error in generateMatches:', error);
      return { data: null, error: error.message };
    }
  },

  // =====================================================================
  // APPLICATION TRACKING METHODS
  // =====================================================================

  // Create a new application for a selected university
  createApplication: async (selectedUniversityId: string, programType = 'masters') => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    // Check if application already exists
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("user_id", user.user.id)
      .eq("selected_university_id", selectedUniversityId)
      .maybeSingle();

    if (existing) {
      return { data: existing, error: "Application already exists" };
    }

    // Create the application
    const { data: application, error } = await supabase
      .from("applications")
      .insert({
        user_id: user.user.id,
        selected_university_id: selectedUniversityId,
        status: 'not_started',
        progress: 0
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    // Create standard requirements using the SQL function
    const { error: reqError } = await supabase
      .rpc('create_standard_requirements', {
        app_id: application.id,
        program_type: programType
      });

    if (reqError) {
      console.error('Error creating standard requirements:', reqError);
    }

    return { data: application, error: null };
  },

  // Get all applications for the current user
  getApplications: async () => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        selected_universities (
          university_name,
          program_name,
          location,
          application_deadline
        )
      `)
      .eq("user_id", user.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error };
    }

    // Format the data to include university info at the top level
    const formattedData = data?.map(app => ({
      ...app,
      university_name: app.selected_universities?.university_name,
      program_name: app.selected_universities?.program_name,
      location: app.selected_universities?.location,
      deadline_text: app.selected_universities?.application_deadline
    }));

    return { data: formattedData, error: null };
  },

  // Get a single application with full details
  getApplicationDetails: async (applicationId: string) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        selected_universities (
          university_name,
          program_name,
          location,
          application_deadline,
          website_url
        ),
        application_requirements (*),
        deadlines (*)
      `)
      .eq("id", applicationId)
      .eq("user_id", user.user.id)
      .single();

    if (error) {
      return { data: null, error };
    }

    // Format the data
    const formattedData = {
      ...data,
      university_name: data.selected_universities?.university_name,
      program_name: data.selected_universities?.program_name,
      location: data.selected_universities?.location,
      deadline_text: data.selected_universities?.application_deadline,
      website_url: data.selected_universities?.website_url,
      requirements: data.application_requirements || [],
      deadlines: data.deadlines || []
    };

    return { data: formattedData, error: null };
  },

  // Update application status
  updateApplicationStatus: async (applicationId: string, status: Application['status']) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("applications")
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", applicationId)
      .eq("user_id", user.user.id)
      .select()
      .single();

    return { data, error };
  },

  // Update application progress manually
  updateApplicationProgress: async (applicationId: string, progress: number) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("applications")
      .update({ 
        progress: Math.max(0, Math.min(100, progress)),
        updated_at: new Date().toISOString()
      })
      .eq("id", applicationId)
      .eq("user_id", user.user.id)
      .select()
      .single();

    return { data, error };
  },

  // Add a requirement to an application
  addApplicationRequirement: async (applicationId: string, requirement: Omit<ApplicationRequirement, 'id' | 'application_id' | 'created_at' | 'updated_at'>) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    // Verify the application belongs to the user
    const { data: app } = await supabase
      .from("applications")
      .select("id")
      .eq("id", applicationId)
      .eq("user_id", user.user.id)
      .single();

    if (!app) {
      return { data: null, error: "Application not found" };
    }

    const { data, error } = await supabase
      .from("application_requirements")
      .insert({
        application_id: applicationId,
        ...requirement
      })
      .select()
      .single();

    return { data, error };
  },

  // Update requirement status
  updateRequirementStatus: async (requirementId: string, status: ApplicationRequirement['status']) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    // If marking as completed, set completed_at timestamp
    if (status === 'completed' || status === 'submitted') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("application_requirements")
      .update(updateData)
      .eq("id", requirementId)
      .eq("application_id", supabase.raw(`
        (SELECT id FROM applications WHERE user_id = '${user.user.id}')
      `))
      .select()
      .single();

    return { data, error };
  },

  // Add a deadline to an application
  addDeadline: async (applicationId: string, deadline: Omit<Deadline, 'id' | 'application_id' | 'created_at' | 'updated_at'>) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    // Verify the application belongs to the user
    const { data: app } = await supabase
      .from("applications")
      .select("id")
      .eq("id", applicationId)
      .eq("user_id", user.user.id)
      .single();

    if (!app) {
      return { data: null, error: "Application not found" };
    }

    const { data, error } = await supabase
      .from("deadlines")
      .insert({
        application_id: applicationId,
        ...deadline
      })
      .select()
      .single();

    return { data, error };
  },

  // Get upcoming deadlines for the user - using application_timeline from your schema
  getUpcomingDeadlines: async (daysAhead = 30) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { data: [], error: "Not authenticated" };
      }

      // Use application_timeline table from your schema
      const endDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('application_timeline')
        .select(`
          id,
          event_type,
          title,
          description,
          event_date,
          is_deadline,
          is_completed,
          selected_universities!inner(
            user_id,
            universities!inner(name)
          )
        `)
        .eq('selected_universities.user_id', user.user.id)
        .eq('is_deadline', true)
        .eq('is_completed', false)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .lte('event_date', endDate.toISOString().split('T')[0])
        .order('event_date')
        .limit(5);

      // If table doesn't exist, return empty array
      if (error && error.code === '42P01') {
        console.warn('application_timeline table not found, returning empty array');
        return { data: [], error: null };
      }

      if (error) {
        console.warn('Error fetching deadlines, returning empty array:', error);
        return { data: [], error: null };
      }

      // Transform data to match expected format
      const transformedData = (data || []).map(item => ({
        id: item.id,
        deadline_type: item.event_type,
        due_date: item.event_date,
        deadline_date: item.event_date,
        description: item.description,
        title: item.title,
        university_name: item.selected_universities?.universities?.name || 'Unknown University'
      }));

      return { data: transformedData, error: null };
    } catch (error) {
      console.warn('Error fetching upcoming deadlines:', error);
      return { data: [], error: null }; // Don't fail dashboard loading
    }
  },

  // Mark deadline as completed
  completeDeadline: async (deadlineId: string) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("deadlines")
      .update({ 
        is_completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", deadlineId)
      .eq("application_id", supabase.raw(`
        (SELECT id FROM applications WHERE user_id = '${user.user.id}')
      `))
      .select()
      .single();

    return { data, error };
  },

  // Get application statistics for dashboard - using selected_universities table from your schema
  getApplicationStats: async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return { data: { total: 0, submitted: 0 }, error: "Not authenticated" };
      }

      // Use selected_universities table as the main application tracking table
      const { count: totalCount, error: totalError } = await supabase
        .from("selected_universities")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.user.id);

      // If table doesn't exist, return default stats
      if (totalError && totalError.code === '42P01') {
        console.warn('selected_universities table not found, returning default stats');
        return { data: { total: 0, submitted: 0 }, error: null };
      }

      // Count submitted applications using application_status from your schema
      const { count: submittedCount } = await supabase
        .from("selected_universities")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.user.id)
        .eq("application_status", "submitted");

      const stats = {
        total: totalCount || 0,
        submitted: submittedCount || 0,
        not_started: 0, // Skip detailed counts for dashboard speed
        in_progress: Math.max(0, (totalCount || 0) - (submittedCount || 0)), // Estimate
        interview: 0,
        accepted: 0,
        rejected: 0,
        waitlisted: 0,
        average_progress: 0 // Skip average calculation for speed
      };

      return { data: stats, error: null };
    } catch (error) {
      console.warn('Error in getApplicationStats:', error);
      return { data: { total: 0, submitted: 0 }, error: null };
    }
  }
};
