# Supabase Database Integration

## Database Access
- **Supabase Project ID**: yeqfsjzcvqgannxdivau
- **MCP Server**: Configured with Supabase MCP server for database access
- **Database Type**: PostgreSQL via Supabase

## Environment Variables Required
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_GEMINI_API_KEY` - Google Gemini AI API key for CV analysis

## Key Database Features
- User authentication and roles
- CV analysis and storage
- Document management with file storage
- Chat and messaging system
- University and application tracking
- Mentor onboarding system
- GradNet social networking features

## Database Schema Highlights
- Multiple SQL schema files available for different components
- Storage buckets for file management
- Comprehensive migration system
- Edge functions deployment capability

## MCP Configuration
The project has a Supabase MCP server configured in `.mcp.json` that provides direct database access through Claude Code.