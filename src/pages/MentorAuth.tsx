import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import SignInForm from '@/components/SignInForm';
import SignUpForm from '@/components/SignUpForm';
import authService from '@/services/authService';
import { Users, ChevronLeft, Award, Target, TrendingUp, Star, Heart, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import SEOHead from '@/components/SEOHead';

const MentorAuth: React.FC = () => {
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
          
          // Check role and redirect appropriately for mentors
          try {
            const { role } = await authService.getUserRole(user.id);
            
            if (role === 'mentor') {
              // Check if mentor has completed onboarding
              try {
                const { completed } = await authService.hasCompletedOnboarding(user.id);
                if (completed) {
                  navigate('/mentor/dashboard');
                } else {
                  navigate('/mentor/onboarding');
                }
              } catch (error) {
                console.warn('Could not check mentor onboarding status, redirecting to onboarding:', error);
                navigate('/mentor/onboarding');
              }
            } else if (role === 'applicant') {
              // User is a student, redirect to student area
              navigate('/dashboard');
            } else {
              // No role set, they can continue with mentor signup
              console.log('No role set, allowing mentor signup');
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
          // Mentor signed in, route to mentor onboarding
          navigate('/mentor/onboarding');
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
    <div className="min-h-screen relative overflow-hidden">
      <SEOHead 
        title="Mentor Login"
        description="Access your mentor account to connect with graduate students and make a meaningful impact on their academic journey."
        keywords="mentor, graduate student mentoring, academic mentoring, research guidance, faculty connections, mentor login, academic support"
      />
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
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </motion.div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                GradApp
              </span>
            </Link>
            <Link 
              to="/" 
              className="flex items-center text-gray-600 hover:text-purple-600 transition-all duration-300 text-sm sm:text-base group"
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
          
          {/* Left side - Mentor Benefits */}
          <motion.div 
            className="hidden lg:block w-full lg:w-1/2 max-w-lg"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl p-8 shadow-2xl">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Shape the Future
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Join our community of expert mentors making a real difference in students' academic journeys. Share your knowledge and build meaningful connections.
              </p>
              
              <div className="space-y-6">
                <motion.div 
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Professional Recognition</h3>
                    <p className="text-gray-600 text-sm">Build your reputation and get recognized for your expertise</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 rounded-xl">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Meaningful Impact</h3>
                    <p className="text-gray-600 text-sm">Guide students through their most important academic decisions</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="bg-gradient-to-r from-rose-500 to-purple-500 p-3 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Flexible Schedule</h3>
                    <p className="text-gray-600 text-sm">Mentor on your own terms with flexible time commitments</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-3 rounded-xl">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Expert Network</h3>
                    <p className="text-gray-600 text-sm">Connect with other professionals and expand your network</p>
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
                    <div key={i} className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full border-2 border-white" />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-purple-600">2,500+</span> expert mentors
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
              <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
              
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-4">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Mentor Portal</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isSignIn ? 'Welcome Back!' : 'Become a Mentor'}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {isSignIn ? 'Continue making an impact' : 'Start shaping futures today'}
                  </p>
                </div>
              </div>
              
              {/* Tab Headers */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setIsSignIn(true)}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 relative ${
                    isSignIn
                      ? 'text-purple-600 bg-gradient-to-b from-purple-50 to-transparent'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Sign In
                  {isSignIn && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  )}
                </button>
                <button
                  onClick={() => setIsSignIn(false)}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 relative ${
                    !isSignIn
                      ? 'text-purple-600 bg-gradient-to-b from-purple-50 to-transparent'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Sign Up
                  {!isSignIn && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
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
                      selectedRole="mentor"
                    />
                  ) : (
                    <SignUpForm 
                      onSuccess={handleAuthSuccess} 
                      onToggleForm={toggleAuthMode}
                      selectedRole="mentor"
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
                  className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
                >
                  Mentor FAQ
                </Link>{' '}
                or{' '}
                <Link 
                  to="/contact" 
                  className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
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
  );
};

export default MentorAuth;