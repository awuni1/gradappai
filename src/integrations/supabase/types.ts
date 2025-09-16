export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: Record<never, never>
    Views: Record<never, never>
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
  public: {
    Tables: {
      academic_profiles: {
        Row: {
          created_at: string | null
          current_degree: string | null
          current_field_of_study: string | null
          current_gpa: number | null
          current_institution: string | null
          gmat_score: number | null
          graduation_year: number | null
          gre_analytical: number | null
          gre_quantitative: number | null
          gre_verbal: number | null
          honors_awards: string[] | null
          id: string
          ielts_score: number | null
          publications: string[] | null
          research_experience: string | null
          toefl_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_degree?: string | null
          current_field_of_study?: string | null
          current_gpa?: number | null
          current_institution?: string | null
          gmat_score?: number | null
          graduation_year?: number | null
          gre_analytical?: number | null
          gre_quantitative?: number | null
          gre_verbal?: number | null
          honors_awards?: string[] | null
          id?: string
          ielts_score?: number | null
          publications?: string[] | null
          research_experience?: string | null
          toefl_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_degree?: string | null
          current_field_of_study?: string | null
          current_gpa?: number | null
          current_institution?: string | null
          gmat_score?: number | null
          graduation_year?: number | null
          gre_analytical?: number | null
          gre_quantitative?: number | null
          gre_verbal?: number | null
          honors_awards?: string[] | null
          id?: string
          ielts_score?: number | null
          publications?: string[] | null
          research_experience?: string | null
          toefl_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      application_requirements: {
        Row: {
          application_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          file_url: string | null
          id: string
          is_completed: boolean | null
          is_required: boolean | null
          notes: string | null
          requirement_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          is_completed?: boolean | null
          is_required?: boolean | null
          notes?: string | null
          requirement_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          is_completed?: boolean | null
          is_required?: boolean | null
          notes?: string | null
          requirement_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_requirements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "application_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_requirements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          application_fee: number | null
          application_id_external: string | null
          application_portal_url: string | null
          created_at: string | null
          decision_date: string | null
          fee_paid: boolean | null
          id: string
          interview_date: string | null
          notes: string | null
          progress: number | null
          selected_university_id: string
          status: Database["public"]["Enums"]["application_status"] | null
          submission_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_fee?: number | null
          application_id_external?: string | null
          application_portal_url?: string | null
          created_at?: string | null
          decision_date?: string | null
          fee_paid?: boolean | null
          id?: string
          interview_date?: string | null
          notes?: string | null
          progress?: number | null
          selected_university_id: string
          status?: Database["public"]["Enums"]["application_status"] | null
          submission_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_fee?: number | null
          application_id_external?: string | null
          application_portal_url?: string | null
          created_at?: string | null
          decision_date?: string | null
          fee_paid?: boolean | null
          id?: string
          interview_date?: string | null
          notes?: string | null
          progress?: number | null
          selected_university_id?: string
          status?: Database["public"]["Enums"]["application_status"] | null
          submission_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_selected_university_id_fkey"
            columns: ["selected_university_id"]
            isOneToOne: false
            referencedRelation: "selected_universities"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_admin: boolean | null
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_group: boolean | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cv_analysis: {
        Row: {
          analysis_version: string | null
          created_at: string | null
          education_level: string | null
          experience_years: number | null
          field_of_study: string | null
          id: string
          improvement_areas: Json | null
          match_score: number | null
          processing_time_ms: number | null
          recommended_programs: Json | null
          resume_id: string | null
          skills: Json | null
          strengths: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_version?: string | null
          created_at?: string | null
          education_level?: string | null
          experience_years?: number | null
          field_of_study?: string | null
          id?: string
          improvement_areas?: Json | null
          match_score?: number | null
          processing_time_ms?: number | null
          recommended_programs?: Json | null
          resume_id?: string | null
          skills?: Json | null
          strengths?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_version?: string | null
          created_at?: string | null
          education_level?: string | null
          experience_years?: number | null
          field_of_study?: string | null
          id?: string
          improvement_areas?: Json | null
          match_score?: number | null
          processing_time_ms?: number | null
          recommended_programs?: Json | null
          resume_id?: string | null
          skills?: Json | null
          strengths?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_analysis_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      deadlines: {
        Row: {
          application_id: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          is_completed: boolean | null
          priority: string | null
          reminder_date: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          reminder_date?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          reminder_date?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "application_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_profiles: {
        Row: {
          availability_schedule: Json | null
          average_rating: number | null
          created_at: string | null
          current_institution: string | null
          current_position: string | null
          current_students: number | null
          education_background: string | null
          hourly_rate: number | null
          id: string
          is_accepting_students: boolean | null
          is_verified: boolean | null
          mentoring_capacity: number | null
          specializations: string[] | null
          title: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          verification_documents: Json | null
          years_experience: number | null
        }
        Insert: {
          availability_schedule?: Json | null
          average_rating?: number | null
          created_at?: string | null
          current_institution?: string | null
          current_position?: string | null
          current_students?: number | null
          education_background?: string | null
          hourly_rate?: number | null
          id?: string
          is_accepting_students?: boolean | null
          is_verified?: boolean | null
          mentoring_capacity?: number | null
          specializations?: string[] | null
          title?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          verification_documents?: Json | null
          years_experience?: number | null
        }
        Update: {
          availability_schedule?: Json | null
          average_rating?: number | null
          created_at?: string | null
          current_institution?: string | null
          current_position?: string | null
          current_students?: number | null
          education_background?: string | null
          hourly_rate?: number | null
          id?: string
          is_accepting_students?: boolean | null
          is_verified?: boolean | null
          mentoring_capacity?: number | null
          specializations?: string[] | null
          title?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          verification_documents?: Json | null
          years_experience?: number | null
        }
        Relationships: []
      }
      mentorship_sessions: {
        Row: {
          created_at: string | null
          description: string | null
          feedback: string | null
          id: string
          meeting_url: string | null
          mentor_id: string
          notes: string | null
          rating: number | null
          scheduled_end: string
          scheduled_start: string
          status: string | null
          student_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feedback?: string | null
          id?: string
          meeting_url?: string | null
          mentor_id: string
          notes?: string | null
          rating?: number | null
          scheduled_end: string
          scheduled_start: string
          status?: string | null
          student_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feedback?: string | null
          id?: string
          meeting_url?: string | null
          mentor_id?: string
          notes?: string | null
          rating?: number | null
          scheduled_end?: string
          scheduled_start?: string
          status?: string | null
          student_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_edited: boolean | null
          message_type: string | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          attachments: Json | null
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          likes_count: number | null
          post_type: string | null
          shares_count: number | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          attachments?: Json | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          post_type?: string | null
          shares_count?: number | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          attachments?: Json | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          post_type?: string | null
          shares_count?: number | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: []
      }
      research_interests: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          analysis_data: Json | null
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_primary: boolean | null
          mime_type: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          mime_type?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          mime_type?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      selected_universities: {
        Row: {
          application_deadline: string | null
          created_at: string | null
          id: string
          notes: string | null
          priority: number | null
          program_id: string | null
          university_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_deadline?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          priority?: number | null
          program_id?: string | null
          university_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_deadline?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          priority?: number | null
          program_id?: string | null
          university_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "selected_universities_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "university_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selected_universities_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          acceptance_rate: number | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          ranking_global: number | null
          ranking_national: number | null
          state_province: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          ranking_global?: number | null
          ranking_national?: number | null
          state_province?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          ranking_global?: number | null
          ranking_national?: number | null
          state_province?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      university_chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      university_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "university_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      university_programs: {
        Row: {
          application_fee: number | null
          created_at: string | null
          deadline_fall: string | null
          deadline_spring: string | null
          degree_type: string | null
          department: string | null
          description: string | null
          duration_years: number | null
          gmat_required: boolean | null
          gre_required: boolean | null
          id: string
          min_gpa: number | null
          name: string
          requirements: string | null
          tuition_annual: number | null
          university_id: string
          updated_at: string | null
        }
        Insert: {
          application_fee?: number | null
          created_at?: string | null
          deadline_fall?: string | null
          deadline_spring?: string | null
          degree_type?: string | null
          department?: string | null
          description?: string | null
          duration_years?: number | null
          gmat_required?: boolean | null
          gre_required?: boolean | null
          id?: string
          min_gpa?: number | null
          name: string
          requirements?: string | null
          tuition_annual?: number | null
          university_id: string
          updated_at?: string | null
        }
        Update: {
          application_fee?: number | null
          created_at?: string | null
          deadline_fall?: string | null
          deadline_spring?: string | null
          degree_type?: string | null
          department?: string | null
          description?: string | null
          duration_years?: number | null
          gmat_required?: boolean | null
          gre_required?: boolean | null
          id?: string
          min_gpa?: number | null
          name?: string
          requirements?: string | null
          tuition_annual?: number | null
          university_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "university_programs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connections: {
        Row: {
          addressee_id: string
          created_at: string | null
          id: string
          message: string | null
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"] | null
          updated_at: string | null
        }
        Insert: {
          addressee_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          phone: string | null
          profile_picture_url: string | null
          profile_visibility: string | null
          push_notifications: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
          onboarding_completed: boolean | null 
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
          onboarding_completed?: boolean | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
          onboarding_completed?: boolean | null
        }
        Relationships: []
      }
      user_research_interests: {
        Row: {
          created_at: string | null
          id: string
          proficiency_level: string | null
          research_interest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          proficiency_level?: string | null
          research_interest_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          proficiency_level?: string | null
          research_interest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_research_interests_research_interest_id_fkey"
            columns: ["research_interest_id"]
            isOneToOne: false
            referencedRelation: "research_interests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      application_overview: {
        Row: {
          created_at: string | null
          id: string | null
          program_name: string | null
          progress: number | null
          status: Database["public"]["Enums"]["application_status"] | null
          submission_date: string | null
          university_name: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: Record<never, never>
    Enums: {
      application_status:
        | "not_started"
        | "in_progress"
        | "submitted"
        | "under_review"
        | "interview_scheduled"
        | "decision_pending"
        | "accepted"
        | "rejected"
        | "waitlisted"
        | "deferred"
      connection_status: "pending" | "accepted" | "declined"
      user_role: "student" | "mentor" | "admin"
    }
    CompositeTypes: Record<never, never>
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      application_status: [
        "not_started",
        "in_progress",
        "submitted",
        "under_review",
        "interview_scheduled",
        "decision_pending",
        "accepted",
        "rejected",
        "waitlisted",
        "deferred",
      ],
      connection_status: ["pending", "accepted", "declined"],
      user_role: ["student", "mentor", "admin"],
    },
  },
} as const

