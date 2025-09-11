import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MentorDocument {
  id: string;
  mentor_id: string;
  title: string;
  description?: string;
  document_type: 'template' | 'guide' | 'example' | 'checklist' | 'presentation' | 'worksheet' | 'resource';
  category: string;
  file_url: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  access_level: 'public' | 'mentees_only' | 'specific_mentees' | 'private';
  allowed_mentees?: string[];
  tags: string[];
  prerequisites: string[];
  learning_outcomes: string[];
  estimated_time_minutes: number;
  version: number;
  is_template: boolean;
  is_collaborative: boolean;
  is_featured: boolean;
  download_count: number;
  view_count: number;
  usage_count: number;
  average_rating: number;
  total_ratings: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentReview {
  id: string;
  document_id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'returned_for_revision';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  feedback: string;
  feedback_summary: string;
  annotated_file_url?: string;
  revision_count: number;
  review_started_at?: string;
  review_completed_at?: string;
  due_date?: string;
  time_spent_minutes: number;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  changes_summary: string;
  created_by: string;
  created_at: string;
}

export interface CollaborativeSession {
  id: string;
  document_id: string;
  participants: string[];
  session_start: string;
  session_end?: string;
  status: 'active' | 'ended';
  changes_made: number;
  created_at: string;
}

export interface DocumentStats {
  total_documents: number;
  public_documents: number;
  private_documents: number;
  total_downloads: number;
  total_views: number;
  average_rating: number;
  most_popular_documents: MentorDocument[];
  recent_uploads: MentorDocument[];
}

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  document_type: string;
  category: string;
  file: File;
  access_level: string;
  allowed_mentees?: string[];
  tags: string[];
  prerequisites?: string[];
  learning_outcomes?: string[];
  estimated_time_minutes?: number;
  is_template?: boolean;
  is_collaborative?: boolean;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  category?: string;
  access_level?: string;
  allowed_mentees?: string[];
  tags?: string[];
  prerequisites?: string[];
  learning_outcomes?: string[];
  estimated_time_minutes?: number;
  is_template?: boolean;
  is_collaborative?: boolean;
  is_featured?: boolean;
}

