import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import SignInForm from '@/components/SignInForm';
import SignUpForm from '@/components/SignUpForm';
import authService from '@/services/authService';
import { GraduationCap, ChevronLeft, BookOpen, Target, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import SEOHead from '@/components/SEOHead';

const StudentAuth: React.FC = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          
          // Check role and redirect appropriately for students
          try {
            const { role } = await authService.getUserRole(user.id);
            
            if (role === 'applicant') {
              // Check if student has completed onboarding
              try {
                const { completed } = await authService.hasCompletedOnboarding(user.id);
                if (completed) {
                  navigate('/dashboard');
                } else {
                  navigate('/onboarding');
                }
              } catch (error) {
                console.warn('Could not check onboarding status, redirecting to onboarding:', error);
                navigate('/onboarding');
              }
            } else if (role === 'mentor') {
              // User is a mentor, redirect to mentor area
              navigate('/mentor/dashboard');
            } else {
              // No role set, they can continue with student signup
              console.log('No role set, allowing student signup');
            }
          } catch (error) {
            console.warn('Could not fetch user role, allowing continuation:', error);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user;
        setUser(currentUser ?? null);
        
        if (currentUser && event === 'SIGNED_IN') {
          // Student signed in, route to onboarding
          navigate('/onboarding');
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleAuthSuccess = () => {
    // Auth success is handled by the useEffect above
  };

  const toggleAuthMode = () => {
    setIsSignIn(!isSignIn);
  };

  return (
    <>
      <SEOHead 
        title="Student Login"
        description="Access your student account to manage applications"
        keywords="student login, graduate applications, student portal, university applications"
      />
      <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-md border-b border-white/30 shadow-sm z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </motion.div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                GradApp
              </span>
            </Link>
            <Link 
              to="/" 
              className="flex items-center text-gray-600 hover:text-blue-600 transition-all duration-300 text-sm sm:text-base group"
            >
              <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex items-center justify-center min-h-[calc(100vh-80px)] py-4 sm:py-6 lg:py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12">
          
          {/* Left side - Student Benefits */}
          <motion.div 
            className="hidden lg:block w-full lg:w-1/2 max-w-lg"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl p-8 shadow-2xl">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Start Your Graduate Journey
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Join thousands of successful applicants who've streamlined their graduate school applications with our AI-powered platform.
              </p>
              
              <div className="space-y-6">
                <motion.div 
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Perfect Program Matches</h3>
                    <p className="text-gray-600 text-sm">AI-powered matching with programs that align with your profile and goals</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <div className="bg-gradient-to-r from-cyan-500 to-teal-500 p-3 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Expert Mentorship</h3>
                    <p className="text-gray-600 text-sm">Connect with mentors who've been through the application process</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-3 rounded-xl">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Document Creation</h3>
                    <p className="text-gray-600 text-sm">AI-assisted SOPs, CVs, and application essays tailored to each program</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Application Tracking</h3>
                    <p className="text-gray-600 text-sm">Comprehensive dashboard to manage deadlines and requirements</p>
                  </div>
                </motion.div>
              </div>

              <motion.div 
                className="mt-8 flex items-center space-x-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full border-2 border-white" />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">10,000+</span> successful applicants
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right side - Auth Form */}
          <motion.div 
            className="w-full lg:w-1/2 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
              {/* Decorative top bar */}
              <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />
              
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-4">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Student Portal</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isSignIn ? 'Welcome Back!' : 'Join GradApp'}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {isSignIn ? 'Continue your graduate school journey' : 'Start your path to graduate success'}
                  </p>
                </div>
              </div>
              
              {/* Tab Headers */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setIsSignIn(true)}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 relative ${
                    isSignIn
                      ? 'text-blue-600 bg-gradient-to-b from-blue-50 to-transparent'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Sign In
                  {isSignIn && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"
                    />
                  )}
                </button>
                <button
                  onClick={() => setIsSignIn(false)}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 relative ${
                    !isSignIn
                      ? 'text-blue-600 bg-gradient-to-b from-blue-50 to-transparent'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Sign Up
                  {!isSignIn && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"
                    />
                  )}
                </button>
              </div>

              {/* Form Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignIn ? 'signin' : 'signup'}
                  initial={{ opacity: 0, x: isSignIn ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isSignIn ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-6"
                >
                  {isSignIn ? (
                    <SignInForm 
                      onSuccess={handleAuthSuccess} 
                      onToggleForm={toggleAuthMode}
                      selectedRole="applicant"
                    />
                  ) : (
                    <SignUpForm 
                      onSuccess={handleAuthSuccess} 
                      onToggleForm={toggleAuthMode}
                      selectedRole="applicant"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Additional Help */}
            <motion.div 
              className="text-center mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <p className="text-sm text-gray-600">
                Need help? Check out our{' '}
                <Link 
                  to="/about" 
                  className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                >
                  FAQ
                </Link>{' '}
                or{' '}
                <Link 
                  to="/contact" 
                  className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                >
                  contact support
                </Link>
                .
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
      </div>
    </>
  );
};

export default StudentAuth;