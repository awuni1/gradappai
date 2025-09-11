import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  User, 
  GraduationCap, 
  Heart, 
  Star,
  Award,
  Sparkles,
  Calendar,
  MapPin,
  MessageCircle,
  Users,
  FileText,
  Microscope,
  BookOpen,
  Globe,
  Clock,
  Shield,
  PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

import type { OnboardingData } from './MentorOnboardingContainer';

interface SummaryStepProps {
  data: OnboardingData;
  onDataChange: (data: Partial<OnboardingData>) => void;
  validationErrors?: Record<string, string[]>;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const SummaryStep: React.FC<SummaryStepProps> = ({
  data,
  onDataChange,
  validationErrors = {},
  onSubmit,
  isSubmitting = false
}) => {
  const { toast } = useToast();
  const [acceptedTerms, setAcceptedTerms] = useState(data.accepted_terms || false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(data.accepted_privacy || false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Calculate completion percentage
  const calculateCompletion = () => {
    let completed = 0;
    const total = 12;

    if (data.name) {completed++;}
    if (data.email) {completed++;}
    if (data.photo_url) {completed++;}
    if (data.highest_degree) {completed++;}
    if (data.current_position) {completed++;}
    if (data.years_of_experience) {completed++;}
    if (data.research_interests?.length > 0) {completed++;}
    if (data.preferred_mentee_levels?.length > 0) {completed++;}
    if (data.mentoring_capacity) {completed++;}
    if (data.communication_preferences?.length > 0) {completed++;}
    if (acceptedTerms && acceptedPrivacy) {completed++;}

    return Math.round((completed / total) * 100);
  };

  const completionPercentage = calculateCompletion();

  const handleTermsChange = (checked: boolean) => {
    setAcceptedTerms(checked);
    onDataChange({ ...data, accepted_terms: checked });
  };

  const handlePrivacyChange = (checked: boolean) => {
    setAcceptedPrivacy(checked);
    onDataChange({ ...data, accepted_privacy: checked });
  };

  const handleSubmit = () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      toast({
        variant: "destructive",
        title: "Agreement Required",
        description: "Please accept the terms and privacy policy to continue.",
      });
      return;
    }

    setShowCelebration(true);
    setTimeout(() => {
      onSubmit();
    }, 2000);
  };

  const profileSections = [
    {
      title: "Personal Information",
      icon: User,
      color: "from-blue-500 to-purple-500",
      items: [
        { label: "Name", value: data.name || "Not provided" },
        { label: "Email", value: data.email || "Not provided" },
        { label: "Profile Photo", value: data.photo_url ? "Uploaded" : "Not uploaded" }
      ]
    },
    {
      title: "Academic Background",
      icon: GraduationCap,
      color: "from-green-500 to-blue-500",
      items: [
        { label: "Highest Degree", value: data.highest_degree || "Not provided" },
        { label: "Institution", value: data.alma_mater || "Not provided" },
        { label: "Current Position", value: data.current_position || "Not provided" },
        { label: "Years of Experience", value: data.years_of_experience ? `${data.years_of_experience} years` : "Not provided" },
        { label: "Publications", value: data.publications_count ? `${data.publications_count} publications` : "Not provided" }
      ]
    },
    {
      title: "Research & Expertise",
      icon: Microscope,
      color: "from-purple-500 to-pink-500",
      items: [
        { 
          label: "Research Interests", 
          value: data.research_interests?.length > 0 
            ? data.research_interests.join(", ") 
            : "Not provided" 
        },
        { 
          label: "Key Publications", 
          value: data.key_publications?.length > 0 
            ? `${data.key_publications.length} listed` 
            : "Not provided" 
        },
      ]
    },
    {
      title: "Mentoring Preferences",
      icon: Heart,
      color: "from-pink-500 to-red-500",
      items: [
        { 
          label: "Student Levels", 
          value: data.preferred_mentee_levels?.length > 0 
            ? data.preferred_mentee_levels.join(", ") 
            : "All levels" 
        },
        { 
          label: "Mentoring Capacity", 
          value: data.mentoring_capacity 
            ? `${data.mentoring_capacity} student${data.mentoring_capacity !== 1 ? 's' : ''}` 
            : "5 students (default)" 
        },
        { 
          label: "Communication", 
          value: data.communication_preferences?.length > 0 
            ? data.communication_preferences.join(", ") 
            : "All methods" 
        },
        { 
          label: "Global Mentoring", 
          value: data.timezone_flexible ? "Yes" : "Local timezone preferred" 
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-2xl p-8 text-center max-w-md mx-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <PartyPopper className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Team!</h2>
              <p className="text-gray-600">Setting up your mentor profile...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Complete!</h2>
        <p className="text-gray-600 mb-6">Review your information and join our mentor community</p>
        
        {/* Progress Ring */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              className="text-green-500"
              initial={{ strokeDasharray: "339.292 339.292", strokeDashoffset: 339.292 }}
              animate={{ strokeDashoffset: 339.292 - (339.292 * completionPercentage) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-bold text-green-600"
              >
                {completionPercentage}%
              </motion.div>
              <div className="text-xs text-gray-600">Complete</div>
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="flex justify-center gap-2 flex-wrap">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
              <Star className="w-3 h-3 mr-1" />
              Profile Builder
            </Badge>
          </motion.div>
          {(data.research_interests?.length || 0) >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
            >
              <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1">
                <Research className="w-3 h-3 mr-1" />
                Research Pioneer
              </Badge>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Profile Summary */}
      <div className="space-y-6">
        {profileSections.map((section, sectionIndex) => {
          const IconComponent = section.icon;
          
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + sectionIndex * 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className={`bg-gradient-to-r ${section.color} text-white`}>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {section.items.map((item, itemIndex) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + sectionIndex * 0.1 + itemIndex * 0.05 }}
                        className="flex justify-between items-start"
                      >
                        <span className="text-sm font-medium text-gray-600">{item.label}:</span>
                        <span className="text-sm text-gray-900 text-right max-w-[200px]">{item.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Terms and Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-purple-900">
              <Shield className="w-5 h-5" />
              Final Agreement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={handleTermsChange}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                I agree to the{' '}
                <a href="/terms" className="text-purple-600 hover:underline font-medium">
                  Terms of Service
                </a>{' '}
                and commit to providing respectful, professional mentorship to students.
              </label>
            </div>
            
            <div className="flex items-start gap-3">
              <Checkbox
                id="privacy"
                checked={acceptedPrivacy}
                onCheckedChange={handlePrivacyChange}
                className="mt-1"
              />
              <label htmlFor="privacy" className="text-sm text-gray-700 cursor-pointer">
                I acknowledge the{' '}
                <a href="/privacy" className="text-purple-600 hover:underline font-medium">
                  Privacy Policy
                </a>{' '}
                and consent to data processing for mentorship matching and platform functionality.
              </label>
            </div>

            {(!acceptedTerms || !acceptedPrivacy) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <p className="text-sm text-red-700">
                  Please accept both agreements to complete your mentor registration.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-center"
      >
        <Button
          onClick={handleSubmit}
          disabled={!acceptedTerms || !acceptedPrivacy || isSubmitting}
          className="w-full md:w-auto px-12 py-6 text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:opacity-90 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mr-3"
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              Creating Your Mentor Profile...
            </>
          ) : (
            <>
              <PartyPopper className="w-5 h-5 mr-3" />
              Join the Mentor Community
              <Sparkles className="w-5 h-5 ml-3" />
            </>
          )}
        </Button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-sm text-gray-600 mt-4"
        >
          🎉 You're about to join <strong>2,500+</strong> expert mentors making a difference worldwide
        </motion.p>
      </motion.div>
    </div>
  );
};

export default SummaryStep;