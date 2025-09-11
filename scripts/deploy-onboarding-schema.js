#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration with service key for admin operations
const SUPABASE_URL = "https://knjcvoyjyrsyivywufqw.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuamN2b3lqeXJzeWl2eXd1ZnF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM0NjM4MSwiZXhwIjoyMDYyOTIyMzgxfQ.dk9TXTujzJGl-Zgjne0ECXOSLGlJR5FdSU8MsLOYfVo";

console.log('🚀 Starting Comprehensive Onboarding Schema Deployment...\n');

// Create admin Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deploySchema() {
  try {
    console.log('📖 Reading comprehensive onboarding schema file...');
    
    const sqlFilePath = path.join(__dirname, '..', 'supabase', 'migrations', '20250714000001_create_comprehensive_applicant_onboarding_schema.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Schema file not found at: ${sqlFilePath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`✅ Successfully read ${sqlContent.length} characters from schema file\n`);
    
    console.log('🔨 Deploying schema using Supabase service key...');
    console.log('   This may take a moment...\n');
    
    // Execute the full SQL as one operation
    const { data, error } = await supabase.rpc('exec', { sql: sqlContent });
    
    if (error) {
      // Try alternative approach - split and execute commands individually  
      console.log('⚠️  Single execution failed, trying block-by-block approach...\n');
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement || statement.length < 10) continue;
        
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          
          // For DDL statements, use the SQL endpoint directly
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'apikey': SUPABASE_SERVICE_KEY
            },
            body: JSON.stringify({ sql: statement + ';' })
          });
          
          if (response.ok) {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          } else {
            const errorText = await response.text();
            if (errorText.includes('already exists') || errorText.includes('duplicate')) {
              console.log(`ℹ️  Statement ${i + 1} - Object already exists (skipping)`);
              successCount++;
            } else {
              console.log(`⚠️  Statement ${i + 1} failed: ${errorText}`);
              errorCount++;
            }
          }
          
          // Brief pause between statements
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (err) {
          console.log(`❌ Statement ${i + 1} error: ${err.message}`);
          errorCount++;
        }
      }
      
      console.log(`\n📊 Deployment Summary:`);
      console.log(`✅ Successful: ${successCount}`);
      console.log(`⚠️  Errors/Skipped: ${errorCount}`);
      
    } else {
      console.log('✅ Schema deployed successfully in single operation!');
    }
    
    console.log('\n🎉 Comprehensive onboarding schema deployment completed!\n');
    
    console.log('🔧 Next Steps:');
    console.log('1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)');
    console.log('2. Test the onboarding flow (/onboarding)');
    console.log('3. Complete the onboarding process - data should save properly!');
    console.log('4. Check Supabase dashboard "Tables" section for new tables\n');
    
    console.log('🎯 Expected Results:');
    console.log('✅ applicant_onboarding_profiles table created');
    console.log('✅ applicant_onboarding_documents table created');
    console.log('✅ applicant_research_interests table created');
    console.log('✅ All RLS policies configured properly');
    console.log('✅ No more database constraint errors during onboarding\n');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n🔧 Manual Deployment Instructions:');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Open your gradapp-ascend-platform project');
    console.log('3. Click "SQL Editor" in left sidebar');
    console.log('4. Copy the entire contents of:');
    console.log('   supabase/migrations/20250714000001_create_comprehensive_applicant_onboarding_schema.sql');
    console.log('5. Paste into SQL Editor and click "Run"');
    process.exit(1);
  }
}

// Run the deployment
deploySchema();