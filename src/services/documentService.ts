import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface DocumentMetadata {
  generated_by_ai?: boolean;
  ai_model_version?: string;
  generation_context?: any;
  generated_at?: string;
  word_count?: number;
  template_used?: string;
  university_context?: string;
  program_context?: string;
}

export interface UserDocument {
  id: string;
  user_id: string;
  template_id?: string;
  university_id?: string;
  document_type: string;
  title: string;
  content: string;
  metadata: DocumentMetadata;
  version: number;
  is_finalized: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentData {
  document_type: string;
  title: string;
  content: string;
  metadata?: DocumentMetadata;
  template_id?: string;
  university_id?: string;
  version?: number;
  is_finalized?: boolean;
}

class DocumentService {
  /**
   * Save a generated document to the database
   */
  async saveDocument(user: User, documentData: CreateDocumentData): Promise<UserDocument | null> {
    try {
      console.log('💾 DocumentService: Saving document', {
        userId: user.id,
        title: documentData.title,
        type: documentData.document_type
      });

      // Ensure database table exists
      await this.ensureTableExists();

      const fullDocumentData = {
        user_id: user.id,
        document_type: documentData.document_type,
        title: documentData.title,
        content: documentData.content,
        metadata: {
          generated_by_ai: true,
          generated_at: new Date().toISOString(),
          word_count: documentData.content.split(' ').length,
          ...documentData.metadata
        },
        template_id: documentData.template_id || null,
        university_id: documentData.university_id || null,
        version: documentData.version || 1,
        is_finalized: documentData.is_finalized || false
      };

      console.log('📝 Inserting document data:', fullDocumentData);

      const { data, error } = await supabase
        .from('user_generated_documents')
        .insert(fullDocumentData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Document saved successfully:', data.id);
      return data as UserDocument;

    } catch (error) {
      console.error('❌ DocumentService: Error saving document:', error);
      
      // Handle specific error types
      if (error.code === '42P01') {
        console.log('🔧 Table does not exist, attempting to create...');
        await this.createTableIfNotExists();
        
        // Retry the save operation once
        try {
          const { data, error: retryError } = await supabase
            .from('user_generated_documents')
            .insert({
              user_id: user.id,
              ...documentData,
              metadata: {
                generated_by_ai: true,
                generated_at: new Date().toISOString(),
                word_count: documentData.content.split(' ').length,
                ...documentData.metadata
              }
            })
            .select()
            .single();

          if (retryError) {throw retryError;}
          return data as UserDocument;
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    try {
      console.log('📚 DocumentService: Fetching documents for user:', userId);

      const { data, error } = await supabase
        .from('user_generated_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') {
        console.error('❌ Error fetching documents:', error);
        throw error;
      }

      if (error && error.code === '42P01') {
        console.warn('⚠️ Documents table does not exist, returning empty array');
        return [];
      }

      console.log(`✅ Found ${data?.length || 0} documents for user`);
      return (data as UserDocument[]) || [];

    } catch (error) {
      console.error('❌ DocumentService: Error fetching documents:', error);
      return []; // Return empty array on error to not break UI
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: string, userId: string): Promise<UserDocument | null> {
    try {
      const { data, error } = await supabase
        .from('user_generated_documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as UserDocument;
    } catch (error) {
      console.error('❌ DocumentService: Error fetching document:', error);
      return null;
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(documentId: string, userId: string, updates: Partial<CreateDocumentData>): Promise<UserDocument | null> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Update word count if content is being updated
      if (updates.content) {
        updateData.metadata = {
          ...updates.metadata,
          word_count: updates.content.split(' ').length
        };
      }

      const { data, error } = await supabase
        .from('user_generated_documents')
        .update(updateData)
        .eq('id', documentId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {throw error;}
      return data as UserDocument;
    } catch (error) {
      console.error('❌ DocumentService: Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_generated_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (error) {throw error;}
      return true;
    } catch (error) {
      console.error('❌ DocumentService: Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Ensure the documents table exists
   */
  private async ensureTableExists(): Promise<void> {
    try {
      // Simple check to see if table exists
      await supabase.from('user_generated_documents').select('id').limit(1);
    } catch (error) {
      if (error.code === '42P01') {
        console.log('🔧 Table missing, attempting to create...');
        await this.createTableIfNotExists();
      }
    }
  }

  /**
   * Create the user_generated_documents table if it doesn't exist
   */
  private async createTableIfNotExists(): Promise<void> {
    console.log('🏗️ Attempting to create user_generated_documents table...');
    
    // Since we can't reliably create tables via RPC in all Supabase configurations,
    // we'll provide clear instructions to the user instead
    throw new Error(`
      Documents table missing. Please run this SQL in your Supabase SQL Editor:
      
      CREATE TABLE IF NOT EXISTS public.user_generated_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        template_id UUID DEFAULT NULL,
        university_id UUID DEFAULT NULL,
        document_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        version INTEGER DEFAULT 1,
        is_finalized BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- Enable RLS
      ALTER TABLE public.user_generated_documents ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      CREATE POLICY "Users can manage own documents" ON public.user_generated_documents
        FOR ALL USING (auth.uid() = user_id);

      -- Create indexes
      CREATE INDEX idx_user_documents_user_id ON public.user_generated_documents(user_id);
      CREATE INDEX idx_user_documents_created_at ON public.user_generated_documents(created_at DESC);
    `);
  }

  /**
   * Get document statistics for a user
   */
  async getDocumentStats(userId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    finalized: number;
    drafts: number;
  }> {
    try {
      const documents = await this.getUserDocuments(userId);
      
      const stats = {
        total: documents.length,
        byType: {} as Record<string, number>,
        finalized: 0,
        drafts: 0
      };

      documents.forEach(doc => {
        // Count by type
        stats.byType[doc.document_type] = (stats.byType[doc.document_type] || 0) + 1;
        
        // Count finalized vs drafts
        if (doc.is_finalized) {
          stats.finalized++;
        } else {
          stats.drafts++;
        }
      });

      return stats;
    } catch (error) {
      console.error('❌ Error getting document stats:', error);
      return {
        total: 0,
        byType: {},
        finalized: 0,
        drafts: 0
      };
    }
  }

  /**
   * Search documents by title or content
   */
  async searchDocuments(userId: string, query: string): Promise<UserDocument[]> {
    try {
      const { data, error } = await supabase
        .from('user_generated_documents')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') {throw error;}
      return (data as UserDocument[]) || [];
    } catch (error) {
      console.error('❌ Error searching documents:', error);
      return [];
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;