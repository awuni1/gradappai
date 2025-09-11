import { supabase } from '@/integrations/supabase/client';

/**
 * Database setup utility for mentor platform
 * Helps verify and initialize mentor database tables
 */

export interface DatabaseHealth {
  mentorInstitutionsExists: boolean;
  mentorProfilesExists: boolean;
  hasInstitutionData: boolean;
  errors: string[];
  suggestions: string[];
}

/**
 * Check if mentor database tables exist and are properly configured
 */
export const checkMentorDatabaseHealth = async (): Promise<DatabaseHealth> => {
  const health: DatabaseHealth = {
    mentorInstitutionsExists: false,
    mentorProfilesExists: false,
    hasInstitutionData: false,
    errors: [],
    suggestions: []
  };

  try {
    // Check if mentor_institutions table exists
    const { data: institutionsData, error: institutionsError } = await supabase
      .from('mentor_institutions')
      .select('count(*)')
      .limit(1);

    if (institutionsError) {
      if (institutionsError.code === 'PGRST116' || institutionsError.message.includes('does not exist')) {
        health.errors.push('mentor_institutions table does not exist');
        health.suggestions.push('Run the mentor platform database migration in Supabase SQL Editor');
      } else {
        health.errors.push(`Institution table error: ${institutionsError.message}`);
      }
    } else {
      health.mentorInstitutionsExists = true;
      
      // Check if there's sample data
      const { data: institutions, error: dataError } = await supabase
        .from('mentor_institutions')
        .select('*')
        .limit(5);

      if (!dataError && institutions && institutions.length > 0) {
        health.hasInstitutionData = true;
      } else {
        health.suggestions.push('Add sample institution data to mentor_institutions table');
      }
    }

    // Check if mentor_profiles table exists
    const { error: profilesError } = await supabase
      .from('mentor_profiles')
      .select('count(*)')
      .limit(1);

    if (profilesError) {
      if (profilesError.code === 'PGRST116' || profilesError.message.includes('does not exist')) {
        health.errors.push('mentor_profiles table does not exist');
      } else {
        health.errors.push(`Profile table error: ${profilesError.message}`);
      }
    } else {
      health.mentorProfilesExists = true;
    }

  } catch (error: any) {
    health.errors.push(`Database health check failed: ${error.message}`);
  }

  return health;
};

/**
 * Get sample institution data for fallback scenarios
 */
export const getSampleInstitutions = () => [
  {
    id: 'fallback-1',
    name: 'Harvard University',
    domain: 'harvard.edu',
    sso_provider: 'google',
    institution_type: 'university',
    country: 'USA',
    is_active: true,
    logo_url: null
  },
  {
    id: 'fallback-2',
    name: 'Stanford University',
    domain: 'stanford.edu',
    sso_provider: 'google',
    institution_type: 'university',
    country: 'USA',
    is_active: true,
    logo_url: null
  },
  {
    id: 'fallback-3',
    name: 'MIT',
    domain: 'mit.edu',
    sso_provider: 'microsoft',
    institution_type: 'university',
    country: 'USA',
    is_active: true,
    logo_url: null
  },
  {
    id: 'fallback-4',
    name: 'University of Oxford',
    domain: 'ox.ac.uk',
    sso_provider: 'microsoft',
    institution_type: 'university',
    country: 'UK',
    is_active: true,
    logo_url: null
  },
  {
    id: 'fallback-5',
    name: 'University of Cambridge',
    domain: 'cam.ac.uk',
    sso_provider: 'google',
    institution_type: 'university',
    country: 'UK',
    is_active: true,
    logo_url: null
  }
];

/**
 * Generate SQL migration script for manual execution
 */
export const getMigrationScript = (): string => {
  return `
-- =====================================================================
-- MENTOR PLATFORM DATABASE MIGRATION
-- =====================================================================
-- Copy and run this script in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query

-- Run the complete mentor platform schema
-- This will create all necessary tables and sample data

-- If you have the migration file, run this instead:
-- Copy the contents of: supabase/migrations/20250627000001_create_mentor_platform_schema.sql

-- Quick setup for mentor_institutions table only:
CREATE TABLE IF NOT EXISTS public.mentor_institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    sso_provider TEXT,
    sso_config JSONB DEFAULT '{}',
    institution_type TEXT,
    country TEXT,
    website_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample data
INSERT INTO mentor_institutions (name, domain, sso_provider, institution_type, country, is_active) VALUES
('Harvard University', 'harvard.edu', 'google', 'university', 'USA', true),
('Stanford University', 'stanford.edu', 'google', 'university', 'USA', true),
('MIT', 'mit.edu', 'microsoft', 'university', 'USA', true),
('University of Oxford', 'ox.ac.uk', 'microsoft', 'university', 'UK', true),
('University of Cambridge', 'cam.ac.uk', 'google', 'university', 'UK', true)
ON CONFLICT (domain) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE mentor_institutions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for active institutions
CREATE POLICY "Allow public read access to active institutions" ON mentor_institutions
    FOR SELECT USING (is_active = true);

SELECT 'Mentor institutions table created successfully!' as result;
  `.trim();
};

/**
 * Retry mechanism for database operations
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
};