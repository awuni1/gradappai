import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, Users, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '@/services/authService';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ isOpen, onClose, userEmail }) => {
  const [selectedRole, setSelectedRole] = useState<'applicant' | 'mentor' | null>(null); // No default selection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRoleSubmit = async () => {
    if (!selectedRole) {
      toast.error("Please select a role to continue");
      return;
    }

    try {
      setIsSubmitting(true);
      const { user } = await authService.getCurrentUser();
      
      if (!user) {
        toast.error("User not found. Please try signing in again.");
        return;
      }

      // Create user role
      const { error: roleError } = await authService.createUserRole(user.id, selectedRole);

      if (roleError) {
        console.error('Error setting user role:', roleError);
        toast.error("Failed to set user role. Please try again.");
        return;
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
        // Don't fail the flow for metadata update errors
      }

      // Show success message and navigate based on role
      if (selectedRole === 'applicant') {
        toast.success("Welcome! Let's get you started on your graduate school journey! 🎓");
        navigate('/onboarding');
      } else if (selectedRole === 'mentor') {
        toast.success("Welcome as a mentor! We're excited to have you help students succeed! 🌟");
        navigate('/mentor/onboarding');
      } else {
        // Fallback
        navigate('/dashboard');
      }
      
      onClose();
    } catch (error) {
      console.error('Error in role submission:', error);
      toast.error("An error occurred while setting up your account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStart = async () => {
    // Quick start for applicants - automatic applicant role selection

    try {
      setIsSubmitting(true);
      const { user } = await authService.getCurrentUser();
      
      if (!user) {
        toast.error("User not found. Please try signing in again.");
        return;
      }

      // Create user role for applicant
      const { error: roleError } = await authService.createUserRole(user.id, 'applicant');

      if (roleError) {
        console.error('Error setting user role:', roleError);
        toast.error("Failed to set user role. Please try again.");
        return;
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: 'applicant' }
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
      }

      toast.success("Welcome! Let's get you started on your graduate school journey! 🎓");
      navigate('/onboarding');
      onClose();
    } catch (error: unknown) {
      console.error('Error in quick start:', error);
      toast.error("An error occurred while setting up your account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] p-0 mx-2" hideCloseButton>
        <div className="relative overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
          
          <div className="relative p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-20 h-20 bg-gradient-to-r from-gradapp-primary to-gradapp-secondary rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Welcome to GradApp!
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base sm:text-lg">
                Choose how you'd like to use our platform - both options offer great benefits
              </DialogDescription>
              <p className="text-sm text-gray-500 mt-2">
                Signed in as: <span className="font-medium">{userEmail}</span>
              </p>
            </motion.div>

            {/* Quick Start Option for Applicants */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <Card className="p-4 sm:p-6 bg-gradient-to-r from-gradapp-primary to-gradapp-secondary text-white relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-white/20 rounded-full px-2 sm:px-3 py-1 text-xs font-medium">
                  RECOMMENDED
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0">
                      <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold">I'm a Graduate School Applicant</h3>
                      <p className="text-white/90 text-xs sm:text-sm">
                        Get matched with programs, create documents, and connect with mentors
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleQuickStart}
                    disabled={isSubmitting}
                    className="bg-white text-gradapp-primary hover:bg-gray-100 font-medium w-full sm:w-auto"
                    size="sm"
                  >
                    {isSubmitting ? (
                      "Setting up..."
                    ) : (
                      <>
                        Quick Start
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-white px-3 text-gray-500">Or choose your role</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card 
                  className={`p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                    selectedRole === 'applicant' 
                      ? 'border-gradapp-primary bg-blue-50 shadow-lg transform scale-105' 
                      : 'border-gray-200 hover:border-gradapp-primary'
                  }`}
                  onClick={() => setSelectedRole('applicant')}
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`p-4 rounded-full transition-colors ${
                        selectedRole === 'applicant' ? 'bg-gradapp-primary' : 'bg-gray-100'
                      }`}>
                        <GraduationCap className={`h-8 w-8 ${
                          selectedRole === 'applicant' ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2 flex items-center justify-center">
                      Graduate Applicant
                      {selectedRole === 'applicant' && (
                        <CheckCircle className="ml-2 h-5 w-5 text-gradapp-primary" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      I'm applying to graduate programs and need help with matching, 
                      applications, and document creation.
                    </p>
                    
                    <div className="mt-4 space-y-2 text-xs text-left">
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        AI-powered program matching
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Document generation & templates
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Mentor connections
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card 
                  className={`p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                    selectedRole === 'mentor' 
                      ? 'border-gradapp-primary bg-blue-50 shadow-lg transform scale-105' 
                      : 'border-gray-200 hover:border-gradapp-primary'
                  }`}
                  onClick={() => setSelectedRole('mentor')}
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`p-4 rounded-full transition-colors ${
                        selectedRole === 'mentor' ? 'bg-gradapp-primary' : 'bg-gray-100'
                      }`}>
                        <Users className={`h-8 w-8 ${
                          selectedRole === 'mentor' ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2 flex items-center justify-center">
                      Mentor
                      {selectedRole === 'mentor' && (
                        <CheckCircle className="ml-2 h-5 w-5 text-gradapp-primary" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      I want to guide and mentor students through their 
                      graduate school application journey.
                    </p>
                    
                    <div className="mt-4 space-y-2 text-xs text-left">
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Connect with motivated students
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Set your own schedule
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Make meaningful impact
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button 
                onClick={handleRoleSubmit}
                disabled={!selectedRole || isSubmitting}
                className="w-full bg-gradient-to-r from-gradapp-primary to-gradapp-secondary hover:opacity-90 transition-all duration-300 py-4 sm:py-6 text-base sm:text-lg font-medium rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <Sparkles className="h-5 w-5" />
                    </motion.div>
                    Setting up your account...
                  </>
                ) : (
                  <>
                    Continue as {selectedRole === 'applicant' ? 'Applicant' : 'Mentor'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-xs text-gray-500 mt-4"
            >
              You can change your role anytime in your account settings
            </motion.p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionModal;