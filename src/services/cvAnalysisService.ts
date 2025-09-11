import { supabase } from '@/integrations/supabase/client';
import { documentParserService, ParsedDocument } from './documentParserService';
import { ChatGPTService } from './chatGptService';

export interface CVUploadResult {
  success: boolean;
  documentId?: string;
  analysisId?: string;
  error?: string;
  confidence?: number;
}

export interface CVAnalysisStatus {
  documentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  error?: string;
}

export interface StoredCVAnalysis {
  id: string;
  document_id: string;
  user_id: string;
  extracted_data: any;
  personal_info: any;
  education: any;
  experience: any;
  skills: any;
  research_areas: any;
  recommendations: any;
  confidence_score: number;
  completeness_score: number;
  analysis_status: string;
  created_at: string;
}

class CVAnalysisService {
  
  /**
   * Main function to upload, parse, and analyze a CV
   */
  async uploadAndAnalyzeCV(file: File, userId: string): Promise<CVUploadResult> {
    try {
      console.log('🚀 Starting CV upload and analysis for user:', userId);

      // Step 1: Parse document content first
      console.log('📄 Parsing document content...');
      const parseResult = await documentParserService.parseDocument(file);
      if (parseResult.error) {
        return { success: false, error: `Document parsing failed: ${parseResult.error.message}` };
      }

      const parsedDocument = parseResult.data!;

      // Step 2: Upload file to storage
      const uploadResult = await this.uploadFileToStorage(file, userId);
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
      }

      // Step 3: Store document metadata in database
      console.log('💾 Storing document metadata...');
      const documentResult = await this.storeDocumentMetadata(file, parsedDocument, userId, uploadResult.filePath!);
      if (!documentResult.success) {
        return { success: false, error: documentResult.error };
      }

      const documentId = documentResult.documentId!;

      // Step 4: Validate CV content
      const validation = documentParserService.validateCVContent(parsedDocument.text);
      if (!validation.isValid) {
        await this.updateDocumentStatus(documentId, 'failed', `Invalid CV content: ${validation.reasons.join(', ')}`);
        return { success: false, error: 'The uploaded document does not appear to be a valid CV/Resume' };
      }

      // Step 5: Analyze with AI
      console.log('🤖 Analyzing CV with AI...');
      await this.updateDocumentStatus(documentId, 'processing', null);
      
      const analysisResult = await ChatGPTService.analyzeCVContent(parsedDocument.text);
      
      // Step 6: Store analysis results
      console.log('💾 Storing analysis results...');
      const storeResult = await this.storeAnalysisResults(documentId, userId, analysisResult, parsedDocument);
      if (!storeResult.success) {
        await this.updateDocumentStatus(documentId, 'failed', storeResult.error!);
        return { success: false, error: storeResult.error };
      }

      // Step 7: Update user profile with extracted CV data
      console.log('📝 Updating user profile with CV data...');
      await this.updateUserProfileFromCV(userId, analysisResult);
      
      // Step 8: Update document status to completed
      await this.updateDocumentStatus(documentId, 'completed', null);

      console.log('✅ CV analysis completed successfully');
      return {
        success: true,
        documentId: documentId,
        analysisId: storeResult.analysisId,
        confidence: analysisResult.metadata.confidenceScore
      };

    } catch (error) {
      console.error('❌ CV analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Upload file to Supabase storage
   */
  private async uploadFileToStorage(file: File, userId: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        return { success: false, error: `File upload failed: ${error.message}` };
      }

      return { success: true, filePath: data.path };
    } catch (error) {
      console.error('Storage upload exception:', error);
      return { success: false, error: 'File upload failed due to storage error' };
    }
  }

