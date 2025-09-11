# GradApp Ascend Platform

🎓 **A comprehensive graduate school application management system with social networking and mentorship features**

## Project Overview

GradApp Ascend Platform streamlines the entire graduate school application process for prospective students. The platform provides tools to manage applications, connect with mentors, and build professional networks within the academic community.

**Project URL**: https://lovable.dev/projects/f5b937d3-64bf-4caf-9e93-6ee56e6429be

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f5b937d3-64bf-4caf-9e93-6ee56e6429be) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd gradapp-ascend-platform

# Step 3: Install the necessary dependencies.
npm install

# Step 4: Set up environment variables (Supabase configuration required)
# Create .env.local file with your Supabase credentials

# Step 5: Start the development server (runs on localhost:3000)
npm run dev
```

### 🚀 **Quick Start**
- **Development Server**: `npm run dev` (localhost:3000)
- **Build for Production**: `npm run build`
- **Run Linting**: `npm run lint`
- **Preview Build**: `npm run preview`

## 📋 **Core Features**

### Application Management
The platform provides comprehensive tools for managing graduate school applications:

- **University Search**: Browse and filter university programs
- **Application Tracking**: Monitor progress for each application
- **Document Management**: Upload and organize application documents
- **Deadline Management**: Track important dates and deadlines

### Social Networking (GradNet)
Connect with peers and mentors in the academic community:

- **Professional Networking**: Connect with fellow students and mentors
- **Knowledge Sharing**: Share experiences and resources
- **Mentorship System**: Find and connect with mentors
- **Discussion Forums**: Participate in academic discussions

### Document Tools
Manage your application documents efficiently:

- **CV Upload**: Upload and store your academic CV
- **Document Library**: Organize all application materials
- **Template Access**: Use pre-built document templates
- **Version Control**: Track document changes and updates

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - Modern React with hooks and context
- **TypeScript 5.5.3** - Type-safe development
- **Vite 5.4.1** - Fast build tool and dev server
- **Tailwind CSS 3.4.11** - Utility-first CSS framework
- **shadcn/ui + Radix UI** - Modern, accessible component library
- **Framer Motion 12.12.1** - Smooth animations and transitions
- **React Router DOM 6.26.2** - Client-side routing
- **React Hook Form + Zod** - Form handling and validation

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Auth** - Authentication and user management
- **Supabase Storage** - File storage and management
- **Row Level Security** - Database-level access control

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Vite** - Fast development and build tool

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard-specific components
│   ├── onboarding/     # User onboarding flow
│   ├── gradnet/        # Social networking components
│   ├── mentor/         # Mentorship platform components
│   └── faculty/        # Faculty-related components
├── pages/              # Page components and routing
├── services/           # API and data services
├── hooks/              # Custom React hooks
├── contexts/           # React contexts for state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── integrations/       # Third-party integrations
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0.0 or later
- npm or yarn package manager
- Supabase account for backend services

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start the development server: `npm run dev`

### Environment Setup
Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📚 Documentation

- **Development Guide**: See `CLAUDE.md` for comprehensive development instructions
- **Database Schema**: Detailed database structure and relationships
- **Component Documentation**: Individual component usage and props
- **Deployment Guide**: Production deployment instructions

## 🎯 Key Features

### For Students
- **Application Tracking**: Comprehensive progress monitoring
- **University Discovery**: Advanced search and filtering
- **Document Management**: Centralized file organization
- **Networking**: Connect with peers and mentors
- **Progress Analytics**: Visual progress tracking

### For Mentors
- **Student Management**: Manage mentee relationships
- **Resource Sharing**: Share documents and templates
- **Session Scheduling**: Calendar integration for meetings
- **Progress Monitoring**: Track student success

### For Faculty
- **Student Discovery**: Find potential research candidates
- **Application Review**: Streamlined review process
- **Communication Tools**: Direct messaging with applicants

## 🔒 Security

- **Authentication**: Secure user authentication via Supabase Auth
- **Authorization**: Role-based access control
- **Data Protection**: Row-level security policies
- **Input Validation**: Comprehensive data validation
- **File Security**: Secure file upload and storage

## 🚀 Deployment

The application is designed for easy deployment on modern hosting platforms:

- **Vercel** (Recommended)
- **Netlify**
- **AWS Amplify**
- **Firebase Hosting**

See the deployment documentation for detailed instructions.

## 📊 Performance

- **Core Web Vitals**: Optimized for excellent performance scores
- **Bundle Size**: Optimized with code splitting and lazy loading
- **SEO**: Server-side rendering and meta tag optimization
- **Accessibility**: WCAG 2.1 AA compliance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Check the documentation in `CLAUDE.md`
- Review the FAQ section
- Contact the development team

---

**Built with ❤️ for the academic community**# Grad-App-Project
