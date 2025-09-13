#!/bin/bash

# 🚀 GradAppAI Production OAuth Setup Script
# This script helps configure OAuth for production deployment

echo "🔧 GradAppAI Production OAuth Configuration"
echo "==========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo ""
echo "📋 Current Configuration:"
echo "------------------------"

# Check environment variables
if [ -f ".env.production" ]; then
    echo "✅ .env.production file exists"
    
    # Extract key values
    APP_URL=$(grep "VITE_APP_URL" .env.production | cut -d '=' -f2)
    SUPABASE_URL=$(grep "VITE_SUPABASE_URL" .env.production | cut -d '=' -f2)
    
    echo "   App URL: $APP_URL"
    echo "   Supabase URL: $SUPABASE_URL"
else
    echo "❌ .env.production file not found"
    exit 1
fi

echo ""
echo "🎯 Required Configuration Changes:"
echo "--------------------------------"

echo ""
echo "1. 📡 Supabase Dashboard Configuration:"
echo "   Go to: https://supabase.com/dashboard/projects/[YOUR_PROJECT]/auth/settings"
echo ""
echo "   Set Site URL to:"
echo "   → https://www.gradappai.com"
echo ""
echo "   Add to Additional Redirect URLs:"
echo "   → https://www.gradappai.com/auth/callback"
echo "   → https://gradappai.com/auth/callback"
echo "   → https://www.gradappai.com/**"
echo "   → https://gradappai.com/**"

echo ""
echo "2. 🔑 Google Cloud Console Configuration:"
echo "   Go to: https://console.cloud.google.com/apis/credentials"
echo ""
echo "   Add to Authorized redirect URIs:"
if [ ! -z "$SUPABASE_URL" ]; then
    echo "   → ${SUPABASE_URL}/auth/v1/callback"
else
    echo "   → https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback"
fi
echo "   → https://www.gradappai.com/auth/callback"
echo "   → https://gradappai.com/auth/callback"

echo ""
echo "3. 🧪 Test Your Configuration:"
echo "   After making changes, visit:"
echo "   → https://www.gradappai.com"
echo "   → Try signing in with Google"
echo "   → Check browser console for errors"

echo ""
echo "4. 🐛 Debug Common Issues:"
echo "   • redirect_uri_mismatch: Check Google Console URIs match Supabase exactly"
echo "   • CORS errors: Ensure Supabase site URL matches your domain"
echo "   • Invalid redirect: Add all redirect URLs to Supabase settings"

echo ""
echo "📚 Additional Resources:"
echo "   • Full setup guide: OAUTH_PRODUCTION_SETUP.md"
echo "   • Debug utility: Open browser console and run debugOAuth.runFullDiagnostic()"

echo ""
echo "✨ Quick Commands to Remember:"
echo "   Build for production: npm run build"
echo "   Preview production: npm run preview"
echo "   Deploy to your host: [depends on your hosting provider]"

echo ""
echo "🎉 After completing these steps, your OAuth should work in production!"
echo "   If you still have issues, check the browser console and network tab."

echo ""
echo "Need help? Check these files:"
echo "   • OAUTH_PRODUCTION_SETUP.md (detailed guide)"
echo "   • .env.production (environment config)"
echo "   • src/utils/oauthDebug.ts (debugging tools)"