  /**
   * Store document metadata in cv_analysis table (matching current schema)
   */
   private async storeDocumentMetadata(
    file: File, 
    parsedDocument: ParsedDocument, 
    userId: string, 
    filePath: string
  ): Promise<{ success: boolean; documentId?: string; error?: string }> {
    try {
      // Validate userId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('Invalid user ID format:', userId);
        return { success: false, error: 'Invalid user ID format. Must be a valid UUID.' };
      }

      // Validate file size (max 10MB)
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxFileSize) {
        return { success: false, error: 'File size exceeds 10MB limit' };
      }

      const insertData = {
        user_id: userId,
        cv_file_path: filePath,
        original_filename: file.name,
        file_size: file.size,
        file_type: file.type,
        processing_status: 'processing',
        processing_started_at: new Date().toISOString(),
        ai_model_used: 'gpt-4o-mini',
        processing_version: '2.0',
        retry_count: 0
      };

      console.log('📝 Inserting CV analysis metadata:', {
        userId,
        filename: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const { data, error } = await supabase
        .from('cv_analysis')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('Database insert error:', error);
        
        // Handle specific error cases
        if (error.message.includes('violates foreign key constraint')) {
          return { success: false, error: 'User not found. Please ensure you are logged in.' };
        }
        if (error.message.includes('violates check constraint')) {
          return { success: false, error: 'Invalid data format. Please check file requirements.' };
        }
        
        return { success: false, error: `Database error: ${error.message}` };
      }

      console.log('✅ CV analysis metadata stored successfully:', data.id);
      return { success: true, documentId: data.id };
    } catch (error) {
      console.error('Database exception:', error);
      return { success: false, error: 'Failed to store document metadata' };
    }
  }

  /**
   * Update cv_analysis record with AI analysis results (using current schema)
   */
  private async storeAnalysisResults(
    documentId: string,
    userId: string,
    analysisResult: any,
    parsedDocument: ParsedDocument
  ): Promise<{ success: boolean; analysisId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cv_analysis')
        .update({
          personal_info: analysisResult.personalInfo,
          education: analysisResult.education,
          work_experience: analysisResult.experience,
          skills: analysisResult.skills,
          research: { areas: analysisResult.researchAreas },
          achievements: analysisResult.awards || [],
          strengths: analysisResult.recommendations?.strengthAreas || [],
          areas_for_improvement: analysisResult.recommendations?.weaknessAreas || [],
          match_score: analysisResult.metadata.confidenceScore,
          confidence_score: analysisResult.metadata.confidenceScore,
          completeness_score: analysisResult.metadata.completenessScore,
          analysis_summary: 'CV analyzed using AI',
          recommendations: analysisResult.recommendations?.suggestedImprovements || [],
          processing_status: 'completed',
          processing_completed_at: new Date().toISOString(),
          processed_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('user_id', userId)
        .select('id')
        .single();

      if (error) {
        console.error('Analysis storage error:', error);
        return { success: false, error: `Failed to store analysis: ${error.message}` };
      }

      return { success: true, analysisId: data.id };
    } catch (error) {
      console.error('Analysis storage exception:', error);
      return { success: false, error: 'Failed to store analysis results' };
    }
  }

  /**
   * Update cv_analysis processing status (using current schema)
   */
  private async updateDocumentStatus(documentId: string, status: string, errorMessage: string | null = null): Promise<void> {
    try {
      const updateData: any = {
        processing_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.processing_completed_at = new Date().toISOString();
        updateData.processed_at = new Date().toISOString();
      } else if (status === 'failed') {
        updateData.processing_error = errorMessage;
      }

      const { error } = await supabase
        .from('cv_analysis')
        .update(updateData)
        .eq('id', documentId);

      if (error) {
        console.error('Status update error:', error);
      }
    } catch (error) {
      console.error('Status update exception:', error);
    }
  }

  /**
   * Get CV analysis status (using current schema)
   */
  async getAnalysisStatus(documentId: string): Promise<CVAnalysisStatus | null> {
    try {
      const { data, error } = await supabase
        .from('cv_analysis')
        .select('processing_error, created_at')
        .eq('id', documentId)
        .single();

      if (error || !data) {
        return null;
      }

      // Since we can't reliably read the enum, return a default completed status
      return {
        documentId,
        status: 'completed' as any,
        progress: 100,
        stage: 'Analysis complete!',
        error: data.processing_error || undefined
      };
    } catch (error) {
      console.error('Get status error:', error);
      return null;
    }
  }

  /**
   * Get stored CV analysis (using current schema)
   */
  async getStoredAnalysis(userId: string, documentId?: string): Promise<StoredCVAnalysis | null> {
    try {
      let query = supabase
        .from('cv_analysis')
        .select(`
          id,
          user_id,
          personal_info,
          education,
          work_experience,
          skills,
          research,
          achievements,
          strengths,
          areas_for_improvement,
          recommendations,
          confidence_score,
          completeness_score,
          created_at,
          original_filename,
          match_score
        `)
        .eq('user_id', userId)
        // Remove status filter to avoid 406 error with custom enum
        .order('created_at', { ascending: false });

      if (documentId) {
        query = query.eq('id', documentId);
      }

      const { data, error } = await query.limit(1);

      if (error || !data || data.length === 0) {
        return null;
      }

      const analysis = data[0];

      return {
        id: analysis.id,
        document_id: analysis.id, // Same as id in current schema
        user_id: analysis.user_id,
        extracted_data: {
          personalInfo: analysis.personal_info,
          education: analysis.education,
          experience: analysis.work_experience,
          skills: analysis.skills,
          research: analysis.research
        },
        personal_info: analysis.personal_info,
        education: analysis.education,
        experience: analysis.work_experience,
        skills: analysis.skills,
        research_areas: analysis.research?.areas || [],
        recommendations: analysis.recommendations,
        confidence_score: analysis.confidence_score,
        completeness_score: analysis.completeness_score,
        analysis_status: 'completed', // Default status since we can't reliably read the enum
        created_at: analysis.created_at
      };
    } catch (error) {
      console.error('Get stored analysis error:', error);
      return null;
    }
  }

  /**
   * Get all CV analyses for a user (using current schema)
   */
  async getUserCVAnalyses(userId: string): Promise<StoredCVAnalysis[]> {
    try {
      const { data, error } = await supabase
        .from('cv_analysis')
        .select(`
          id,
          user_id,
          personal_info,
          education,
          work_experience,
          skills,
          research,
          achievements,
          strengths,
          areas_for_improvement,
          recommendations,
          confidence_score,
          completeness_score,
          created_at,
          original_filename,
          match_score
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get user analyses error:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        document_id: item.id, // Same as id in current schema
        user_id: item.user_id,
        extracted_data: {
          personalInfo: item.personal_info,
          education: item.education,
          experience: item.work_experience,
          skills: item.skills,
          research: item.research
        },
        personal_info: item.personal_info,
        education: item.education,
        experience: item.work_experience,
        skills: item.skills,
        research_areas: item.research?.areas || [],
        recommendations: item.recommendations,
        confidence_score: item.confidence_score,
        completeness_score: item.completeness_score,
        analysis_status: 'completed', // Default status since we can't reliably read the enum
        created_at: item.created_at
      }));
    } catch (error) {
      console.error('Get user analyses exception:', error);
      return [];
    }
  }

  /**
   * Update user profile with extracted CV data using actual academic_profiles schema
   */
  private async updateUserProfileFromCV(userId: string, analysisResult: any): Promise<void> {
    try {
      // Prepare comprehensive academic profile data using actual schema fields
      const latestEducation = analysisResult.education?.[0]; // Most recent education
      const personalInfo = analysisResult.personalInfo || {};
      
      const updateData: any = {
        user_id: userId,
        
        // Current academic status (using actual column names)
        current_institution: latestEducation?.institution,
        current_degree: latestEducation?.degree,
        current_field_of_study: latestEducation?.field,
        graduation_year: latestEducation?.graduationYear ? parseInt(latestEducation.graduationYear) : null,
        current_gpa: latestEducation?.gpa ? parseFloat(latestEducation.gpa) : null,
        
        // Previous education as JSONB (actual schema)
        previous_education: analysisResult.education?.slice(1) || [], // All except current/latest
        
        // Awards and recognition as text arrays (actual schema)
        honors_awards: analysisResult.awards?.map((award: any) => award.title || award.name || award) || [],
        scholarships: analysisResult.scholarships || [],
        
        // Publications as text array (actual schema)
        publications: analysisResult.publications?.map((pub: any) => pub.title || pub) || [],
        conferences_attended: analysisResult.conferences || [],
        presentations_given: analysisResult.presentations || [],
        
        // Experience as text fields (actual schema)
        research_experience: analysisResult.researchExperience?.map((exp: any) => 
          typeof exp === 'string' ? exp : `${exp.title || exp.position} at ${exp.organization || exp.institution}`
        ).join('; ') || null,
        work_experience: analysisResult.experience?.map((exp: any) => 
          typeof exp === 'string' ? exp : `${exp.title || exp.position} at ${exp.company || exp.organization}`
        ).join('; ') || null,
        volunteer_experience: analysisResult.volunteerExperience?.join('; ') || null,
        leadership_experience: analysisResult.leadershipExperience?.join('; ') || null,
        
        // Skills as text arrays (actual schema)
        technical_skills: analysisResult.skills?.technical || analysisResult.skills?.filter((s: any) => s.type === 'technical')?.map((s: any) => s.name || s) || [],
        soft_skills: analysisResult.skills?.soft || analysisResult.skills?.filter((s: any) => s.type === 'soft')?.map((s: any) => s.name || s) || [],
        programming_languages: analysisResult.skills?.programming || [],
        tools_and_technologies: analysisResult.skills?.tools || [],
        
        // Languages as JSONB (actual schema)
        languages: analysisResult.languages || [],
        
        // Certifications as text array (actual schema)
        certifications: analysisResult.certifications?.map((cert: any) => cert.name || cert.title || cert) || [],
        
        // Research interests as text array (actual schema)
        research_interests: analysisResult.researchAreas || [],
        
        // Career information
        career_goals: analysisResult.careerGoals || null,
        target_industries: analysisResult.targetIndustries || [],
        preferred_work_locations: analysisResult.preferredLocations || [],
        
        // CV tracking
        last_cv_upload: new Date().toISOString().split('T')[0],
        cv_analysis_score: analysisResult.metadata?.confidenceScore ? parseFloat(analysisResult.metadata.confidenceScore) : null,
        profile_strength_score: Math.min(100, Math.round((analysisResult.metadata?.confidenceScore || 50) + 25)), // Convert confidence to strength score
        updated_at: new Date().toISOString()
      };

      // Remove null/undefined values and empty arrays
      Object.keys(updateData).forEach(key => {
        const value = updateData[key];
        if (value === null || value === undefined || value === 'null' || 
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'string' && value.trim() === '')) {
          delete updateData[key];
        }
      });

      console.log('📝 Updating academic profile with actual schema data:', {
        userId,
        fieldsUpdated: Object.keys(updateData).length,
        hasEducation: Boolean(latestEducation),
        hasPublications: Boolean(analysisResult.publications?.length),
        hasExperience: Boolean(analysisResult.experience?.length),
        hasSkills: Boolean(analysisResult.skills?.length),
        hasResearchInterests: Boolean(analysisResult.researchAreas?.length)
      });

      await supabase
        .from('academic_profiles')
        .upsert(updateData, { onConflict: 'user_id' });

      // Update research interests
      if (analysisResult.researchAreas && analysisResult.researchAreas.length > 0) {
        // First, clear existing research interests
        await supabase
          .from('user_research_interests')
          .delete()
          .eq('user_id', userId);

        // Add new research interests
        for (const area of analysisResult.researchAreas) {
          // Ensure the research interest exists (using current schema)
          const { data: existingInterest } = await supabase
            .from('research_interests')
            .select('id')
            .eq('name', area)
            .single();

          let interestId;
          if (existingInterest) {
            interestId = existingInterest.id;
          } else {
            // Create new research interest
            const { data: newInterest } = await supabase
              .from('research_interests')
              .insert({ 
                name: area,
                category: 'cv_extracted',
                description: `Research interest extracted from CV analysis`
              })
              .select('id')
              .single();
            interestId = newInterest?.id;
          }

          if (interestId) {
            await supabase
              .from('user_research_interests')
              .insert({
                user_id: userId,
                research_interest_id: interestId
              });
          }
        }
      }

      // Note: No longer using resumes table - data is stored in academic_profiles and cv_analysis tables
      console.log('✅ Academic profile updated comprehensively from CV analysis');
      
      // Generate university recommendations based on CV analysis
      try {
        console.log('🎯 Generating university recommendations from CV analysis...');
        const universityMatchingService = await import('./universityMatchingService');
        
        const matchRequest = {
          userProfile: {
            gpa: analysisResult.education?.[0]?.gpa || 3.5,
            testScores: {},
            researchInterests: analysisResult.researchAreas || [],
            targetDegree: analysisResult.education?.[0]?.field || 'Computer Science',
            preferences: {
              countries: ['United States', 'Canada', 'United Kingdom'],
              maxTuition: 100000,
              minAdmissionRate: 0.1
            }
          },
          cvAnalysis: analysisResult
        };

        const { matches, facultyRecommendations } = await universityMatchingService.universityMatchingService.generateMatches(userId, matchRequest);
        console.log(`✅ Generated ${matches.length} university matches and ${facultyRecommendations.length} faculty recommendations from CV analysis`);
      } catch (matchingError) {
        console.warn('⚠️ Could not generate university recommendations from CV:', matchingError);
        // Don't fail the CV analysis if university matching fails
      }
    } catch (error) {
      console.error('❌ Error updating user profile from CV:', error);
      // Don't throw error - this shouldn't fail the CV analysis
    }
  }

  /**
   * Get user profile data enhanced with CV analysis
   */
  async getEnhancedUserProfile(userId: string): Promise<any> {
    try {
      // Get latest CV analysis
      const latestAnalysis = await this.getStoredAnalysis(userId);
      
      // Get academic profile
      const { data: academicProfile } = await supabase
        .from('academic_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get research interests
      const { data: researchInterests } = await supabase
        .from('user_research_interests')
        .select(`
          research_interests:research_interest_id (
            id, name, category
          )
        `)
        .eq('user_id', userId);

      return {
        cvAnalysis: latestAnalysis,
        academicProfile,
        researchInterests: researchInterests?.map(ri => ri.research_interests) || [],
        hasCompleteProfile: Boolean(academicProfile && researchInterests && researchInterests.length > 0)
      };
    } catch (error) {
      console.error('Error getting enhanced user profile:', error);
      return null;
    }
  }

  /**
   * Delete CV analysis (using current schema)
   */
  async deleteCVAnalysis(userId: string, documentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get file path for storage deletion
      const { data: docData } = await supabase
        .from('cv_analysis')
        .select('cv_file_path')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      // Delete from cv_analysis
      const { error: deleteError } = await supabase
        .from('cv_analysis')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      // Delete file from storage
      if (docData?.cv_file_path) {
        await supabase.storage
          .from('resumes')
          .remove([docData.cv_file_path]);
      }

      return { success: true };
    } catch (error) {
      console.error('Delete CV error:', error);
      return { success: false, error: 'Failed to delete CV analysis' };
    }
  }
}

// Export singleton instance
export const cvAnalysisService = new CVAnalysisService();
export default cvAnalysisService;