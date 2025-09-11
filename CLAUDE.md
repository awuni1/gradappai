# GradApp Ascend Platform - Claude Development Guide

## 🎯 **Project Overview**
**GradApp Ascend Platform** is a comprehensive graduate school application management system built with React, TypeScript, and Supabase. It helps students find, track, and manage their graduate school applications with social networking features.

## 📋 **Table of Contents**
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Component Structure](#component-structure)
4. [Key Features](#key-features)
5. [Development Workflow](#development-workflow)
6. [Best Practices](#best-practices)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [MCP Integration Guide](#mcp-integration-guide)
9. [Deployment Guide](#deployment-guide)

---

## 🏗️ **Architecture Overview**

### **Tech Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Routing**: React Router v6
- **State Management**: React Context + useState/useEffect
- **Charts**: Recharts
- **Icons**: Lucide React

### **Project Structure**
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── dashboard/       # Dashboard-specific components
│   ├── onboarding/      # Onboarding flow components
│   │   └── CVUpload.tsx          # Basic CV upload
│   ├── gradnet/         # Social networking components
│   └── video/           # Video call components
├── contexts/            # React contexts for state management
├── hooks/               # Custom React hooks
├── integrations/        # Third-party integrations (Supabase)
├── pages/               # Page components
├── services/            # API service layers
│   ├── authService.ts              # Authentication service
│   ├── dashboardService.ts         # Dashboard data management
│   └── onboardingService.ts        # Onboarding flow management
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

---

## 🗄️ **Database Schema**

### **Core Tables**

#### **Application Tracking System**
```sql
-- Main application tracking tables
applications              # User application progress
application_requirements  # Requirements checklist
deadlines                # Important dates
selected_universities     # User's chosen schools
university_programs       # Program database
```

#### **Social Networking (GradNet)**
```sql
-- Social platform tables
user_profiles            # Enhanced user profiles
posts                    # Social media posts
user_connections         # Network connections
conversations            # Message threads
messages                 # Chat messages
```

#### **User Management**
```sql
-- User data tables
academic_profiles        # Academic background
research_interests       # Research areas
user_research_interests  # User interest mapping
resumes                  # CV storage
```

### **Key Relationships**
- Users → Applications → Requirements & Deadlines
- Users → Profiles → Research Interests
- Users → Social Posts & Connections
- Universities → Programs → Matches

---

## 🧩 **Component Structure**

### **Dashboard Components**
```typescript
Dashboard.tsx                    # Main dashboard page
├── ApplicationProgressSection   # Application tracking
├── MatchedUniversitiesSection  # University matches (links to chat)
└── MatchedProfessorsSection    # Professor recommendations
```

### **Core Pages**
```typescript
Auth.tsx                    # Authentication flow
Index.tsx                  # Landing page
Dashboard.tsx              # Main user dashboard
UniversityMatchingChat.tsx # AI-powered university matching with chat
GradNet.tsx               # Social networking platform
Settings.tsx              # User settings & profile
```

### **Shared Components**
```typescript
AuthenticatedHeader.tsx  # Navigation header
Footer.tsx              # Site footer
RoleSelectionModal.tsx  # User role selection
```

---

## ⚡ **Key Features**

### **1. Application Tracking**
- **Progress Dashboard**: Visual progress tracking for applications
- **Requirements Checklist**: Track documents, tests, deadlines
- **Real-time Updates**: Live status synchronization
- **Smart Notifications**: Deadline reminders and status alerts

### **2. University Management**
- **University Search**: Browse and filter university programs
- **Application Status**: Track application progress per university
- **Document Management**: Upload and organize application documents
- **Deadline Tracking**: Keep track of important dates

### **3. GradNet Social Platform**
- **Professional Networking**: Connect with peers and mentors
- **Knowledge Sharing**: Share experiences and resources
- **Mentorship System**: Structured mentor-mentee relationships
- **Event Management**: Virtual workshops and networking events

### **4. Document Management**
- **CV Upload**: Basic resume upload and storage
- **Document Organization**: Categorize and manage application documents
- **Collaborative Editing**: Shared document review
- **Version Control**: Track document changes
- **Template Library**: Pre-built application templates

---

## 🔄 **Development Workflow**

### **1. Setting Up Development Environment**
```bash
# Clone and setup
git clone [repository-url]
cd gradapp-ascend-platform
npm install

# Environment setup
cp .env.example .env.local
# Add Supabase credentials

# Start development server
npm run dev
```

### **2. Database Setup**
```sql
-- Run in Supabase SQL Editor
-- 1. Core GradNet schema
\i GRADNET_DATABASE_SCHEMA.sql

-- 2. Application tracking schema  
\i APPLICATION_TRACKING_SCHEMA.sql
```

### **3. Feature Development Process**
1. **Planning**: Update TODO.md with new features
2. **Database**: Create/update schema if needed
3. **Services**: Implement API service layer
4. **Components**: Build UI components
5. **Testing**: Test functionality and error cases
6. **Integration**: Connect with real-time features

---

## 📝 **Best Practices**

### **Code Organization**
```typescript
// Service layer pattern
export const myService = {
  async getData() {
    const { data, error } = await supabase
      .from('table')
      .select('*');
    return { data, error };
  }
};

// Component error handling
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

try {
  const result = await myService.getData();
  if (result.error) throw result.error;
  setData(result.data);
} catch (err) {
  setError(err.message);
  // Graceful fallback
} finally {
  setLoading(false);
}
```

### **Supabase Integration**
```typescript
// RLS Policy Example
CREATE POLICY "Users can view own data" 
ON table_name FOR SELECT 
USING (auth.uid() = user_id);

// Real-time subscription
useEffect(() => {
  const subscription = supabase
    .channel('table_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'table_name'
    }, handleChange)
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### **Error Handling Strategy**
```typescript
// Production-ready error handling
const handleError = (error: Error, context: string) => {
  console.error(`Error in ${context}:`, error);
  
  // User-friendly messages
  toast({
    title: 'Something went wrong',
    description: 'Please try again later',
    variant: 'destructive'
  });
  
  // Graceful fallbacks
  setData(defaultData);
};
```

---

## 🛠️ **Common Issues & Solutions**

### **Database Connection Issues**
```typescript
// Problem: Table doesn't exist error
// Solution: Check schema deployment
const checkTableExists = async (tableName: string) => {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', tableName);
  
  return data && data.length > 0;
};
```

### **Authentication Issues**
```typescript
// Problem: User not authenticated
// Solution: Proper auth checks
const requireAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    navigate('/auth');
    return null;
  }
  return user;
};
```

### **Performance Optimization**
```typescript
// Problem: Large bundle size
// Solution: Code splitting
const LazyComponent = lazy(() => import('./HeavyComponent'));

// Problem: Too many re-renders
// Solution: Memoization
const MemoizedComponent = memo(({ data }) => {
  return <ExpensiveComponent data={data} />;
});
```

---

## 🔌 **MCP Integration Guide**

### **Available MCPs**
1. **mcp__fetch**: Enhanced web content fetching
2. **mcp__sequential-thinking**: Structured problem solving
3. **mcp__puppeteer**: Browser automation for testing

### **Using MCP in Development**
```typescript
// Example: Using fetch MCP for university data
import { mcpFetch } from '@/utils/mcpIntegration';

const fetchUniversityData = async (url: string) => {
  const result = await mcpFetch({
    url,
    enableFetchImages: true,
    returnBase64: true
  });
  
  return result.data;
};
```

---

## 🚀 **Deployment Guide**

### **Production Checklist**
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] Error boundaries implemented
- [ ] Performance optimized
- [ ] SEO meta tags added

### **Build Process**
```bash
# Production build
npm run build

# Preview build locally
npm run preview

# Deploy to hosting platform
# (Vercel, Netlify, etc.)
```

### **Environment Variables**
```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📊 **Monitoring & Analytics**

### **Performance Metrics**
- Bundle size optimization
- Core Web Vitals monitoring
- Error rate tracking
- User engagement analytics

### **Database Monitoring**
- Query performance
- Connection pooling
- Real-time subscription health
- Storage usage tracking

---

## 🔮 **Future Enhancements**

### **Planned Features**
1. **Enhanced Search**: Improved university and program search
2. **Interview Prep**: Mock interview system
3. **Financial Aid Tracker**: Scholarship and funding management
4. **Mobile App**: React Native companion
5. **International Support**: Multi-language and currency

### **Technical Improvements**
1. **Offline Support**: Progressive Web App features
2. **Advanced Analytics**: User behavior insights
3. **API Rate Limiting**: Better performance management
4. **Microservices**: Service-oriented architecture
5. **GraphQL**: More efficient data fetching

---

## 🆘 **Getting Help**

### **Resources**
- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com

### **Common Commands**
```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run preview         # Preview build

# Database
supabase db reset       # Reset local database
supabase db push        # Push schema changes
supabase gen types      # Generate TypeScript types

# Debugging
npm run lint            # Check code quality
npm run type-check      # TypeScript validation
```

---

## 📝 **Notes for Claude AI**

### **When Working on This Project**
1. **Always check** if database tables exist before using them
2. **Use production-ready error handling** - graceful fallbacks, not just console.error
3. **Follow the established patterns** in services and components
4. **Keep real-time functionality** in mind for all data operations
5. **Test authentication flows** thoroughly
6. **Consider mobile responsiveness** for all new components
7. **Update this guide** when making architectural changes

### **Project Priorities**
1. **Stability**: Error-free user experience
2. **Performance**: Fast loading and responsive UI
3. **User Experience**: Intuitive and helpful interface
4. **Scalability**: Code that can grow with the platform
5. **Security**: Proper authentication and data protection

---

**Last Updated**: January 13, 2025  
**Version**: 3.0.0 (Post-AI Removal)  
**Maintainer**: Development Team

### **Recent Major Updates**
- **AI Removal**: Complete removal of all AI-powered features and services
- **Simplified Architecture**: Focus on core application tracking and social networking
- **Clean Codebase**: Removed dependencies on AI services and libraries
- **Core Functionality**: Maintained essential features without AI dependencies