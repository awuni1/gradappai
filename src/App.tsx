import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SessionProvider } from "@/contexts/SessionContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Suspense, lazy } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Initialize error tracking
import '@/utils/errorTracking';

// Keep frequently accessed pages static
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import TestPage from "./pages/TestPage";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load less frequently accessed pages
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Programs = lazy(() => import("./pages/Programs"));
const CVAnalysis = lazy(() => import("./pages/CVAnalysis"));
const UniversityMatching = lazy(() => import("./pages/UniversityMatching"));
const UniversityMatchingChat = lazy(() => import("./pages/UniversityMatchingChat"));
const ApplicationTracking = lazy(() => import("./pages/ApplicationTracking"));
const DocumentGenerator = lazy(() => import("./pages/DocumentGenerator"));
const UniversityDetails = lazy(() => import("./pages/UniversityDetails"));
const UniversityPreview = lazy(() => import("./pages/UniversityPreview"));
const MatchedFaculty = lazy(() => import("./pages/MatchedFaculty"));
const SelectedUniversities = lazy(() => import("./pages/SelectedUniversities"));
const DocumentCreator = lazy(() => import("./pages/DocumentCreator"));
const DocumentTemplates = lazy(() => import("./pages/DocumentTemplates"));
const GradNet = lazy(() => import("./pages/GradNet"));
const VideoCall = lazy(() => import("./pages/VideoCall"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const MentorDashboard = lazy(() => import("./pages/MentorDashboard"));
const MentorOnboardingContainer = lazy(() => import("./components/mentor/onboarding/MentorOnboardingContainer"));
const MentorAuth = lazy(() => import("./pages/MentorAuth"));
const MentorStudents = lazy(() => import("./pages/MentorStudents"));
const MentorResources = lazy(() => import("./pages/MentorResources"));
const Analytics = lazy(() => import("./pages/Analytics"));
import StudentAuth from "./pages/StudentAuth";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ThemeProvider>
              <SessionProvider>
                <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<Suspense fallback={<LoadingSpinner />}><AuthCallback /></Suspense>} />
              <Route path="/auth/student" element={<StudentAuth />} />
              <Route path="/auth/mentor" element={<Suspense fallback={<LoadingSpinner />}><MentorAuth /></Suspense>} />
              <Route path="/about" element={<Suspense fallback={<LoadingSpinner />}><About /></Suspense>} />
              <Route path="/contact" element={<Suspense fallback={<LoadingSpinner />}><Contact /></Suspense>} />
              <Route path="/onboarding" element={<Suspense fallback={<LoadingSpinner />}><Onboarding /></Suspense>} />
              <Route path="/dashboard" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/programs" element={<Suspense fallback={<LoadingSpinner />}><Programs /></Suspense>} />
              <Route path="/cv-analysis" element={<Suspense fallback={<LoadingSpinner />}><CVAnalysis /></Suspense>} />
              <Route path="/university-matching" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><UniversityMatching /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/matched-universities" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><UniversityMatchingChat /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/application-tracking" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><ApplicationTracking /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/document-generator" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><DocumentGenerator /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/matched-faculty" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><MatchedFaculty /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/selected-universities" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><SelectedUniversities /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/document-creator" element={<Suspense fallback={<LoadingSpinner />}><DocumentCreator /></Suspense>} />
              <Route path="/document-templates" element={<Suspense fallback={<LoadingSpinner />}><DocumentTemplates /></Suspense>} />
              <Route path="/university/:id" element={<Suspense fallback={<LoadingSpinner />}><UniversityDetails /></Suspense>} />
              <Route path="/university-details/:id" element={<Suspense fallback={<LoadingSpinner />}><UniversityDetails /></Suspense>} />
              <Route path="/university-preview/:id" element={<Suspense fallback={<LoadingSpinner />}><UniversityPreview /></Suspense>} />
              <Route path="/discussion" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><GradNet /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/gradnet" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><GradNet /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/video-call/:sessionId" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><VideoCall /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><Settings /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/settings/:section" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><Settings /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={<Suspense fallback={<LoadingSpinner />}><Analytics /></Suspense>} />
              <Route path="/help" element={<Suspense fallback={<LoadingSpinner />}><Help /></Suspense>} />
              
              {/* Mentor Platform Routes */}
              <Route path="/mentor" element={<Navigate to="/mentor/auth" replace />} />
              <Route path="/mentor/auth" element={<Suspense fallback={<LoadingSpinner />}><MentorAuth /></Suspense>} />
              <Route path="/mentor/dashboard" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><MentorDashboard /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/mentor/onboarding" element={
                <ProtectedRoute requireOnboarding={false} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><MentorOnboardingContainer /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/mentor/students" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><MentorStudents /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/mentor/resources" element={
                <ProtectedRoute requireOnboarding={true} requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}><MentorResources /></Suspense>
                </ProtectedRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
                </Routes>
              </SessionProvider>
            </ThemeProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
