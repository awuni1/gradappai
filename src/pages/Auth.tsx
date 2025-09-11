import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import SignInForm from '@/components/SignInForm';
import UltraSignUpForm from '@/components/UltraSignUpForm';
import EmergencySignUpForm from '@/components/EmergencySignUpForm';
import WorkingSignUpForm from '@/components/WorkingSignUpForm';
import FinalWorkingSignUpForm from '@/components/FinalWorkingSignUpForm';
import BulletproofSignUp from '@/components/BulletproofSignUp';
import UltraFixedSignUp from '@/components/UltraFixedSignUp';
import ImprovedSignUpForm from '@/components/ImprovedSignUpForm';
import RoleSelector from '@/components/RoleSelector';
import authService from '@/services/authService';
import { GraduationCap, ChevronLeft, Sparkles, Users, Target, Award, AlertTriangle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import RoleSelectionModal from '@/components/RoleSelectionModal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';

const Auth: React.FC = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedUserRole, setSelectedUserRole] = useState<'applicant' | 'mentor' | null>(null);
  const [showAuthForms, setShowAuthForms] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [formType, setFormType] = useState<'improved' | 'ultra' | 'emergency' | 'working' | 'final' | 'bulletproof' | 'ultrafixed'>('improved');
  const lastAuthCheckRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      // Prevent rapid auth checks
      const now = Date.now();
      if (now - lastAuthCheckRef.current < 2000) {
        return;
      }
      lastAuthCheckRef.current = now;

      setIsCheckingAuth(true);
      setDatabaseError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          
          // First try to get role from auth metadata
          let userRole = user.user_metadata?.role || null;
          
          // If no role in metadata, check database with resilience
          if (!userRole) {
            try {
              const { role, error } = await authService.getUserRole(user.id);
              
              if (error) {
                console.warn('Database error while fetching role:', error);
                
                // Check if it's a database connectivity issue
                if ((error as Error).message?.includes('timeout') || (error as Error).message?.includes('connection')) {
                  setDatabaseError(
                    'Database connection issues detected. You may experience limited functionality.'
                  );
                  
                  // Check localStorage for previously stored role
                  const storedRole = localStorage.getItem(`user_role_${user.id}`);
                  if (storedRole === 'applicant' || storedRole === 'mentor') {
                    userRole = storedRole;
                    console.log('Using stored role from localStorage:', userRole);
                  } else {
                    // If no stored role, check the selected role from auth forms
                    if (selectedUserRole) {
                      userRole = selectedUserRole;
                      localStorage.setItem(`user_role_${user.id}`, selectedUserRole);
                    } else {
                      // Show role selection as last resort
                      setShowRoleSelection(true);
                      setIsCheckingAuth(false);
                      return;
                    }
                  }
                } else {
                  // Other database errors - might need role selection
                  setShowRoleSelection(true);
                  setIsCheckingAuth(false);
                  return;
                }
              } else if (role) {
                userRole = role;
                // Store role for future use
                localStorage.setItem(`user_role_${user.id}`, role);
              }
            } catch (error) {
              console.warn('Failed to fetch user role:', error);
              // Try localStorage fallback
              const storedRole = localStorage.getItem(`user_role_${user.id}`);
              if (storedRole === 'applicant' || storedRole === 'mentor') {
                userRole = storedRole;
              } else {
                setShowRoleSelection(true);
                setIsCheckingAuth(false);
                return;
              }
            }
          }
          
          // Route based on role - simplified to prevent hanging
          if (userRole === 'applicant') {
            console.log('🔄 Routing applicant to onboarding (will auto-redirect if completed)');
            // Always go to onboarding first - it will handle redirection if already completed
            navigate('/onboarding');
          } else if (userRole === 'mentor') {
            // Check mentor profile with error handling
            try {
              const { data: mentorProfile } = await supabase
                .from('mentor_profiles')
                .select('id, profile_completion_percentage')
                .eq('user_id', user.id)
                .single();

              if (!mentorProfile || mentorProfile.profile_completion_percentage < 80) {
                navigate('/mentor/onboarding');
              } else {
                navigate('/mentor/dashboard');
              }
            } catch (error) {
              console.warn('Could not check mentor profile, redirecting to mentor onboarding:', error);
              navigate('/mentor/onboarding');
            }
          } else if (userRole) {
            // Fallback for other roles
            navigate('/dashboard');
          } else {
            // No role found anywhere, show selection
            setShowRoleSelection(true);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setDatabaseError('Authentication check failed. Please try again.');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user;
        setUser(currentUser ?? null);
        
        if (currentUser && event === 'SIGNED_IN') {
          // Similar resilient logic for auth state changes
          let userRole = currentUser.user_metadata?.role || null;
          
          if (!userRole) {
            try {
              const { role, error } = await authService.getUserRole(currentUser.id);
              
              if (!error && role) {
                userRole = role;
                localStorage.setItem(`user_role_${currentUser.id}`, role);
              } else {
                // Try localStorage
                const storedRole = localStorage.getItem(`user_role_${currentUser.id}`);
                if (storedRole === 'applicant' || storedRole === 'mentor') {
                  userRole = storedRole;
                } else if (selectedUserRole) {
                  userRole = selectedUserRole;
                  localStorage.setItem(`user_role_${currentUser.id}`, selectedUserRole);
                }
              }
            } catch (error) {
              console.warn('Could not fetch user role during auth change:', error);
              const storedRole = localStorage.getItem(`user_role_${currentUser.id}`);
              if (storedRole === 'applicant' || storedRole === 'mentor') {
                userRole = storedRole;
              }
            }
          }
          
          if (userRole === 'applicant') {
            console.log('🔄 Auth change: Routing applicant to onboarding (will auto-redirect if completed)');
            navigate('/onboarding');
          } else if (userRole === 'mentor') {
            navigate('/mentor/onboarding');
          } else if (userRole) {
            navigate('/dashboard');
          } else {
            setShowRoleSelection(true);
          }
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, selectedUserRole]);

  const handleRoleSelected = (role: 'applicant' | 'mentor') => {
    setSelectedUserRole(role);
    setShowAuthForms(true);
  };

  const handleAuthSuccess = () => {
    // Auth success is handled by the useEffect above
  };

  const toggleAuthMode = () => {
    setIsSignIn(!isSignIn);
  };

  const handleRoleSelectionClose = () => {
    setShowRoleSelection(false);
    // Navigation is handled in the RoleSelectionModal
  };

  const handleBackToRoleSelection = () => {
    setShowAuthForms(false);
    setSelectedUserRole(null);
  };

  return (
    <>
      <SEOHead 
        title="Sign In"
        description="Login to GradApp to continue your graduate school journey"
        keywords="login, sign in, graduate school, university applications, student portal"
      />
      <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0">
          {/* Animated shapes */}
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.div
            className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.div
            className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
            animate={{
              x: [0, 50, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-gradapp-primary" />
              </motion.div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gradapp-primary to-gradapp-secondary bg-clip-text text-transparent">
                GradApp
              </span>
            </Link>
            <Link 
              to="/" 
              className="flex items-center text-gray-600 hover:text-gradapp-primary transition-all duration-300 text-sm sm:text-base group"
            >
              <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex items-center justify-center min-h-[calc(100vh-80px)] py-4 sm:py-6 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12">
          
          {/* Database Error Warning */}
          {databaseError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-0 left-0 right-0 max-w-2xl mx-auto mt-4 px-4"
            >
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-md">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-800 mb-1">Database Connection Notice</h4>
                    <p className="text-sm text-amber-700">{databaseError}</p>
                    <p className="text-sm text-amber-700 mt-2">
                      You can continue with sign-in/sign-up. The system will work with limited functionality.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Left side - Features showcase */}
          <motion.div 
            className="hidden lg:block w-full lg:w-1/2 max-w-lg"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-gradapp-primary to-gradapp-secondary bg-clip-text text-transparent">
              Your Journey to Graduate School Starts Here
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of successful applicants who've streamlined their graduate school applications with our AI-powered platform.
            </p>
            
            <div className="space-y-4">
              <motion.div 
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Perfect Match Programs</h3>
                  <p className="text-gray-600 text-sm">AI-powered matching with programs that align with your profile</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Expert Mentorship</h3>
                  <p className="text-gray-600 text-sm">Connect with mentors who've been through the process</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="bg-gradient-to-r from-green-500 to-teal-500 p-2 rounded-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Document Generation</h3>
                  <p className="text-gray-600 text-sm">Create compelling SOPs and CVs tailored to each program</p>
                </div>
              </motion.div>
            </div>

            <div className="mt-8 flex items-center space-x-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full border-2 border-white" />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">10,000+</span> successful applicants
              </p>
            </div>
          </motion.div>

          {/* Right side - Role Selection or Auth Card */}
          <motion.div 
            className="w-full lg:w-1/2 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence mode="wait">
              {!showAuthForms ? (
                <motion.div
                  key="role-selection"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8"
                >
                  <RoleSelector onRoleSelected={handleRoleSelected} />
                </motion.div>
              ) : (
                <motion.div
                  key="auth-forms"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                >
                  {/* Decorative top bar */}
                  <div className="h-2 bg-gradient-to-r from-gradapp-primary via-gradapp-secondary to-purple-500" />
                  
                  {/* Back button and role indicator */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={handleBackToRoleSelection}
                        className="flex items-center text-sm text-gray-600 hover:text-gradapp-primary transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Change Role
                      </button>
                      <div className="text-sm text-gray-600">
                        Role: <span className="font-medium capitalize text-gradapp-primary">{selectedUserRole}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tab Headers */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setIsSignIn(true)}
                      className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-medium transition-all duration-300 text-sm sm:text-base relative ${
                        isSignIn
                          ? 'text-gradapp-primary bg-gradient-to-b from-blue-50 to-transparent'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Sign In
                      {isSignIn && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gradapp-primary to-gradapp-secondary"
                        />
                      )}
                    </button>
                    <button
                      onClick={() => setIsSignIn(false)}
                      className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-medium transition-all duration-300 text-sm sm:text-base relative ${
                        !isSignIn
                          ? 'text-gradapp-primary bg-gradient-to-b from-purple-50 to-transparent'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Sign Up
                      {!isSignIn && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gradapp-primary to-gradapp-secondary"
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
                      className="p-4 sm:p-6 lg:p-8"
                    >
                      {isSignIn ? (
                        <SignInForm 
                          onSuccess={handleAuthSuccess} 
                          onToggleForm={toggleAuthMode}
                          selectedRole={selectedUserRole}
                        />
                      ) : (
                        <>
                          {formType === 'improved' && (
                            <ImprovedSignUpForm 
                              selectedRole={selectedUserRole}
                              onSuccess={handleAuthSuccess}
                            />
                          )}
                          {formType === 'ultrafixed' && (
                            <UltraFixedSignUp />
                          )}
                          {formType === 'bulletproof' && (
                            <BulletproofSignUp />
                          )}
                          {formType === 'final' && (
                            <FinalWorkingSignUpForm 
                              onSuccess={handleAuthSuccess} 
                              onToggleForm={toggleAuthMode}
                              selectedRole={selectedUserRole}
                            />
                          )}
                          {formType === 'working' && (
                            <WorkingSignUpForm 
                              onSuccess={handleAuthSuccess} 
                              onToggleForm={toggleAuthMode}
                              selectedRole={selectedUserRole}
                            />
                          )}
                          {formType === 'ultra' && (
                            <UltraSignUpForm 
                              onSuccess={handleAuthSuccess} 
                              onToggleForm={toggleAuthMode}
                              selectedRole={selectedUserRole}
                            />
                          )}
                          {formType === 'emergency' && (
                            <EmergencySignUpForm 
                              onSuccess={handleAuthSuccess} 
                              onToggleForm={toggleAuthMode}
                              selectedRole={selectedUserRole}
                            />
                          )}
                          
                          <div className="text-center mt-4 space-y-2">
                            <div className="flex justify-center gap-1 flex-wrap">
                              <Button 
                                variant={formType === 'improved' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFormType('improved')}
                                className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold"
                              >
                                🚀 IMPROVED (AUTO-REDIRECT)
                              </Button>
                              <Button 
                                variant={formType === 'ultrafixed' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFormType('ultrafixed')}
                                className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold"
                              >
                                ✨ ULTRA FIXED
                              </Button>
                              <Button 
                                variant={formType === 'bulletproof' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFormType('bulletproof')}
                                className="text-xs bg-red-600 hover:bg-red-700 text-white"
                              >
                                🔴 DEBUG
                              </Button>
                              <Button 
                                variant={formType === 'final' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFormType('final')}
                                className="text-xs"
                              >
                                🎯 FINAL
                              </Button>
                              <Button 
                                variant={formType === 'working' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFormType('working')}
                                className="text-xs"
                              >
                                ✅ Working
                              </Button>
                              <Button 
                                variant={formType === 'ultra' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFormType('ultra')}
                                className="text-xs"
                              >
                                🔧 Ultra
                              </Button>
                              <Button 
                                variant={formType === 'emergency' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFormType('emergency')}
                                className="text-xs"
                              >
                                🚨 Emergency
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              {formType === 'improved' && '🚀 RECOMMENDED - Creates profile, handles roles, and auto-redirects to next step'}
                              {formType === 'ultrafixed' && '🎉 PROVEN WORKING - Shows clear success/error messages with unique emails'}
                              {formType === 'bulletproof' && 'Step-by-step debugging with alerts'}
                              {formType === 'final' && 'Confirmed working - shows proper success message'}
                              {formType === 'working' && 'Guaranteed to work based on tests'}
                              {formType === 'ultra' && 'Advanced debugging features'}
                              {formType === 'emergency' && 'Simple fallback form'}
                            </p>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Additional Help */}
            <motion.div 
              className="text-center mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-sm text-gray-600">
                Need help? Check out our{' '}
                <Link 
                  to="/about" 
                  className="text-gradapp-primary hover:text-gradapp-secondary transition-colors font-medium"
                >
                  FAQ
                </Link>{' '}
                or{' '}
                <Link 
                  to="/contact" 
                  className="text-gradapp-primary hover:text-gradapp-secondary transition-colors font-medium"
                >
                  contact support
                </Link>
                .
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Role Selection Modal */}
      <RoleSelectionModal 
        isOpen={showRoleSelection}
        onClose={handleRoleSelectionClose}
        userEmail={user?.email || ''}
      />
      </div>
    </>
  );
};

export default Auth;