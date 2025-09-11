import { supabase } from '@/integrations/supabase/client';

export interface DatabaseHealthCheck {
  isHealthy: boolean;
  errors: string[];
  warnings: string[];
  missingTables: string[];
  missingColumns: string[];
}

/**
 * Check if all required tables and columns exist for the CV/Resume parser
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthCheck> {
  const result: DatabaseHealthCheck = {
    isHealthy: true,
    errors: [],
    warnings: [],
    missingTables: [],
    missingColumns: []
  };

  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      result.errors.push('User not authenticated');
      result.isHealthy = false;
      return result;
    }

    // Check for resumes table
    const { data: resumesData, error: resumesError } = await supabase
      .from('resumes')
      .select('id')
      .limit(1);

    if (resumesError) {
      if (resumesError.message.includes('relation "public.resumes" does not exist')) {
        result.missingTables.push('resumes');
        result.errors.push('Resumes table does not exist. Please run database migrations.');
      } else {
        result.errors.push(`Resumes table error: ${resumesError.message}`);
      }
      result.isHealthy = false;
    }

    // Check for required columns in resumes table (only if table exists)
    if (!result.missingTables.includes('resumes')) {
      const requiredColumns = [
        'parsing_status',
        'parsed_data', 
        'extraction_confidence',
        'parsing_errors',
        'last_parsed_at'
      ];

      for (const column of requiredColumns) {
        try {
          // Try to select the column to see if it exists
          const { error: columnError } = await supabase
            .from('resumes')
            .select(column)
            .limit(1);

          if (columnError && columnError.message.includes(`column "${column}" does not exist`)) {
            result.missingColumns.push(column);
            result.errors.push(`Missing column '${column}' in resumes table`);
            result.isHealthy = false;
          }
        } catch (error) {
          // If there's an error checking the column, log it as a warning
          result.warnings.push(`Could not verify column '${column}': ${error.message}`);
        }
      }
    }

    // Check storage bucket
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        result.warnings.push(`Could not check storage buckets: ${bucketsError.message}`);
      } else {
        const resumesBucket = buckets?.find(bucket => bucket.id === 'resumes');
        if (!resumesBucket) {
          result.warnings.push('Resumes storage bucket not found');
        }
      }
    } catch (error) {
      result.warnings.push(`Storage check failed: ${error.message}`);
    }

    // Check if parsing_status enum exists
    try {
      const { error: enumError } = await supabase.rpc('check_enum_exists', { 
        enum_name: 'parsing_status' 
      });
      // If the RPC doesn't exist, that's fine - it means we're using a different method
      if (enumError && !enumError.message.includes('function check_enum_exists() does not exist')) {
        result.warnings.push(`Could not verify parsing_status enum: ${enumError.message}`);
      }
    } catch (error) {
      // This is not critical, so just add as warning
      result.warnings.push(`Enum check skipped: ${error.message}`);
    }

  } catch (error) {
    result.errors.push(`Database health check failed: ${error.message}`);
    result.isHealthy = false;
  }

  return result;
}

/**
 * Quick check to see if the resumes table exists and is accessible
 */
export async function quickResumeTableCheck(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('resumes')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.warn('Quick resume table check failed:', error);
    return false;
  }
}

/**
 * Get user-friendly database setup instructions
 */
export function getDatabaseSetupInstructions(healthCheck: DatabaseHealthCheck): string[] {
  const instructions: string[] = [];

  if (healthCheck.missingTables.includes('resumes')) {
    instructions.push(
      '1. Run database migration to create the resumes table:',
      '   npx supabase db push',
      '   or apply the migration manually in your Supabase dashboard'
    );
  }

  if (healthCheck.missingColumns.length > 0) {
    instructions.push(
      '2. Update the resumes table with missing columns:',
      `   Missing: ${healthCheck.missingColumns.join(', ')}`,
      '   Apply the latest migration to add these columns'
    );
  }

  if (instructions.length === 0 && !healthCheck.isHealthy) {
    instructions.push(
      'Database connection issues detected.',
      'Please check your Supabase configuration and network connection.'
    );
  }

  return instructions;
}

/**
 * Format database health check for display
 */
export function formatHealthCheckMessage(healthCheck: DatabaseHealthCheck): string {
  if (healthCheck.isHealthy) {
    const warningText = healthCheck.warnings.length > 0 
      ? ` (${healthCheck.warnings.length} warnings)` 
      : '';
    return `Database is healthy${warningText}`;
  }

  const errorCount = healthCheck.errors.length;
  const missingCount = healthCheck.missingTables.length + healthCheck.missingColumns.length;
  
  return `Database setup incomplete: ${errorCount} errors, ${missingCount} missing components`;
}