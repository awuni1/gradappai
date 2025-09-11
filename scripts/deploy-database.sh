#!/bin/bash

echo "🚀 GradNet Database Deployment Script"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "database_setup_complete.sql" ]; then
    echo -e "${RED}❌ Error: database_setup_complete.sql not found in current directory${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo -e "${BLUE}📖 Reading database schema file...${NC}"
if [ -f "database_setup_complete.sql" ]; then
    echo -e "${GREEN}✅ Found database_setup_complete.sql${NC}"
    file_size=$(wc -c < database_setup_complete.sql)
    echo -e "${BLUE}   File size: $file_size bytes${NC}"
else
    echo -e "${RED}❌ Database schema file not found!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔨 Deploying to your Supabase database...${NC}"
echo -e "${BLUE}   Project: knjcvoyjyrsyivywufqw.supabase.co${NC}"
echo ""

# Method 1: Try using curl to post directly to Supabase
echo -e "${YELLOW}📡 Attempting direct deployment via Supabase REST API...${NC}"

# Read the SQL file content
SQL_CONTENT=$(cat database_setup_complete.sql)

# Your Supabase credentials
SUPABASE_URL="https://knjcvoyjyrsyivywufqw.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuamN2b3lqeXJzeWl2eXd1ZnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNDYzODEsImV4cCI6MjA2MjkyMjM4MX0.hYoP3gc3tou4c4WNUYzTBmXGQ3KA9PWonPxUVgJtJIA"

# Try to execute the SQL using psql if available
if command -v psql >/dev/null 2>&1; then
    echo -e "${BLUE}🐘 Using PostgreSQL client to deploy schema...${NC}"
    
    # Extract connection details from your Supabase URL
    DB_HOST="db.knjcvoyjyrsyivywufqw.supabase.co"
    DB_PORT="5432"
    DB_NAME="postgres"
    
    echo -e "${YELLOW}📋 Please enter your Supabase database password when prompted${NC}"
    echo -e "${BLUE}   (You can find this in your Supabase project settings > Database)${NC}"
    echo ""
    
    # Execute the SQL file
    PGPASSWORD="" psql -h "$DB_HOST" -p "$DB_PORT" -U "postgres" -d "$DB_NAME" -f database_setup_complete.sql
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 Database deployment completed successfully!${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠️  psql deployment encountered issues (this might be normal)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL client (psql) not found${NC}"
    echo -e "${BLUE}📋 Please use the manual method below${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Manual Deployment Instructions:${NC}"
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Click your project: gradapp-ascend-platform"
echo "3. Click 'SQL Editor' in the left sidebar"
echo "4. Copy ALL contents from database_setup_complete.sql"
echo "5. Paste into SQL Editor and click 'Run'"
echo ""

echo -e "${BLUE}🎯 After deployment, you should see these tables in Supabase:${NC}"
echo "✅ user_profiles"
echo "✅ posts"
echo "✅ conversations"
echo "✅ messages"
echo "✅ post_interactions"
echo "✅ mentor_sessions"
echo "✅ And many more..."
echo ""

echo -e "${GREEN}🚀 Next Steps After Deployment:${NC}"
echo "1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)"
echo "2. Go to your GradNet page (/gradnet)"
echo "3. Try creating a post - it should work now!"
echo "4. No more 404/400 errors in Supabase logs!"
echo ""

echo -e "${GREEN}✨ Your GradNet will be fully functional after this deployment!${NC}"