/**
 * Database schema validation and repair utilities
 */

import { supabase } from '@/integrations/supabase/client';

export interface SchemaCheckResult {
  tableExists: boolean;
  missingColumns: string[];
  availableColumns: string[];
  recommendedAction: string;
  sqlToRun?: string;
}

/**
 * Check and validate database schema for CV upload functionality
 */
export class DatabaseSchemaChecker {
  
  /**
   * Check if the resumes table has all required columns
   */
  static async checkResumesTableSchema(): Promise<SchemaCheckResult> {
    const requiredColumns = [
      'id',
      'user_id', 
      'cv_url',
      'parsed_text',
      'created_at',
      'updated_at',
      // Enhanced columns
      'original_filename',
      'file_size',
      'file_type',
      'parsing_status',
      'extraction_confidence',
      'last_parsed_at',
      'parsed_data',
      'parsing_errors'
    ];

    try {
      // Check if table exists and get column information
      const { data: columns, error } = await supabase
        .rpc('get_table_columns', { table_name: 'resumes' })
        .single();

      if (error) {
        // Try alternative method to check columns
        const { data: testData, error: testError } = await supabase
          .from('resumes')
          .select('*')
          .limit(0);

        if (testError) {
          if (testError.message.includes('relation "public.resumes" does not exist')) {
            return {
              tableExists: false,
              missingColumns: requiredColumns,
              availableColumns: [],
              recommendedAction: 'CREATE_TABLE',
              sqlToRun: this.getCreateTableSQL()
            };
          }
          
          // Try to get column info from error message or use introspection
          return await this.checkColumnsViaIntrospection(requiredColumns);
        }
      }

      // If we have column data, analyze it
      const availableColumns = columns ? Object.keys(columns) : [];
      const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));

      return {
        tableExists: true,
        missingColumns,
        availableColumns,
        recommendedAction: missingColumns.length > 0 ? 'ADD_COLUMNS' : 'SCHEMA_OK',
        sqlToRun: missingColumns.length > 0 ? this.getAddColumnsSQL(missingColumns) : undefined
      };

    } catch (error) {
      console.error('Schema check error:', error);
      return await this.checkColumnsViaIntrospection(requiredColumns);
    }
  }

  /**
   * Alternative method to check columns via introspection
   */
  private static async checkColumnsViaIntrospection(requiredColumns: string[]): Promise<SchemaCheckResult> {
    try {
      // Try to insert a test record to see which columns are missing
      const testData: any = {
        user_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID for test
        cv_url: 'test'
      };

      // Add all possible columns to test
      requiredColumns.forEach(col => {
        if (col !== 'id' && col !== 'user_id' && col !== 'cv_url') {
          testData[col] = null;
        }
      });

      const { error } = await supabase
        .from('resumes')
        .insert(testData);

      if (error) {
        const missingColumns: string[] = [];
        
        // Parse error message to identify missing columns
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          const columnMatch = error.message.match(/column "([^"]+)"/);
          if (columnMatch) {
            missingColumns.push(columnMatch[1]);
          }
        }

        // Determine available columns (required minus missing)
        const availableColumns = requiredColumns.filter(col => !missingColumns.includes(col));

        return {
          tableExists: true,
          missingColumns,
          availableColumns,
          recommendedAction: 'ADD_COLUMNS',
          sqlToRun: this.getAddColumnsSQL(missingColumns)
        };
      }

      // If insert succeeded (unlikely with invalid UUID), schema is probably OK
      return {
        tableExists: true,
        missingColumns: [],
        availableColumns: requiredColumns,
        recommendedAction: 'SCHEMA_OK'
      };

    } catch (error) {
      return {
        tableExists: false,
        missingColumns: requiredColumns,
        availableColumns: [],
        recommendedAction: 'CREATE_TABLE',
        sqlToRun: this.getCreateTableSQL()
      };
    }
  }

  /**
   * Generate SQL to add missing columns
   */
  private static getAddColumnsSQL(missingColumns: string[]): string {
    const columnDefinitions: Record<string, string> = {
      'original_filename': 'ALTER TABLE public.resumes ADD COLUMN original_filename TEXT;',
      'file_size': 'ALTER TABLE public.resumes ADD COLUMN file_size INTEGER;',
      'file_type': 'ALTER TABLE public.resumes ADD COLUMN file_type TEXT;',
      'parsing_status': `
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parsing_status') THEN
            CREATE TYPE parsing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
          END IF;
        END $$;
        ALTER TABLE public.resumes ADD COLUMN parsing_status parsing_status DEFAULT 'pending';`,
      'extraction_confidence': 'ALTER TABLE public.resumes ADD COLUMN extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1);',
      'last_parsed_at': 'ALTER TABLE public.resumes ADD COLUMN last_parsed_at TIMESTAMP WITH TIME ZONE;',
      'parsed_data': 'ALTER TABLE public.resumes ADD COLUMN parsed_data JSONB;',
      'parsing_errors': 'ALTER TABLE public.resumes ADD COLUMN parsing_errors TEXT[];'
    };

    const sqlStatements = missingColumns
      .filter(col => columnDefinitions[col])
      .map(col => columnDefinitions[col])
      .join('\n\n');

    return sqlStatements;
  }

  /**
   * Generate SQL to create the complete table
   */
  private static getCreateTableSQL(): string {
    return `
-- Create complete resumes table with all required columns
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cv_url TEXT NOT NULL,
    original_filename TEXT,
    file_size INTEGER,
    file_type TEXT,
    
    -- Text extraction
    parsed_text TEXT,
    
    -- Enhanced parsing fields
    parsed_data JSONB,
    parsing_status parsing_status DEFAULT 'pending',
    extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
    parsing_errors TEXT[],
    last_parsed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE(user_id, cv_url)
);

-- Create parsing_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE parsing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
`;
  }

  /**
   * Perform automatic schema repair
   */
  static async repairSchema(): Promise<{ success: boolean; message: string; sqlExecuted?: string }> {
    try {
      const schemaCheck = await this.checkResumesTableSchema();

      if (schemaCheck.recommendedAction === 'SCHEMA_OK') {
        return {
          success: true,
          message: 'Database schema is already up to date!'
        };
      }

      if (!schemaCheck.sqlToRun) {
        return {
          success: false,
          message: 'No SQL repair script available'
        };
      }

      // In a real application, you'd execute the SQL here
      // For now, we'll just return the SQL that should be run
      return {
        success: false,
        message: `Database schema needs repair. Please run the following SQL in your Supabase SQL editor:\n\n${schemaCheck.sqlToRun}`,
        sqlExecuted: schemaCheck.sqlToRun
      };

    } catch (error) {
      return {
        success: false,
        message: `Schema repair failed: ${error.message}`
      };
    }
  }

  /**
   * Quick schema validation for UI display
   */
  static async quickSchemaCheck(): Promise<{ isValid: boolean; message: string }> {
    try {
      const schemaCheck = await this.checkResumesTableSchema();
      
      if (!schemaCheck.tableExists) {
        return {
          isValid: false,
          message: 'Resumes table does not exist. Please run database migrations.'
        };
      }

      if (schemaCheck.missingColumns.length > 0) {
        return {
          isValid: false,
          message: `Missing columns: ${schemaCheck.missingColumns.join(', ')}. Please update your database schema.`
        };
      }

      return {
        isValid: true,
        message: 'Database schema is valid'
      };

    } catch (error) {
      return {
        isValid: false,
        message: `Schema validation failed: ${error.message}`
      };
    }
  }
}