class DocumentManagementService {
  /**
   * Upload and create a new document
   */
  async createDocument(mentorId: string, documentData: CreateDocumentRequest) {
    try {
      // Validate file type and size
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      if (!allowedTypes.includes(documentData.file.type)) {
        throw new Error('Unsupported file type. Please upload PDF, Word, PowerPoint, or text files.');
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (documentData.file.size > maxSize) {
        throw new Error('File size must be less than 10MB.');
      }

      // Generate unique file name
      const fileExtension = documentData.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = `mentor-documents/${mentorId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, documentData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document record
      const { data: document, error: documentError } = await supabase
        .from('mentor_documents')
        .insert({
          mentor_id: mentorId,
          title: documentData.title,
          description: documentData.description,
          document_type: documentData.document_type,
          category: documentData.category,
          file_url: publicUrl,
          file_path: filePath,
          file_name: documentData.file.name,
          file_type: documentData.file.type,
          file_size: documentData.file.size,
          access_level: documentData.access_level,
          allowed_mentees: documentData.allowed_mentees || [],
          tags: documentData.tags,
          prerequisites: documentData.prerequisites || [],
          learning_outcomes: documentData.learning_outcomes || [],
          estimated_time_minutes: documentData.estimated_time_minutes || 0,
          version: 1,
          is_template: documentData.is_template || false,
          is_collaborative: documentData.is_collaborative || false,
          is_featured: false,
          download_count: 0,
          view_count: 0,
          usage_count: 0,
          average_rating: 0,
          total_ratings: 0
        })
        .select()
        .single();

      if (documentError) {
        // Clean up uploaded file if document creation fails
        await supabase.storage.from('documents').remove([filePath]);
        throw documentError;
      }

      // Create initial version
      await this.createDocumentVersion(document.id, 1, publicUrl, 'Initial upload', mentorId);

      // Log activity
      await this.logDocumentActivity(document.id, 'document_created', mentorId);

      return { data: document, error: null };
    } catch (error) {
      console.error('Error creating document:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create document' 
      };
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(documentId: string, mentorId: string, updates: UpdateDocumentRequest) {
    try {
      // Verify ownership
      const { data: existingDoc, error: fetchError } = await supabase
        .from('mentor_documents')
        .select('id')
        .eq('id', documentId)
        .eq('mentor_id', mentorId)
        .single();

      if (fetchError || !existingDoc) {
        throw new Error('Document not found or access denied');
      }

      // Update document
      const { data: document, error } = await supabase
        .from('mentor_documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) {throw error;}

      // Log activity
      await this.logDocumentActivity(documentId, 'document_updated', mentorId);

      return { data: document, error: null };
    } catch (error) {
      console.error('Error updating document:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update document' 
      };
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, mentorId: string) {
    try {
      // Get document details
      const { data: document, error: fetchError } = await supabase
        .from('mentor_documents')
        .select('file_path')
        .eq('id', documentId)
        .eq('mentor_id', mentorId)
        .single();

      if (fetchError || !document) {
        throw new Error('Document not found or access denied');
      }

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }

      // Delete document record
      const { error: deleteError } = await supabase
        .from('mentor_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) {throw deleteError;}

      return { error: null };
    } catch (error) {
      console.error('Error deleting document:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to delete document' 
      };
    }
  }

  /**
   * Get mentor's documents with filtering and pagination
   */
  async getMentorDocuments(
    mentorId: string,
    options: {
      category?: string;
      document_type?: string;
      access_level?: string;
      is_published?: boolean;
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      let query = supabase
        .from('mentor_documents')
        .select('*')
        .eq('mentor_id', mentorId);

      // Apply filters
      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.document_type) {
        query = query.eq('document_type', options.document_type);
      }

      if (options.access_level) {
        query = query.eq('access_level', options.access_level);
      }

      if (options.is_published !== undefined) {
        if (options.is_published) {
          query = query.not('published_at', 'is', null);
        } else {
          query = query.is('published_at', null);
        }
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%,tags.cs.{${options.search}}`);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      // Order by updated_at
      query = query.order('updated_at', { ascending: false });

      const { data: documents, error } = await query;

      if (error) {throw error;}

      return { data: documents || [], error: null };
    } catch (error) {
      console.error('Error fetching mentor documents:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch documents' 
      };
    }
  }

  /**
   * Get documents accessible to a mentee
   */
  async getMenteeAccessibleDocuments(menteeId: string, mentorId?: string) {
    try {
      let query = supabase
        .from('mentor_documents')
        .select(`
          *,
          mentor:mentor_profiles!mentor_id(
            user_id,
            display_name,
            expertise_areas
          )
        `);

      // Apply access level filters
      query = query.or(`access_level.eq.public,and(access_level.eq.mentees_only,mentor_id.eq.${mentorId}),and(access_level.eq.specific_mentees,allowed_mentees.cs.{${menteeId}})`);

      // Only show published documents
      query = query.not('published_at', 'is', null);

      if (mentorId) {
        query = query.eq('mentor_id', mentorId);
      }

      query = query.order('updated_at', { ascending: false });

      const { data: documents, error } = await query;

      if (error) {throw error;}

      return { data: documents || [], error: null };
    } catch (error) {
      console.error('Error fetching accessible documents:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch documents' 
      };
    }
  }

