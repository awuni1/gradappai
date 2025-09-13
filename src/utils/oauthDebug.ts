/**
 * OAuth Debug Utility for Production Troubleshooting
 * Add this to your browser console on production to debug OAuth issues
 */

// Helper: pick correct app origin for redirects
// - On localhost, keep current origin for dev
// - On any deployed host, force the canonical production domain
function getAppOrigin(): string {
  try {
    if (typeof window === 'undefined') return 'https://www.gradappai.com';
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return window.location.origin;
    }
    return 'https://www.gradappai.com';
  } catch {
    return 'https://www.gradappai.com';
  }
}

export const debugOAuth = {
  // Check current configuration
  checkConfig: () => {
    console.group('🔧 OAuth Configuration Check');
    
    const config = {
      currentURL: window.location.origin,
      supabaseURL: import.meta.env?.VITE_SUPABASE_URL,
      environment: import.meta.env?.VITE_APP_ENV || 'unknown',
      expectedProduction: 'https://www.gradappai.com',
      expectedCallback: `${getAppOrigin()}/auth/callback`
    };
    
    console.table(config);
    
    // Check if URLs match
    if (config.currentURL !== config.expectedProduction) {
      console.warn('⚠️ URL Mismatch: Current URL does not match expected production URL');
    }
    
    if (!config.supabaseURL) {
      console.error('❌ Supabase URL not configured');
    }
    
    console.groupEnd();
    return config;
  },

  // Test OAuth providers
  testProviders: async () => {
    console.group('🧪 OAuth Provider Test');
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    const testGoogle = async () => {
      try {
        console.log('Testing Google OAuth...');
        const result = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${getAppOrigin()}/auth/callback`,
            queryParams: {
              prompt: 'select_account'
            }
          }
        });
        
        if (result.error) {
          console.error('❌ Google OAuth Error:', result.error);
          return { provider: 'google', success: false, error: result.error.message };
        } else {
          console.log('✅ Google OAuth initiated successfully');
          return { provider: 'google', success: true };
        }
      } catch (error) {
        console.error('❌ Google OAuth Exception:', error);
        return { provider: 'google', success: false, error: error.message };
      }
    };

    const testGitHub = async () => {
      try {
        console.log('Testing GitHub OAuth...');
        const result = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: `${getAppOrigin()}/auth/callback`
          }
        });
        
        if (result.error) {
          console.error('❌ GitHub OAuth Error:', result.error);
          return { provider: 'github', success: false, error: result.error.message };
        } else {
          console.log('✅ GitHub OAuth initiated successfully');
          return { provider: 'github', success: true };
        }
      } catch (error) {
        console.error('❌ GitHub OAuth Exception:', error);
        return { provider: 'github', success: false, error: error.message };
      }
    };

    console.groupEnd();
    
    return {
      google: await testGoogle(),
      github: await testGitHub()
    };
  },

  // Check network requests
  monitorRequests: () => {
    console.log('🔍 Starting OAuth request monitoring...');
    console.log('Open Network tab and try OAuth sign-in to see requests');
    
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const urlString = url.toString();
      
      if (urlString.includes('supabase') && urlString.includes('auth')) {
        console.log('🌐 OAuth Request:', {
          url: urlString,
          method: options?.method || 'GET',
          timestamp: new Date().toISOString()
        });
      }
      
      const response = await originalFetch(...args);
      
      if (urlString.includes('supabase') && urlString.includes('auth')) {
        console.log('📡 OAuth Response:', {
          url: urlString,
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString()
        });
      }
      
      return response;
    };
    
    return () => {
      window.fetch = originalFetch;
      console.log('🔍 OAuth request monitoring stopped');
    };
  },

  // Common fixes
  commonFixes: () => {
    console.group('🛠️ Common OAuth Fixes');
    
    const fixes = [
      {
        issue: 'redirect_uri_mismatch',
        description: 'Google redirect URI doesn\'t match Supabase',
        solution: 'Update Google Console redirect URIs to include your Supabase callback URL'
      },
      {
        issue: 'Invalid redirect URL',
        description: 'Supabase doesn\'t allow your redirect URL',
        solution: 'Add your domain to Supabase Auth settings redirect URLs'
      },
      {
        issue: 'CORS policy error',
        description: 'Cross-origin request blocked',
        solution: 'Update Supabase site URL to match your production domain'
      },
      {
        issue: 'OAuth popup blocked',
        description: 'Browser blocks OAuth popup',
        solution: 'Use redirect method instead of popup, or disable popup blocker'
      }
    ];
    
    fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.issue}`);
      console.log(`   Problem: ${fix.description}`);
      console.log(`   Solution: ${fix.solution}`);
      console.log('');
    });
    
    console.groupEnd();
  },

  // Full diagnostic
  runFullDiagnostic: async () => {
    console.log('🚀 Running full OAuth diagnostic...');
    
    const config = debugOAuth.checkConfig();
    const providers = await debugOAuth.testProviders();
    debugOAuth.commonFixes();
    
    const diagnostic = {
      timestamp: new Date().toISOString(),
      config,
      providers,
      recommendations: []
    };
    
    // Add recommendations based on results
    if (config.currentURL !== config.expectedProduction) {
      diagnostic.recommendations.push('Update production URL configuration');
    }
    
    if (!providers.google.success) {
      diagnostic.recommendations.push('Fix Google OAuth configuration');
    }
    
    if (!providers.github.success) {
      diagnostic.recommendations.push('Fix GitHub OAuth configuration');
    }
    
    console.log('📊 Full Diagnostic Results:', diagnostic);
    
    return diagnostic;
  }
};

// Auto-run basic checks in production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  console.log('🔧 GradAppAI OAuth Debug Utility Loaded');
  console.log('Run debugOAuth.runFullDiagnostic() for complete analysis');
}

export default debugOAuth;
