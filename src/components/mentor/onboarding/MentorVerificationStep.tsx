import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Award, Star, Users, Target, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassmorphicCard from '@/components/ui/GlassmorphicCard';
import MentorBadge from '@/components/ui/MentorBadge';
import ProgressRing from '@/components/ui/ProgressRing';
import { MentorOnboardingData } from '@/types/mentorTypes';

interface MentorVerificationStepProps {
  data: MentorOnboardingData;
  onDataChange: (data: Partial<MentorOnboardingData>) => void;
  validationErrors: Record<string, string[]>;
}

const MentorVerificationStep: React.FC<MentorVerificationStepProps> = ({
  data,
  onDataChange,
  validationErrors
}) => {
  const calculateCompletionPercentage = () => {
    let percentage = 0;
    
    if (data.institution_id || data.custom_institution) {percentage += 20;}
    if (data.current_position) {percentage += 15;}
    if (data.mentoring_areas && data.mentoring_areas.length > 0) {percentage += 20;}
    if (data.expertise_keywords && data.expertise_keywords.length > 0) {percentage += 15;}
    if (data.bio) {percentage += 10;}
    if (data.mentoring_philosophy) {percentage += 10;}
    if (data.timezone) {percentage += 10;}
    
    return percentage;
  };

  const completionPercentage = calculateCompletionPercentage();

  const getVerificationTier = () => {
    if (data.sso_provider) {
      return 'university_verified';
    } else if (completionPercentage >= 80) {
      return 'community';
    } 
      return 'pending';
    
  };

  const verificationTier = getVerificationTier();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Complete Your Profile
        </h3>
        <p className="text-gray-600">
          Review your profile and complete the mentor onboarding process
        </p>
      </div>

      {/* Profile Completion */}
      <GlassmorphicCard variant="mentor" className="p-8">
        <div className="text-center mb-6">
          <ProgressRing 
            progress={completionPercentage}
            size={120}
            color="mentor"
          />
          <h4 className="text-2xl font-bold text-gray-900 mt-4">Profile Completion</h4>
          <p className="text-gray-600">
            {completionPercentage >= 80 ? 'Your profile is ready!' : 'Complete your profile to unlock all features'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h5 className="font-semibold text-gray-900">Professional Info</h5>
            <p className="text-sm text-gray-600">Position, experience, expertise</p>
            {data.current_position && data.mentoring_areas?.length ? (
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-2" />
            ) : (
              <div className="w-5 h-5 border-2 border-gray-300 rounded-full mx-auto mt-2" />
            )}
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <h5 className="font-semibold text-gray-900">Mentoring Areas</h5>
            <p className="text-sm text-gray-600">Skills and expertise keywords</p>
            {data.expertise_keywords?.length ? (
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-2" />
            ) : (
              <div className="w-5 h-5 border-2 border-gray-300 rounded-full mx-auto mt-2" />
            )}
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <h5 className="font-semibold text-gray-900">Availability</h5>
            <p className="text-sm text-gray-600">Schedule and preferences</p>
            {data.timezone ? (
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-2" />
            ) : (
              <div className="w-5 h-5 border-2 border-gray-300 rounded-full mx-auto mt-2" />
            )}
          </div>
        </div>
      </GlassmorphicCard>

      {/* Verification Status */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Verification Status</h4>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h5 className="font-semibold text-gray-900 mb-1">Current Status</h5>
            <div className="flex items-center gap-2">
              {verificationTier === 'university_verified' && (
                <MentorBadge type="verified" showLabel />
              )}
              {verificationTier === 'community' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Community Mentor
                </span>
              )}
              {verificationTier === 'pending' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Verification Pending
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {verificationTier === 'university_verified' && 'Your university credentials have been verified'}
              {verificationTier === 'community' && 'Ready to start mentoring in the community'}
              {verificationTier === 'pending' && 'Complete your profile to activate your mentor account'}
            </p>
          </div>

          {data.sso_provider && (
            <div className="text-center">
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-green-700 font-medium">SSO Verified</p>
            </div>
          )}
        </div>
      </GlassmorphicCard>

      {/* Profile Summary */}
      <GlassmorphicCard className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h4>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-gray-700">Institution</h5>
              <p className="text-gray-900">
                {data.custom_institution || 'University verified via SSO'}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-700">Position</h5>
              <p className="text-gray-900">{data.current_position || 'Not specified'}</p>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-700 mb-2">Mentoring Areas</h5>
            <div className="flex flex-wrap gap-2">
              {data.mentoring_areas?.length ? data.mentoring_areas.map((area) => (
                <span key={area} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                  {area}
                </span>
              )) : (
                <p className="text-gray-500 text-sm">No areas specified</p>
              )}
            </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-700 mb-2">Expertise Keywords</h5>
            <div className="flex flex-wrap gap-2">
              {data.expertise_keywords?.length ? data.expertise_keywords.map((keyword) => (
                <span key={keyword} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {keyword}
                </span>
              )) : (
                <p className="text-gray-500 text-sm">No keywords specified</p>
              )}
            </div>
          </div>

          {data.mentoring_philosophy && (
            <div>
              <h5 className="font-medium text-gray-700">Mentoring Philosophy</h5>
              <p className="text-gray-900 text-sm">{data.mentoring_philosophy}</p>
            </div>
          )}
        </div>
      </GlassmorphicCard>

      {/* Next Steps */}
      <GlassmorphicCard className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">What's Next?</h4>
        </div>

        <div className="space-y-3">
          {completionPercentage >= 80 ? (
            <>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Your mentor profile is ready!</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">You can start accepting mentee requests</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Access to mentor dashboard and tools</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-yellow-700">
                <div className="w-4 h-4 border-2 border-yellow-500 rounded-full" />
                <span className="text-sm">Complete your profile to start mentoring</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                <span className="text-sm">Verification will be processed automatically</span>
              </div>
            </>
          )}
        </div>
      </GlassmorphicCard>
    </div>
  );
};

export default MentorVerificationStep;