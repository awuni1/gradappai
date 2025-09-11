import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  Copy, 
  RefreshCw,
  Terminal,
  FileCode
} from 'lucide-react';
import { DatabaseHealthCheck, checkDatabaseHealth } from '@/utils/databaseHealth';
import { toast } from 'sonner';

interface DatabaseSetupWizardProps {
  onSetupComplete?: () => void;
  healthCheck?: DatabaseHealthCheck | null;
}

const DatabaseSetupWizard: React.FC<DatabaseSetupWizardProps> = ({ 
  onSetupComplete,
  healthCheck: initialHealthCheck 
}) => {
  const [healthCheck, setHealthCheck] = useState<DatabaseHealthCheck | null>(initialHealthCheck || null);
  const [isChecking, setIsChecking] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      const result = await checkDatabaseHealth();
      setHealthCheck(result);
      
      if (result.isHealthy) {
        toast.success('Database setup is complete!');
        onSetupComplete?.();
      }
    } catch (_error) {
      console.error('Health check failed:', error);
      toast.error('Failed to check database status');
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const SQL_SCRIPT = `-- =====================================================================
-- SUPABASE SETUP: Enhanced Resume Parsing Columns
-- =====================================================================
-- Run this script in your Supabase Dashboard > SQL Editor

-- Step 1: Create parsing status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parsing_status') THEN
        CREATE TYPE parsing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
    END IF;
END $$;

-- Step 2: Check if resumes table exists, if not create it
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cv_url TEXT NOT NULL,
    parsed_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 3: Add missing columns one by one
DO $$ 
BEGIN
    -- Add original_filename column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resumes' AND column_name = 'original_filename') THEN
        ALTER TABLE public.resumes ADD COLUMN original_filename TEXT;
    END IF;

    -- Add file_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resumes' AND column_name = 'file_size') THEN
        ALTER TABLE public.resumes ADD COLUMN file_size INTEGER;
    END IF;

    -- Add file_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resumes' AND column_name = 'file_type') THEN
        ALTER TABLE public.resumes ADD COLUMN file_type TEXT;
    END IF;

    -- Add parsed_data column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resumes' AND column_name = 'parsed_data') THEN
        ALTER TABLE public.resumes ADD COLUMN parsed_data JSONB;
    END IF;

    -- Add parsing_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resumes' AND column_name = 'parsing_status') THEN
        ALTER TABLE public.resumes ADD COLUMN parsing_status parsing_status DEFAULT 'pending';
    END IF;

    -- Add extraction_confidence column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resumes' AND column_name = 'extraction_confidence') THEN
        ALTER TABLE public.resumes ADD COLUMN extraction_confidence DECIMAL(3,2) 
        CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1);
    END IF;

    -- Add parsing_errors column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resumes' AND column_name = 'parsing_errors') THEN
        ALTER TABLE public.resumes ADD COLUMN parsing_errors TEXT[];
    END IF;

    -- Add last_parsed_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resumes' AND column_name = 'last_parsed_at') THEN
        ALTER TABLE public.resumes ADD COLUMN last_parsed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_parsing_status ON public.resumes(parsing_status);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at);

-- Step 5: Enable RLS and create policies
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can create their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;

CREATE POLICY "Users can view their own resumes" 
  ON public.resumes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resumes" 
  ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes" 
  ON public.resumes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes" 
  ON public.resumes FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Create resumes storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Create storage policies
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;

CREATE POLICY "Users can upload their own resumes" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own resumes" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own resumes" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own resumes" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Success message
SELECT 'Resume parsing database setup completed successfully!' as message;`;

  if (!healthCheck) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Database className="h-5 w-5" />
            Database Setup Check
          </CardTitle>
          <CardDescription className="text-blue-700">
            Let's verify your database is ready for CV/Resume parsing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runHealthCheck}
            disabled={isChecking}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking Database...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Check Database Setup
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (healthCheck.isHealthy) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <span>Database setup is complete! CV/Resume parsing is ready to use.</span>
            <Button 
              onClick={runHealthCheck}
              variant="outline"
              size="sm"
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Recheck
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <p className="font-medium">Database setup required for CV/Resume parsing</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {healthCheck.missingTables.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {healthCheck.missingTables.length} missing tables
                </Badge>
              )}
              {healthCheck.missingColumns.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {healthCheck.missingColumns.length} missing columns
                </Badge>
              )}
              {healthCheck.errors.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {healthCheck.errors.length} errors
                </Badge>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Setup Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-600" />
            Database Setup Guide
          </CardTitle>
          <CardDescription>
            Follow these steps to enable CV/Resume parsing functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Step 1: Open Supabase Dashboard */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Open Supabase Dashboard</h3>
              <p className="text-sm text-gray-600 mt-1">
                Navigate to your Supabase project dashboard
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  window.open('https://supabase.com/dashboard', '_blank');
                  setCurrentStep(2);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase Dashboard
              </Button>
            </div>
          </div>

          {/* Step 2: Copy SQL Script */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Copy Database Setup Script</h3>
              <p className="text-sm text-gray-600 mt-1">
                Copy the SQL script below to set up your database
              </p>
              <div className="mt-3 relative">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto max-h-64 overflow-y-auto">
                  <pre>{SQL_SCRIPT}</pre>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    copyToClipboard(SQL_SCRIPT);
                    setCurrentStep(3);
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Script
                </Button>
              </div>
            </div>
          </div>

          {/* Step 3: Run SQL Script */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Execute SQL Script</h3>
              <div className="text-sm text-gray-600 mt-1 space-y-1">
                <p>In your Supabase dashboard:</p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Click on "SQL Editor" in the left sidebar</li>
                  <li>Click "New query"</li>
                  <li>Paste the copied SQL script</li>
                  <li>Click "Run" to execute the script</li>
                  <li>Look for success message: "Resume parsing database setup completed successfully!"</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 4: Verify Setup */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                4
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Verify Database Setup</h3>
              <p className="text-sm text-gray-600 mt-1">
                Run a final check to confirm everything is working
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => {
                    runHealthCheck();
                    setCurrentStep(4);
                  }}
                  disabled={isChecking}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Setup
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  Start Over
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <FileCode className="h-5 w-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700">
          <p className="text-sm mb-3">
            If you encounter issues during setup:
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Make sure you're logged into the correct Supabase account</li>
            <li>Verify you selected the right project (knjcvoyjyrsyivywufqw)</li>
            <li>Check that you have admin permissions on the project</li>
            <li>Try refreshing your browser after running the SQL</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseSetupWizard;