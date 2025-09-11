import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoleSelectorProps {
  onRoleSelected: (role: 'applicant' | 'mentor') => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ onRoleSelected }) => {
  const [selectedRole, setSelectedRole] = useState<'applicant' | 'mentor' | null>('applicant');

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelected(selectedRole);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-16 h-16 bg-gradient-to-r from-gradapp-primary to-gradapp-secondary rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <GraduationCap className="w-8 h-8 text-white" />
        </motion.div>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome to GradApp!
        </h2>
        <p className="text-gray-600 text-base sm:text-lg">
          First, tell us how you plan to use our platform
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
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
                <div className={`p-3 sm:p-4 rounded-full transition-colors ${
                  selectedRole === 'applicant' ? 'bg-gradapp-primary' : 'bg-gray-100'
                }`}>
                  <GraduationCap className={`h-6 w-6 sm:h-8 sm:w-8 ${
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
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                I'm applying to graduate programs and need help with matching, 
                applications, and document creation.
              </p>
              
              <div className="space-y-2 text-xs text-left">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span>AI-powered program matching</span>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span>Document generation & templates</span>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span>Mentor connections</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
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
                <div className={`p-3 sm:p-4 rounded-full transition-colors ${
                  selectedRole === 'mentor' ? 'bg-gradapp-primary' : 'bg-gray-100'
                }`}>
                  <Users className={`h-6 w-6 sm:h-8 sm:w-8 ${
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
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                I want to guide and mentor students through their 
                graduate school application journey.
              </p>
              
              <div className="space-y-2 text-xs text-left">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span>Connect with motivated students</span>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span>Set your own schedule</span>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span>Make meaningful impact</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button 
          onClick={handleContinue}
          disabled={!selectedRole}
          className="w-full bg-gradient-to-r from-gradapp-primary to-gradapp-secondary hover:opacity-90 transition-all duration-300 py-4 sm:py-6 text-base sm:text-lg font-medium rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          Continue as {selectedRole === 'applicant' ? 'Applicant' : 'Mentor'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-gray-500 mt-4"
      >
        You can change your role anytime in your account settings
      </motion.p>
    </div>
  );
};

export default RoleSelector;