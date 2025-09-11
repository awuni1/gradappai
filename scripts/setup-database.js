#!/usr/bin/env node

/**
 * GradApp Database Setup Script
 * 
 * This script helps automate the database setup process for GradApp.
 * It checks for required environment variables and provides setup instructions.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  log('\n' + '='.repeat(50), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(50), 'cyan');
}

function logStep(step, description) {
  log(`\n${step}. ${description}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function checkEnvironmentFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      logWarning('.env.local not found, but .env.example exists');
      log('Run: cp .env.example .env.local', 'blue');
    } else {
      logError('.env.local not found');
      log('Create .env.local with your Supabase credentials', 'blue');
    }
    return false;
  }
  
  logSuccess('.env.local file found');
  return true;
}

function checkEnvironmentVariables() {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    logError(`Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  logSuccess('All required environment variables found');
  return true;
}

function displayDatabaseSetupInstructions() {
  logHeader('DATABASE SETUP INSTRUCTIONS');
  
  logStep(1, 'Create Supabase Project');
  log('   • Go to https://supabase.com', 'blue');
  log('   • Create a new project', 'blue');
  log('   • Wait for the project to initialize', 'blue');
  
  logStep(2, 'Get Your Credentials');
  log('   • Go to Project Settings > API', 'blue');
  log('   • Copy your Project URL and anon public key', 'blue');
  log('   • Add them to .env.local file', 'blue');
  
  logStep(3, 'Run Database Schema');
  log('   • Go to Supabase Dashboard > SQL Editor', 'blue');
  log('   • Run GRADNET_DATABASE_SCHEMA.sql', 'blue');
  log('   • Run APPLICATION_TRACKING_SCHEMA.sql', 'blue');
  
  logStep(4, 'Verify Setup');
  log('   • Check that tables are created', 'blue');
  log('   • Run: npm run dev', 'blue');
  log('   • Test the application', 'blue');
}

function checkSchemaFiles() {
  const schemaFiles = [
    'GRADNET_DATABASE_SCHEMA.sql',
    'APPLICATION_TRACKING_SCHEMA.sql'
  ];
  
  let allFound = true;
  
  schemaFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      logSuccess(`${file} found`);
    } else {
      logError(`${file} not found`);
      allFound = false;
    }
  });
  
  return allFound;
}

function displayQuickCommands() {
  logHeader('QUICK COMMANDS');
  
  log('\n📦 Install Dependencies:', 'bright');
  log('   npm install', 'blue');
  
  log('\n🔧 Setup Environment:', 'bright');
  log('   cp .env.example .env.local', 'blue');
  log('   # Edit .env.local with your Supabase credentials', 'blue');
  
  log('\n🏗️  Development Server:', 'bright');
  log('   npm run dev', 'blue');
  
  log('\n🚀 Production Build:', 'bright');
  log('   npm run build', 'blue');
  log('   npm run preview', 'blue');
  
  log('\n📋 Additional Commands:', 'bright');
  log('   npm run lint          # Check code quality', 'blue');
  log('   npm run type-check     # TypeScript validation', 'blue');
}

function main() {
  logHeader('GRADAPP DATABASE SETUP');
  
  log('Welcome to GradApp Ascend Platform!', 'bright');
  log('This script will help you set up your database.\n');
  
  // Check if schema files exist
  logStep(1, 'Checking Schema Files');
  const schemaFilesExist = checkSchemaFiles();
  
  // Check environment file
  logStep(2, 'Checking Environment Configuration');
  const envFileExists = checkEnvironmentFile();
  
  // Load environment variables if file exists
  if (envFileExists) {
    try {
      require('dotenv').config({ path: '.env.local' });
      checkEnvironmentVariables();
    } catch (error) {
      logWarning('Could not load environment variables');
    }
  }
  
  // Display setup instructions
  displayDatabaseSetupInstructions();
  
  // Display quick commands
  displayQuickCommands();
  
  logHeader('NEXT STEPS');
  
  if (!envFileExists || !schemaFilesExist) {
    log('1. Complete the missing setup steps above', 'yellow');
    log('2. Run this script again to verify setup', 'yellow');
  } else {
    log('1. Complete the database schema setup in Supabase', 'green');
    log('2. Run: npm run dev', 'green');
    log('3. Open http://localhost:5173 in your browser', 'green');
  }
  
  log('\n📚 For detailed documentation, see:', 'bright');
  log('   • CLAUDE.md - Development guide', 'blue');
  log('   • DEPLOYMENT_GUIDE.md - Production setup', 'blue');
  log('   • TODO.md - Project status', 'blue');
  
  log('\n🆘 Need help?', 'bright');
  log('   • Check the troubleshooting section in CLAUDE.md', 'blue');
  log('   • Verify your Supabase credentials', 'blue');
  log('   • Ensure all schema files are run', 'blue');
  
  log('\n✨ Happy coding!', 'green');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };