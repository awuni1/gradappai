import { supabase } from '../integrations/supabase/client';

/**
 * Initialize storage buckets for CV documents and other files
 */
export async function initializeStorage() {
  try {
    console.log('🗃️ Initializing storage buckets...');

    // Create cv-documents bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.warn('Could not list buckets:', listError.message);
      return false;
    }

    const cvBucketExists = buckets?.some(bucket => bucket.name === 'cv-documents');
    
    if (!cvBucketExists) {
      const { error: createError } = await supabase.storage.createBucket('cv-documents', {
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.warn('Could not create cv-documents bucket:', createError.message);
        return false;
      }

      console.log('✅ Created cv-documents bucket');
    } else {
      console.log('✅ cv-documents bucket already exists');
    }

    return true;
  } catch (error) {
    console.error('❌ Error initializing storage:', error);
    return false;
  }
}

/**
 * Check if storage is properly configured
 */
export async function checkStorageHealth(): Promise<{
  isHealthy: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    // Check if we can list buckets
    const { error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      issues.push('Cannot list storage buckets');
    }

    // Check if cv-documents bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const cvBucketExists = buckets?.some(bucket => bucket.name === 'cv-documents');
    
    if (!cvBucketExists) {
      issues.push('cv-documents bucket does not exist');
    }

    return {
      isHealthy: issues.length === 0,
      issues
    };
  } catch (error) {
    issues.push(`Storage health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      isHealthy: false,
      issues
    };
  }
}

/**
 * Clean up old CV files (files older than 30 days)
 */
export async function cleanupOldCVFiles(): Promise<{
  cleaned: number;
  errors: string[];
}> {
  try {
    console.log('🧹 Starting CV files cleanup...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

    // Get all files in cv-documents bucket
    const { data: files, error: listError } = await supabase.storage
      .from('cv-documents')
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (listError) {
      return { cleaned: 0, errors: [listError.message] };
    }

    if (!files || files.length === 0) {
      console.log('📁 No files found in cv-documents bucket');
      return { cleaned: 0, errors: [] };
    }

    // Filter old files
    const oldFiles = files.filter(file => {
      const fileDate = new Date(file.created_at);
      return fileDate < cutoffDate;
    });

    if (oldFiles.length === 0) {
      console.log('✨ No old files to clean up');
      return { cleaned: 0, errors: [] };
    }

    // Delete old files
    const filePaths = oldFiles.map(file => file.name);
    const { error: deleteError } = await supabase.storage
      .from('cv-documents')
      .remove(filePaths);

    if (deleteError) {
      return { cleaned: 0, errors: [deleteError.message] };
    }

    console.log(`🗑️ Cleaned up ${oldFiles.length} old CV files`);
    return { cleaned: oldFiles.length, errors: [] };

  } catch (error) {
    return { 
      cleaned: 0, 
      errors: [error instanceof Error ? error.message : 'Unknown cleanup error'] 
    };
  }
}