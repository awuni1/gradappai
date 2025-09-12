import { supabase } from '@/integrations/supabase/client';
import { ChatGPTService } from './chatGptService';

export interface UniversityMatchRequest {
  id: string;
  user_id: string;
  search_query?: string;
  search_filters?: any;
  user_profile_data?: any;
  created_at?: string;
}

export interface UniversityMatchResult {
  id: string;
  request_id: string;
  university_id?: string;
  university_name: string;
  program_name: string;
  match_score: number;
  match_category: 'reach' | 'target' | 'safety';
  match_factors: any;
  location: string;
  ranking?: number;
  why_recommended: string[];
  concerns?: string[];
  website_url?: string;
  application_deadline?: string;
  tuition_cost?: number;
  created_at?: string;
}

export interface StoredMatchSession {
  request: UniversityMatchRequest;
  matches: UniversityMatchResult[];
  total_matches: number;
  session_id: string;
}

export const universityMatchingStorageService = {
  // Create a new matching request and store it
  createMatchingRequest: async (searchQuery: string, userProfileData?: any) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    try {
      // Create matching request in conversations table (reusing existing schema)
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.user.id,
          title: `University Search: ${searchQuery.slice(0, 50)}...`,
          conversation_type: 'university_search',
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating matching request:', error);
        return { data: null, error: error.message };
      }

      return { data: conversation, error: null };
    } catch (error) {
      console.error('Error in createMatchingRequest:', error);
      return { data: null, error: error.message };
    }
  },

  // Store university matches in the database
  storeUniversityMatches: async (conversationId: string, matches: UniversityMatchResult[]) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    try {
      // Store matches in university_recommendations table
      const matchRecords = matches.map(match => ({
        conversation_id: conversationId,
        message_id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        country: match.location.split(',').pop()?.trim() || 'Unknown',
        universities: [match], // Store as JSONB array
        filters_applied: {},
        recommendation_type: match.match_category,
      }));

      const { data, error } = await supabase
        .from('university_recommendations')
        .insert(matchRecords)
        .select();

      if (error) {
        console.error('Error storing university matches:', error);
        return { data: null, error: error.message };
      }

      // Also store individual matches in ai_university_matches table for analytics
      await universityMatchingStorageService.storeAIMatches(user.user.id, matches);

      return { data, error: null };
    } catch (error) {
      console.error('Error in storeUniversityMatches:', error);
      return { data: null, error: error.message };
    }
  },

  // Store AI university matches for future reference
  storeAIMatches: async (userId: string, matches: UniversityMatchResult[]) => {
    try {
      // First, check if we can find existing university IDs
      const enrichedMatches = [];
      
      for (const match of matches) {
        // Try to find existing university in database
        const { data: existingUniversity } = await supabase
          .from('universities')
          .select('id')
          .eq('name', match.university_name)
          .maybeSingle();

        enrichedMatches.push({
          user_id: userId,
          university_id: existingUniversity?.id || null,
          university_name: match.university_name,
          program_name: match.program_name,
          overall_match_score: match.match_score,
          match_category: match.match_category,
          match_factors: match.match_factors || {},
          reasoning: match.why_recommended.join('. '),
          concerns: match.concerns?.join('. ') || null,
          location: match.location,
          ranking: match.ranking || null,
          application_deadline: match.application_deadline || null,
          tuition_estimate: match.tuition_cost || null,
          website_url: match.website_url || null,
        });
      }

      // Store in ai_university_matches table
      const { data, error } = await supabase
        .from('ai_university_matches')
        .insert(enrichedMatches)
        .select();

      if (error) {
        console.warn('Could not store AI matches (table may not exist):', error);
      }

      return { data, error: null };
    } catch (error) {
      console.warn('Error storing AI matches:', error);
      return { data: null, error: null };
    }
  },

  // Get stored matches for a conversation
  getStoredMatches: async (conversationId: string): Promise<{ data: UniversityMatchResult[] | null, error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('university_recommendations')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error retrieving stored matches:', error);
        return { data: null, error: error.message };
      }

      // Flatten universities from all recommendations
      const allMatches: UniversityMatchResult[] = [];
      data?.forEach(rec => {
        if (rec.universities && Array.isArray(rec.universities)) {
          allMatches.push(...rec.universities.map(uni => ({
            ...uni,
            id: uni.id || `stored_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            request_id: conversationId,
          })));
        }
      });

      return { data: allMatches, error: null };
    } catch (error) {
      console.error('Error in getStoredMatches:', error);
      return { data: null, error: error.message };
    }
  },

  // Get user's match history
  getUserMatchHistory: async (limit = 10) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          university_recommendations!inner(count)
        `)
        .eq('user_id', user.user.id)
        .eq('conversation_type', 'university_search')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting match history:', error);
        return { data: [], error: null };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getUserMatchHistory:', error);
      return { data: [], error: null };
    }
  },

  // Generate comprehensive university matches using ChatGPT with real database data
  generateComprehensiveMatches: async (searchQuery: string, minMatches = 10): Promise<{ data: UniversityMatchResult[] | null, error: string | null }> => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    try {
      console.log('🤖 Generating matches using ChatGPT with real database universities...');
      
      // Get user's complete profile for matching
      const userProfile = await universityMatchingStorageService.getUserCompleteProfile(user.user.id);
      console.log('👤 User profile loaded:', { gpa: userProfile.gpa, field: userProfile.field, researchInterests: userProfile.researchInterests });
      
      // Get ALL universities from database (simplified query to test what exists)
      console.log('🔍 Testing basic university table access...');
      const { data: testUnis, error: testError } = await supabase
        .from('universities')
        .select('id, name')
        .limit(5);
      
      console.log('🔍 Basic university test result:', { count: testUnis?.length || 0, error: testError?.message });
      
      // Get universities with flexible query based on actual schema
      const { data: universities, error: uniError } = await supabase
        .from('universities')
        .select(`
          id,
          name,
          city,
          country,
          ranking_global,
          ranking_national,
          acceptance_rate,
          tuition_international,
          website_url,
          description,
          specialties
        `)
        .limit(20); // Reduce to top 20 universities for faster processing

      if (uniError) {
        console.error('❌ Error fetching universities from database:', uniError);
        return { data: null, error: `Database error: ${uniError.message}` };
      }

      if (!universities || universities.length === 0) {
        console.error('❌ No universities found in database');
        return { data: null, error: "No universities found in database. Please populate the universities table." };
      }

      console.log(`📊 Found ${universities.length} universities in database`);

      // Use ChatGPT to generate intelligent matches with strong reasoning
      const matches = await universityMatchingStorageService.generateChatGPTMatches(universities, userProfile, searchQuery, minMatches);
      
      if (matches.length < minMatches) {
        console.warn(`⚠️ ChatGPT generated ${matches.length} matches, but ${minMatches} requested.`);
      }
      
      console.log(`✅ Generated ${matches.length} ChatGPT-powered university matches`);
      return { data: matches, error: null };
    } catch (error) {
      console.error('❌ Error generating comprehensive matches:', error);
      return { data: null, error: error.message };
    }
  },

  // Get user's complete profile including CV analysis and onboarding data
  getUserCompleteProfile: async (userId: string) => {
    try {
      console.log(`👤 Getting complete profile for user: ${userId}`);
      
      // Get user basic profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get academic profile (onboarding data)
      const { data: academicProfile } = await supabase
        .from('academic_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get latest CV analysis data (remove status filter to avoid 406 enum error)
      const { data: cvAnalysis } = await supabase
        .from('cv_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get research interests
      const { data: researchInterests } = await supabase
        .from('user_research_interests')
        .select(`
          research_interests!inner(
            name,
            category
          )
        `)
        .eq('user_id', userId);

      const researchAreas = researchInterests?.map(ri => ri.research_interests?.name).filter(Boolean) || [];

      // Build comprehensive profile using REAL data from database
      const completeProfile = {
        // User basic info
        userProfile: userProfile || {},
        
        // Academic/onboarding data  
        academicProfile: academicProfile || {},
        
        // CV analysis data
        cvAnalysis: cvAnalysis || {},
        
        // Research interests
        researchInterests: researchAreas,
        
        // Core matching data - prioritize CV analysis, then academic profile, then defaults
        gpa: cvAnalysis?.personal_info?.gpa || 
              academicProfile?.current_gpa || 
              (cvAnalysis?.education?.[0]?.gpa ? parseFloat(cvAnalysis.education[0].gpa) : null) ||
              3.5,
              
        field: academicProfile?.current_field_of_study || 
               cvAnalysis?.education?.[0]?.field ||
               academicProfile?.target_field_of_study ||
               'General Studies',
               
        degree: academicProfile?.current_degree ||
                cvAnalysis?.education?.[0]?.degree ||
                academicProfile?.target_degree_level ||
                'Masters',
                
        // Test scores from academic profile or CV
        greVerbal: academicProfile?.gre_verbal || 
                   cvAnalysis?.test_scores?.gre_verbal || 
                   160,
                   
        greQuantitative: academicProfile?.gre_quantitative || 
                        cvAnalysis?.test_scores?.gre_quantitative || 
                        165,
                        
        toefl: academicProfile?.toefl_score || 
               cvAnalysis?.test_scores?.toefl ||
               null,
               
        ielts: academicProfile?.ielts_score || 
               cvAnalysis?.test_scores?.ielts ||
               null,
               
        // Experience and background
        workExperience: cvAnalysis?.work_experience || 
                       academicProfile?.work_experience ||
                       [],
                       
        researchExperience: cvAnalysis?.research || 
                           academicProfile?.research_experience ||
                           [],
                           
        publications: cvAnalysis?.publications || 
                     academicProfile?.publications ||
                     [],
                     
        // Skills from CV
        technicalSkills: cvAnalysis?.skills?.technical || 
                        academicProfile?.technical_skills ||
                        [],
                        
        programmingLanguages: cvAnalysis?.skills?.programming || 
                             academicProfile?.programming_languages ||
                             [],
                             
        // Career goals and preferences
        careerGoals: academicProfile?.career_goals || 
                    cvAnalysis?.career_goals ||
                    null,
                    
        targetIndustries: academicProfile?.target_industries ||
                         [],
                         
        preferredLocations: academicProfile?.preferred_work_locations ||
                           ['United States'],
                           
        // Calculate profile completeness
        profileCompleteness: universityMatchingStorageService.calculateProfileCompleteness({
          hasCV: Boolean(cvAnalysis),
          hasAcademicProfile: Boolean(academicProfile),
          hasResearchInterests: researchAreas.length > 0,
          hasGPA: Boolean(cvAnalysis?.personal_info?.gpa || academicProfile?.current_gpa),
          hasTestScores: Boolean(academicProfile?.gre_verbal || academicProfile?.gre_quantitative),
          hasExperience: Boolean(cvAnalysis?.work_experience?.length || cvAnalysis?.research?.length)
        })
      };

      console.log(`✅ Complete profile loaded:`, {
        hasUserProfile: Boolean(userProfile),
        hasAcademicProfile: Boolean(academicProfile),
        hasCVAnalysis: Boolean(cvAnalysis),
        researchInterestsCount: researchAreas.length,
        field: completeProfile.field,
        gpa: completeProfile.gpa,
        degree: completeProfile.degree,
        profileCompleteness: completeProfile.profileCompleteness
      });

      return completeProfile;
      
    } catch (error) {
      console.error('❌ Error getting complete profile:', error);
      
      // Return empty profile to avoid crashes - ChatGPT will handle the lack of data
      return {
        userProfile: {},
        academicProfile: {},
        cvAnalysis: {},
        researchInterests: [],
        gpa: null,
        field: 'General Studies',
        degree: 'Masters',
        greVerbal: null,
        greQuantitative: null,
        toefl: null,
        ielts: null,
        workExperience: [],
        researchExperience: [],
        publications: [],
        technicalSkills: [],
        programmingLanguages: [],
        careerGoals: null,
        targetIndustries: [],
        preferredLocations: ['United States'],
        profileCompleteness: 20 // Low completeness for error case
      };
    }
  },

  // Calculate profile completeness score
  calculateProfileCompleteness: (factors: {
    hasCV: boolean;
    hasAcademicProfile: boolean;
    hasResearchInterests: boolean;
    hasGPA: boolean;
    hasTestScores: boolean;
    hasExperience: boolean;
  }): number => {
    let score = 0;
    if (factors.hasCV) score += 25;
    if (factors.hasAcademicProfile) score += 20;
    if (factors.hasResearchInterests) score += 15;
    if (factors.hasGPA) score += 15;
    if (factors.hasTestScores) score += 15;
    if (factors.hasExperience) score += 10;
    return Math.min(100, score);
  },

  // Calculate match scores using ONLY real database universities
  calculateRealMatches: async (universities: any[], userProfile: any, searchQuery: string, minMatches: number): Promise<UniversityMatchResult[]> => {
    const matches: UniversityMatchResult[] = [];
    
    console.log(`🔍 Analyzing ${universities.length} universities from database...`);
    
    for (const uni of universities) {
      if (uni.university_programs && Array.isArray(uni.university_programs)) {
        for (const program of uni.university_programs) {
          const match = universityMatchingStorageService.calculateSingleMatch(uni, program, userProfile, searchQuery);
          if (match) {
            matches.push(match);
          }
        }
      }
    }

    console.log(`📊 Generated ${matches.length} potential matches`);

    // Sort by match score
    matches.sort((a, b) => b.match_score - a.match_score);
    
    // If we have fewer than minMatches, we need more universities in the database
    if (matches.length < minMatches) {
      console.warn(`⚠️ Database only provided ${matches.length} matches, but ${minMatches} requested. Consider adding more universities to the database.`);
    }

    // Return top matches (ensure we get at least what we can from real data)
    const finalMatches = universityMatchingStorageService.categorizeMatches(matches.slice(0, Math.max(matches.length, minMatches)));
    console.log(`✅ Returning ${finalMatches.length} categorized matches`);
    
    return finalMatches;
  },

  // Generate ChatGPT-powered university matches with strong reasoning
  generateChatGPTMatches: async (universities: any[], userProfile: any, searchQuery: string, minMatches: number): Promise<UniversityMatchResult[]> => {
    const startTime = Date.now();
    try {
      console.log(`🤖 Using ChatGPT for intelligent university matching (${universities.length} universities)...`);
      
      // OPTIMIZATION: Limit universities to top 30 to reduce prompt size and improve speed
      const topUniversities = universities
        .filter(uni => uni.university_programs && uni.university_programs.length > 0)
        .sort((a, b) => (a.ranking_global || 999) - (b.ranking_global || 999))
        .slice(0, 30);

      console.log(`📊 Optimized to ${topUniversities.length} top universities for faster matching`);
      
      // OPTIMIZATION: Simplified university data for ChatGPT (reduce prompt size by 80%)
      const universitySummary = topUniversities.map(uni => ({
        id: uni.id,
        name: uni.name,
        location: `${uni.city}, ${uni.country}`,
        ranking: uni.ranking_global || 'Unranked',
        acceptance_rate: uni.acceptance_rate ? `${(uni.acceptance_rate * 100).toFixed(1)}%` : 'N/A',
        tuition: uni.tuition_international ? `$${Math.round(uni.tuition_international).toLocaleString()}` : 'N/A',
        programs: uni.university_programs.slice(0, 3).map(p => ({ // Limit to top 3 programs
          name: p.name,
          level: p.degree_level,
          min_gpa: p.min_gpa || 'N/A',
          research: Array.isArray(p.research_areas) ? p.research_areas.slice(0, 2).join(', ') : (p.research_areas || 'General')
        }))
      }));

      // Build comprehensive user profile for ChatGPT
      const cvData = userProfile.userProfile || {};
      const academicData = userProfile.academicProfile || {};
      
      // ULTRA-OPTIMIZED: Minimal prompt for sub-10-second response
      const prompt = `Match student to ${Math.max(minMatches, 12)} universities. Student: ${userProfile.field || 'CS'} GPA:${userProfile.gpa || '3.5'}

Universities: ${universitySummary.slice(0, 12).map(uni => uni.name).join(', ')}

[{"university_name":"Name","program_name":"Program","match_score":85,"match_category":"target","why_recommended":["reason"]}]`;

      console.log(`📤 Sending optimized matching request to ChatGPT (prompt size: ${prompt.length} chars)...`);
      
      // OPTIMIZATION: Fast ChatGPT call with reduced timeout and optimized settings
      const response = await universityMatchingStorageService.callChatGPTForMatching(prompt);

      console.log('📥 Received response from ChatGPT');

      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('ChatGPT did not return valid JSON array format');
      }

      const chatGPTMatches = JSON.parse(jsonMatch[0]);
      const matchingDuration = Date.now() - startTime;
      console.log(`✅ ChatGPT recommended ${chatGPTMatches.length} universities in ${matchingDuration}ms (required: ${Math.max(minMatches, 12)})`);

      // Validate we got the required number of matches
      if (chatGPTMatches.length < Math.max(minMatches, 12)) {
        console.warn(`⚠️ ChatGPT returned ${chatGPTMatches.length} matches, but ${Math.max(minMatches, 12)} required. Requesting more...`);
        
        // Try to get additional matches if needed
        if (chatGPTMatches.length < minMatches) {
          const additionalNeeded = Math.max(minMatches, 12) - chatGPTMatches.length;
          const additionalMatches = await universityMatchingStorageService.getAdditionalChatGPTMatches(universities, userProfile, additionalNeeded, chatGPTMatches);
          chatGPTMatches.push(...additionalMatches);
          console.log(`✅ Total matches after additional request: ${chatGPTMatches.length}`);
        }
      }

      // Convert ChatGPT response to UniversityMatchResult format
      const matches: UniversityMatchResult[] = chatGPTMatches.map((match: any, index: number) => ({
        id: `chatgpt_match_${match.university_id}_${match.program_id}_${Date.now()}_${index}`,
        request_id: '',
        university_name: match.university_name,
        program_name: match.program_name,
        match_score: match.match_score / 100, // Convert percentage to decimal
        match_category: match.match_category as 'reach' | 'target' | 'safety',
        match_factors: {
          chatgpt_generated: true,
          university_id: match.university_id,
          program_id: match.program_id,
          research_alignment: match.research_alignment,
          gpa_analysis: match.gpa_analysis,
          unique_strengths: match.unique_strengths
        },
        location: match.location,
        ranking: match.ranking,
        why_recommended: match.why_recommended || [],
        concerns: match.concerns || [],
        website_url: match.website_url,
        application_deadline: match.application_deadline,
        tuition_cost: match.tuition_cost
      }));

      // Sort by match score (descending)
      matches.sort((a, b) => b.match_score - a.match_score);

      console.log(`🎯 Processed ${matches.length} ChatGPT matches successfully`);
      return matches;

    } catch (error) {
      console.error('❌ Error in ChatGPT university matching:', error);
      
      // Fallback to basic matching if ChatGPT fails
      console.log('🔄 Falling back to basic matching algorithm...');
      return await universityMatchingStorageService.calculateRealMatches(universities, userProfile, searchQuery, minMatches);
    }
  },

  // Get additional ChatGPT matches when first request doesn't return enough
  getAdditionalChatGPTMatches: async (universities: any[], userProfile: any, needed: number, existingMatches: any[]): Promise<any[]> => {
    try {
      console.log(`🔄 Requesting ${needed} additional university matches from ChatGPT...`);
      
      const existingUniversityNames = existingMatches.map(m => m.university_name.toLowerCase());
      const availableUniversities = universities.filter(uni => 
        !existingUniversityNames.includes(uni.name.toLowerCase())
      );
      
      const cvData = userProfile.userProfile || {};
      const academicData = userProfile.academicProfile || {};
      
      const additionalPrompt = `You are an expert graduate school admissions counselor with expertise in ALL academic fields. I need EXACTLY ${needed} MORE university recommendations for this student based on their complete database profile.

COMPREHENSIVE STUDENT PROFILE (from database):
- Field: ${userProfile.field || 'Not specified'}
- Degree: ${userProfile.degree || 'Not specified'}
- GPA: ${userProfile.gpa || 'Not specified'} 
- Research Interests: ${userProfile.researchInterests?.join(', ') || 'Not specified'}
- Test Scores: GRE V${userProfile.greVerbal || 'N/A'} Q${userProfile.greQuantitative || 'N/A'}, TOEFL ${userProfile.toefl || 'N/A'}
- Experience: Work(${userProfile.workExperience?.length || 0}), Research(${userProfile.researchExperience?.length || 0}), Pubs(${userProfile.publications?.length || 0})
- Career Goals: ${userProfile.careerGoals || 'Not specified'}

UNIVERSITIES ALREADY RECOMMENDED: 
${existingMatches.map(m => m.university_name).join(', ')}

REMAINING AVAILABLE UNIVERSITIES:
${JSON.stringify(availableUniversities.slice(0, 30), null, 2)}

REQUIREMENTS:
1. You MUST recommend EXACTLY ${needed} universities - NO MORE, NO LESS
2. DO NOT repeat any universities from the "already recommended" list
3. Each university MUST exist in the "remaining available universities" list
4. Work with ANY academic field - not limited to STEM or Computer Science
5. Be creative - look at related fields, interdisciplinary programs, adjacent disciplines
6. Include various competitiveness levels (reach, target, safety)
7. Match based on student's ACTUAL field and interests from database data

Return ONLY a JSON array with EXACTLY ${needed} universities:
[
  {
    "university_id": "database_id",
    "university_name": "Exact name from available list",
    "program_id": "program_id",
    "program_name": "Specific program name",
    "match_score": 75,
    "match_category": "target",
    "location": "City, Country",
    "ranking": 100,
    "why_recommended": [
      "Detailed reason 1",
      "Detailed reason 2", 
      "Detailed reason 3",
      "Detailed reason 4"
    ],
    "concerns": [
      "Specific concern 1",
      "Specific concern 2"
    ],
    "research_alignment": "How research aligns",
    "admission_probability": 65,
    "website_url": "url_if_available", 
    "application_deadline": "deadline_if_available",
    "tuition_cost": estimated_cost,
    "gpa_analysis": "GPA comparison",
    "unique_strengths": "Unique program strengths"
  }
]`;

      const response = await universityMatchingStorageService.callChatGPTForMatching(additionalPrompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        console.error('❌ Additional ChatGPT request did not return valid JSON');
        return [];
      }

      const additionalMatches = JSON.parse(jsonMatch[0]);
      console.log(`✅ Got ${additionalMatches.length} additional matches from ChatGPT`);
      
      return additionalMatches.slice(0, needed); // Ensure we don't get more than needed
      
    } catch (error) {
      console.error('❌ Error getting additional ChatGPT matches:', error);
      return [];
    }
  },

  // OPTIMIZED: Fast ChatGPT API call for university matching
  callChatGPTForMatching: async (prompt: string): Promise<string> => {
    const startTime = Date.now();
    const config = {
      apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY,
      endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || import.meta.env.VITE_OPENAI_ENDPOINT,
      model: 'gpt-4o-mini' // Fast model for quick responses
    };
    
    if (!config.apiKey || !config.endpoint) {
      throw new Error('ChatGPT API configuration is required for university matching');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // MAXIMUM SPEED: 10-second timeout

    try {
      console.log('⏱️ Starting ChatGPT API call...');
      
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.apiKey,
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a fast graduate admissions expert. Provide concise, accurate university recommendations. Return only valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // MAXIMUM SPEED: Minimum temperature for fastest response
          top_p: 0.8,       // MAXIMUM SPEED: Further reduced for speed
          max_tokens: 1500, // MAXIMUM SPEED: Much lower token limit for speed
          model: config.model,
          stream: false     // OPTIMIZED: Ensure non-streaming for consistency
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ ChatGPT API call completed in ${duration}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ChatGPT API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from ChatGPT API response');
      }
      
      console.log(`✅ Received response (${content.length} chars) in ${duration}ms`);
      return content;

    } catch (error) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        throw new Error(`ChatGPT university matching timed out after ${duration}ms. Try again with a smaller request.`);
      }
      
      console.error(`❌ ChatGPT API failed after ${duration}ms:`, error);
      throw error;
    }
  },

  // Calculate match score for a single university-program combination using real user CV data
  calculateSingleMatch: (university: any, program: any, userProfile: any, searchQuery: string): UniversityMatchResult | null => {
    let matchScore = 0.4; // Lower base score, build it up based on actual matches
    const whyRecommended: string[] = [];
    const concerns: string[] = [];

    console.log(`🔍 Analyzing ${university.name} - ${program.name} for user...`);

    // GPA matching (25% weight)
    if (program.min_gpa && userProfile.gpa) {
      const gpaRatio = userProfile.gpa / program.min_gpa;
      if (gpaRatio >= 1.1) {
        matchScore += 0.25;
        whyRecommended.push(`Your GPA (${userProfile.gpa}) exceeds minimum requirement (${program.min_gpa})`);
      } else if (gpaRatio >= 1.0) {
        matchScore += 0.20;
        whyRecommended.push(`Your GPA (${userProfile.gpa}) meets minimum requirement (${program.min_gpa})`);
      } else if (gpaRatio >= 0.9) {
        matchScore += 0.10;
        concerns.push(`GPA slightly below minimum: ${program.min_gpa} required, you have ${userProfile.gpa}`);
      } else {
        matchScore += 0.05;
        concerns.push(`GPA below requirement: ${program.min_gpa} required, you have ${userProfile.gpa}`);
      }
    } else if (program.preferred_gpa && userProfile.gpa) {
      const gpaRatio = userProfile.gpa / program.preferred_gpa;
      if (gpaRatio >= 1.0) {
        matchScore += 0.20;
        whyRecommended.push(`Your GPA (${userProfile.gpa}) meets preferred GPA (${program.preferred_gpa})`);
      } else {
        matchScore += 0.10;
        concerns.push(`Preferred GPA is ${program.preferred_gpa}, you have ${userProfile.gpa}`);
      }
    } else {
      matchScore += 0.15; // Assume neutral if no GPA data
    }

    // Field matching (30% weight)
    let fieldMatchScore = 0;
    if (userProfile.field && program.name) {
      const userFieldLower = userProfile.field.toLowerCase();
      const programNameLower = program.name.toLowerCase();
      
      if (programNameLower.includes(userFieldLower) || userFieldLower.includes(programNameLower.split(' ')[0])) {
        fieldMatchScore += 0.25;
        whyRecommended.push(`Perfect field match: ${program.name} aligns with your ${userProfile.field} background`);
      } else if (program.research_areas && Array.isArray(program.research_areas)) {
        for (const area of program.research_areas) {
          if (area.toLowerCase().includes(userFieldLower) || userFieldLower.includes(area.toLowerCase())) {
            fieldMatchScore += 0.15;
            whyRecommended.push(`Research area alignment: ${area} matches your field`);
            break;
          }
        }
      }
      
      // Check university specialties
      if (university.specialties && Array.isArray(university.specialties)) {
        for (const specialty of university.specialties) {
          if (specialty.toLowerCase().includes(userFieldLower) || userFieldLower.includes(specialty.toLowerCase())) {
            fieldMatchScore += 0.10;
            whyRecommended.push(`University specialty match: ${specialty}`);
            break;
          }
        }
      }
    }
    matchScore += Math.min(fieldMatchScore, 0.30);

    // Research interests matching (20% weight)
    let researchMatchScore = 0;
    if (userProfile.researchInterests && userProfile.researchInterests.length > 0 && program.research_areas) {
      const programAreas = Array.isArray(program.research_areas) ? program.research_areas : [program.research_areas];
      
      for (const userInterest of userProfile.researchInterests) {
        for (const programArea of programAreas) {
          if (typeof userInterest === 'string' && typeof programArea === 'string') {
            if (programArea.toLowerCase().includes(userInterest.toLowerCase()) || 
                userInterest.toLowerCase().includes(programArea.toLowerCase())) {
              researchMatchScore += 0.05;
              whyRecommended.push(`Research alignment: ${userInterest} matches ${programArea}`);
            }
          }
        }
      }
    }
    matchScore += Math.min(researchMatchScore, 0.20);

    // GRE matching (10% weight)
    if (program.gre_required && userProfile.greVerbal && userProfile.greQuantitative) {
      let greMatch = 0;
      if (program.min_gre_verbal && userProfile.greVerbal >= program.min_gre_verbal) {
        greMatch += 0.05;
        whyRecommended.push(`GRE Verbal score (${userProfile.greVerbal}) meets requirement`);
      }
      if (program.min_gre_quantitative && userProfile.greQuantitative >= program.min_gre_quantitative) {
        greMatch += 0.05;
        whyRecommended.push(`GRE Quantitative score (${userProfile.greQuantitative}) meets requirement`);
      }
      matchScore += greMatch;
    } else if (program.gre_required) {
      concerns.push('GRE scores required but not found in your profile');
    }

    // Search query relevance (5% weight)
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      if (university.name.toLowerCase().includes(queryLower) || 
          program.name.toLowerCase().includes(queryLower)) {
        matchScore += 0.05;
        whyRecommended.push('Matches your search criteria');
      }
    }

    // University ranking bonus (10% weight)
    if (university.ranking_global) {
      if (university.ranking_global <= 50) {
        matchScore += 0.10;
        whyRecommended.push(`Top 50 globally ranked university (#${university.ranking_global})`);
      } else if (university.ranking_global <= 100) {
        matchScore += 0.08;
        whyRecommended.push(`Top 100 globally ranked university (#${university.ranking_global})`);
      } else if (university.ranking_global <= 200) {
        matchScore += 0.05;
        whyRecommended.push(`Well-ranked university (#${university.ranking_global} globally)`);
      }
    }

    // Tuition considerations
    if (university.tuition_international) {
      if (university.tuition_international > 50000) {
        concerns.push(`High tuition cost: $${Math.round(university.tuition_international).toLocaleString()}/year`);
      }
    }

    // Filter out very low matches (less than 50%)
    if (matchScore < 0.5) {
      console.log(`❌ Low match score (${Math.round(matchScore * 100)}%) for ${university.name} - ${program.name}`);
      return null;
    }

    const result = {
      id: `match_${university.id}_${program.id}_${Date.now()}`,
      request_id: '',
      university_name: university.name,
      program_name: program.name,
      match_score: Math.min(0.98, Math.max(0.5, matchScore)), // Clamp between 50%-98%
      match_category: 'target' as 'reach' | 'target' | 'safety', // Will be recategorized later
      match_factors: {
        gpa_match: program.min_gpa ? (userProfile.gpa >= program.min_gpa) : true,
        field_match: fieldMatchScore > 0,
        research_match: researchMatchScore > 0,
        ranking: university.ranking_global,
        university_id: university.id,
        program_id: program.id
      },
      location: `${university.city}, ${university.country}`,
      ranking: university.ranking_global,
      why_recommended: whyRecommended.slice(0, 4), // Top 4 reasons
      concerns: concerns.slice(0, 3), // Top 3 concerns
      website_url: university.website_url,
      application_deadline: program.deadline_fall,
      tuition_cost: university.tuition_international || program.tuition_annual,
    };

    console.log(`✅ Match score ${Math.round(matchScore * 100)}% for ${university.name} - ${program.name}`);
    return result;
  },


  // Categorize matches into reach, target, safety
  categorizeMatches: (matches: UniversityMatchResult[]): UniversityMatchResult[] => {
    const sortedMatches = [...matches].sort((a, b) => b.match_score - a.match_score);
    
    return sortedMatches.map((match, index) => {
      const percentile = index / sortedMatches.length;
      
      if (percentile <= 0.3) {
        match.match_category = 'reach';
      } else if (percentile <= 0.7) {
        match.match_category = 'target';
      } else {
        match.match_category = 'safety';
      }
      
      return match;
    });
  },

  // Clear old matches to prevent database bloat
  cleanupOldMatches: async (daysOld = 30) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { data: null, error: "Not authenticated" };
    }

    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
      
      // Delete old conversations and their related data
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.user.id)
        .eq('conversation_type', 'university_search')
        .lt('created_at', cutoffDate);

      if (error) {
        console.warn('Error cleaning up old matches:', error);
      }

      return { data: null, error: null };
    } catch (error) {
      console.warn('Error in cleanupOldMatches:', error);
      return { data: null, error: null };
    }
  },
};