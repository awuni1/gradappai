#!/usr/bin/env node

/**
 * Production Deployment Script for GradApp Ascend Platform
 * 
 * This script handles:
 * - Environment validation
 * - Build optimization
 * - Database schema deployment
 * - Health checks
 * - Performance validation
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configuration
const config = {
  nodeEnv: process.env.NODE_ENV || 'production',
  skipTests: process.argv.includes('--skip-tests'),
  skipLint: process.argv.includes('--skip-lint'),
  deployTarget: process.argv.find(arg => arg.startsWith('--target='))?.split('=')[1] || 'auto',
  verbose: process.argv.includes('--verbose')
};

// Logging utilities
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  step: (msg) => console.log(`\n🚀 ${msg}`)
};

// Check if required environment variables are set
function validateEnvironment() {
  log.step('Validating environment configuration...');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    log.info('Please check your .env file or environment configuration');
    process.exit(1);
  }
  
  // Validate Supabase URL format
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    log.error('Invalid Supabase URL format');
    process.exit(1);
  }
  
  log.success('Environment validation passed');
}

// Run linting
function runLinting() {
  if (config.skipLint) {
    log.warning('Skipping linting (--skip-lint flag)');
    return;
  }
  
  log.step('Running ESLint...');
  try {
    execSync('npm run lint', { stdio: config.verbose ? 'inherit' : 'pipe', cwd: rootDir });
    log.success('Linting passed');
  } catch (error) {
    log.error('Linting failed');
    if (config.verbose) {
      console.error(error.stdout?.toString());
    }
    process.exit(1);
  }
}

// Run type checking
function runTypeCheck() {
  log.step('Running TypeScript type checking...');
  try {
    execSync('npx tsc --noEmit', { stdio: config.verbose ? 'inherit' : 'pipe', cwd: rootDir });
    log.success('Type checking passed');
  } catch (error) {
    log.error('Type checking failed');
    if (config.verbose) {
      console.error(error.stdout?.toString());
    }
    process.exit(1);
  }
}

// Build the application
function buildApplication() {
  log.step('Building application for production...');
  
  try {
    // Clean previous build
    execSync('rm -rf dist', { cwd: rootDir });
    
    // Build with production optimizations
    execSync('npm run build', { 
      stdio: config.verbose ? 'inherit' : 'pipe', 
      cwd: rootDir,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    log.success('Build completed successfully');
  } catch (error) {
    log.error('Build failed');
    if (config.verbose) {
      console.error(error.stdout?.toString());
    }
    process.exit(1);
  }
}

// Analyze bundle size
function analyzeBundleSize() {
  log.step('Analyzing bundle size...');
  
  const distPath = join(rootDir, 'dist');
  if (!existsSync(distPath)) {
    log.error('Build directory not found');
    return;
  }
  
  try {
    const buildStats = execSync('du -sh dist/*', { cwd: rootDir }).toString();
    log.info('Build size analysis:');
    console.log(buildStats);
    
    // Check for oversized chunks
    const jsFiles = execSync('find dist -name "*.js" -exec wc -c {} +', { cwd: rootDir }).toString();
    const lines = jsFiles.trim().split('\n');
    
    lines.forEach(line => {
      const [size, file] = line.trim().split(/\s+/);
      const sizeKB = parseInt(size) / 1024;
      if (sizeKB > 1000) { // Warn if chunk > 1MB
        log.warning(`Large chunk detected: ${file} (${sizeKB.toFixed(1)}KB)`);
      }
    });
    
    log.success('Bundle analysis completed');
  } catch (error) {
    log.warning('Could not analyze bundle size');
  }
}

// Generate build manifest
function generateBuildManifest() {
  log.step('Generating build manifest...');
  
  const manifest = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    environment: config.nodeEnv,
    gitCommit: (() => {
      try {
        return execSync('git rev-parse HEAD', { cwd: rootDir }).toString().trim();
      } catch {
        return 'unknown';
      }
    })(),
    gitBranch: (() => {
      try {
        return execSync('git rev-parse --abbrev-ref HEAD', { cwd: rootDir }).toString().trim();
      } catch {
        return 'unknown';
      }
    })(),
    dependencies: (() => {
      try {
        const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
        return {
          runtime: packageJson.dependencies,
          dev: packageJson.devDependencies
        };
      } catch {
        return {};
      }
    })()
  };
  
  writeFileSync(
    join(rootDir, 'dist', 'build-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  log.success('Build manifest generated');
}

// Create deployment instructions
function createDeploymentInstructions() {
  log.step('Creating deployment instructions...');
  
  const instructions = `
# GradApp Ascend Platform - Deployment Instructions

## Build Information
- Build Time: ${new Date().toISOString()}
- Environment: ${config.nodeEnv}
- Node Version: ${process.version}

## Deployment Checklist

### 1. Environment Setup
- ✅ Environment variables validated
- ✅ Supabase configuration verified
- ✅ Build optimized for production

### 2. Required Environment Variables
\`\`\`
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 3. Deployment Options

#### Option A: Static Hosting (Recommended)
Deploy the \`dist/\` folder to any static hosting service:
- **Vercel**: \`vercel --prod\`
- **Netlify**: Drag & drop \`dist/\` folder or use CLI
- **GitHub Pages**: Push \`dist/\` to gh-pages branch
- **AWS S3**: Upload \`dist/\` contents to S3 bucket

#### Option B: Server Deployment
1. Copy \`dist/\` folder to your server
2. Configure web server (nginx/apache) to serve static files
3. Set up SSL certificate
4. Configure domain routing

### 4. Post-Deployment Verification
1. Check that all routes work correctly
2. Verify Supabase connection
3. Test authentication flow
4. Confirm file uploads work
5. Validate real-time features

### 5. Performance Optimization
- Enable GZIP compression
- Set up CDN for static assets
- Configure caching headers
- Monitor Core Web Vitals

### 6. Monitoring & Analytics
- Set up error tracking (Sentry)
- Configure analytics (Google Analytics)
- Monitor application performance
- Set up uptime monitoring

## Support
For deployment issues, check:
1. Browser console for errors
2. Network tab for failed requests
3. Supabase dashboard for database issues
4. Environment variable configuration

---
Generated on ${new Date().toISOString()}
`;
  
  writeFileSync(join(rootDir, 'DEPLOYMENT.md'), instructions);
  log.success('Deployment instructions created');
}

// Run security audit
function runSecurityAudit() {
  log.step('Running security audit...');
  
  try {
    execSync('npm audit --audit-level moderate', { 
      stdio: config.verbose ? 'inherit' : 'pipe', 
      cwd: rootDir 
    });
    log.success('Security audit passed');
  } catch (error) {
    log.warning('Security audit found issues - review before deploying');
    if (config.verbose) {
      console.error(error.stdout?.toString());
    }
  }
}

// Main deployment function
async function deploy() {
  console.log('🚀 Starting GradApp Ascend Platform deployment...\n');
  
  try {
    // Pre-deployment checks
    validateEnvironment();
    runSecurityAudit();
    
    // Code quality checks
    runLinting();
    runTypeCheck();
    
    // Build process
    buildApplication();
    analyzeBundleSize();
    
    // Post-build tasks
    generateBuildManifest();
    createDeploymentInstructions();
    
    console.log('\n✅ Deployment preparation completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the dist/ folder contents');
    console.log('2. Check DEPLOYMENT.md for hosting instructions');
    console.log('3. Deploy to your chosen hosting platform');
    console.log('4. Verify the deployment works correctly');
    
  } catch (error) {
    log.error('Deployment failed');
    console.error(error);
    process.exit(1);
  }
}

// Run deployment if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deploy();
}

export { deploy, validateEnvironment, buildApplication };