  /**
   * Increment document view count
   */
  async incrementViewCount(documentId: string) {
    try {
      const { error } = await supabase.rpc('increment_document_views', {
        document_id: documentId
      });

      if (error) {throw error;}
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  /**
   * Increment document download count
   */
  async incrementDownloadCount(documentId: string) {
    try {
      const { error } = await supabase.rpc('increment_document_downloads', {
        document_id: documentId
      });

      if (error) {throw error;}
    } catch (error) {
      console.error('Error incrementing download count:', error);
    }
  }

  /**
   * Create a new document review
   */
  async createDocumentReview(
    documentId: string,
    mentorId: string,
    menteeId: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    dueDate?: string
  ) {
    try {
      const { data: review, error } = await supabase
        .from('document_reviews')
        .insert({
          document_id: documentId,
          mentor_id: mentorId,
          mentee_id: menteeId,
          status: 'pending',
          priority: priority,
          feedback: '',
          feedback_summary: '',
          revision_count: 0,
          due_date: dueDate,
          time_spent_minutes: 0
        })
        .select()
        .single();

      if (error) {throw error;}

      // Send notification to mentor
      await this.sendReviewNotification(review.id, 'review_requested');

      return { data: review, error: null };
    } catch (error) {
      console.error('Error creating document review:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create review' 
      };
    }
  }

  /**
   * Update document review
   */
  async updateDocumentReview(
    reviewId: string,
    mentorId: string,
    updates: {
      status?: string;
      feedback?: string;
      feedback_summary?: string;
      annotated_file_url?: string;
      rating?: number;
    }
  ) {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Set timestamps based on status
      if (updates.status === 'in_progress' && !updateData.review_started_at) {
        updateData.review_started_at = new Date().toISOString();
      }

      if (updates.status === 'completed') {
        updateData.review_completed_at = new Date().toISOString();
      }

      const { data: review, error } = await supabase
        .from('document_reviews')
        .update(updateData)
        .eq('id', reviewId)
        .eq('mentor_id', mentorId)
        .select()
        .single();

      if (error) {throw error;}

      // Send notification based on status
      if (updates.status === 'completed') {
        await this.sendReviewNotification(reviewId, 'review_completed');
      } else if (updates.status === 'returned_for_revision') {
        await this.sendReviewNotification(reviewId, 'review_returned');
      }

      return { data: review, error: null };
    } catch (error) {
      console.error('Error updating document review:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update review' 
      };
    }
  }

  /**
   * Get document reviews for a mentor
   */
  async getMentorReviews(
    mentorId: string,
    options: {
      status?: string;
      priority?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      let query = supabase
        .from('document_reviews')
        .select(`
          *,
          document:mentor_documents(title, document_type),
          mentee_profile:user_profiles!mentee_id(display_name, profile_image_url)
        `)
        .eq('mentor_id', mentorId);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.priority) {
        query = query.eq('priority', options.priority);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data: reviews, error } = await query;

      if (error) {throw error;}

      return { data: reviews || [], error: null };
    } catch (error) {
      console.error('Error fetching mentor reviews:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch reviews' 
      };
    }
  }

  /**
   * Toggle document publication status
   */
  async toggleDocumentPublication(documentId: string, mentorId: string, published: boolean) {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (published) {
        updateData.published_at = new Date().toISOString();
      } else {
        updateData.published_at = null;
      }

      const { data: document, error } = await supabase
        .from('mentor_documents')
        .update(updateData)
        .eq('id', documentId)
        .eq('mentor_id', mentorId)
        .select()
        .single();

      if (error) {throw error;}

      return { data: document, error: null };
    } catch (error) {
      console.error('Error toggling document publication:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update publication status' 
      };
    }
  }

  /**
   * Duplicate a document
   */
  async duplicateDocument(documentId: string, mentorId: string) {
    try {
      // Get original document
      const { data: originalDoc, error: fetchError } = await supabase
        .from('mentor_documents')
        .select('*')
        .eq('id', documentId)
        .eq('mentor_id', mentorId)
        .single();

      if (fetchError || !originalDoc) {
        throw new Error('Document not found or access denied');
      }

      // Create duplicate
      const { data: duplicate, error: duplicateError } = await supabase
        .from('mentor_documents')
        .insert({
          mentor_id: mentorId,
          title: `${originalDoc.title} (Copy)`,
          description: originalDoc.description,
          document_type: originalDoc.document_type,
          category: originalDoc.category,
          file_url: originalDoc.file_url,
          file_path: originalDoc.file_path,
          file_name: originalDoc.file_name,
          file_type: originalDoc.file_type,
          file_size: originalDoc.file_size,
          access_level: 'private', // Always start as private
          tags: originalDoc.tags,
          prerequisites: originalDoc.prerequisites,
          learning_outcomes: originalDoc.learning_outcomes,
          estimated_time_minutes: originalDoc.estimated_time_minutes,
          version: 1,
          is_template: originalDoc.is_template,
          is_collaborative: originalDoc.is_collaborative,
          is_featured: false,
          download_count: 0,
          view_count: 0,
          usage_count: 0,
          average_rating: 0,
          total_ratings: 0
        })
        .select()
        .single();

      if (duplicateError) {throw duplicateError;}

      return { data: duplicate, error: null };
    } catch (error) {
      console.error('Error duplicating document:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to duplicate document' 
      };
    }
  }

  /**
   * Get document statistics for a mentor
   */
  async getDocumentStats(mentorId: string): Promise<DocumentStats> {
    try {
      const { data: documents, error } = await supabase
        .from('mentor_documents')
        .select('*')
        .eq('mentor_id', mentorId);

      if (error) {throw error;}

      if (!documents || documents.length === 0) {
        return {
          total_documents: 0,
          public_documents: 0,
          private_documents: 0,
          total_downloads: 0,
          total_views: 0,
          average_rating: 0,
          most_popular_documents: [],
          recent_uploads: []
        };
      }

      const stats = documents.reduce((acc, doc) => {
        acc.total_documents++;
        acc.total_downloads += doc.download_count;
        acc.total_views += doc.view_count;

        if (doc.access_level === 'public') {
          acc.public_documents++;
        } else {
          acc.private_documents++;
        }

        if (doc.total_ratings > 0) {
          acc.rating_sum += doc.average_rating * doc.total_ratings;
          acc.rating_count += doc.total_ratings;
        }

        return acc;
      }, {
        total_documents: 0,
        public_documents: 0,
        private_documents: 0,
        total_downloads: 0,
        total_views: 0,
        rating_sum: 0,
        rating_count: 0
      });

      // Get most popular documents
      const mostPopular = documents
        .sort((a, b) => (b.download_count + b.view_count) - (a.download_count + a.view_count))
        .slice(0, 5);

      // Get recent uploads
      const recentUploads = documents
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      return {
        total_documents: stats.total_documents,
        public_documents: stats.public_documents,
        private_documents: stats.private_documents,
        total_downloads: stats.total_downloads,
        total_views: stats.total_views,
        average_rating: stats.rating_count > 0 ? stats.rating_sum / stats.rating_count : 0,
        most_popular_documents: mostPopular,
        recent_uploads: recentUploads
      };
    } catch (error) {
      console.error('Error fetching document stats:', error);
      return {
        total_documents: 0,
        public_documents: 0,
        private_documents: 0,
        total_downloads: 0,
        total_views: 0,
        average_rating: 0,
        most_popular_documents: [],
        recent_uploads: []
      };
    }
  }

  /**
   * Create a new document version
   */
  private async createDocumentVersion(
    documentId: string,
    versionNumber: number,
    fileUrl: string,
    changesSummary: string,
    createdBy: string
  ) {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: versionNumber,
          file_url: fileUrl,
          changes_summary: changesSummary,
          created_by: createdBy
        });

      if (error) {throw error;}
      return { data, error: null };
    } catch (error) {
      console.error('Error creating document version:', error);
      return { data: null, error };
    }
  }

  /**
   * Log document activity
   */
  private async logDocumentActivity(documentId: string, activityType: string, userId: string) {
    try {
      // This would integrate with the activity tracking service
      console.log(`Logging ${activityType} for document ${documentId} by user ${userId}`);
    } catch (error) {
      console.error('Error logging document activity:', error);
    }
  }

  /**
   * Send review notification
   */
  private async sendReviewNotification(reviewId: string, notificationType: string) {
    try {
      // This would integrate with the notification service
      console.log(`Sending ${notificationType} notification for review ${reviewId}`);
    } catch (error) {
      console.error('Error sending review notification:', error);
    }
  }
}

// Export singleton instance
export const documentManagementService = new DocumentManagementService();
export default documentManagementService;