import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, ArrowRight, User, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingData } from './OnboardingWizard';

interface OnboardingCompleteProps {
  data: OnboardingData;
  isLoading: boolean;
  onComplete: () => void;
}

export const OnboardingComplete: React.FC<OnboardingCompleteProps> = ({
  data,
  isLoading,
  onComplete
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const celebrationVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 300
      }
    }
  };

  const confettiVariants = {
    hidden: { opacity: 0, scale: 0, rotate: 0 },
    visible: {
      opacity: [0, 1, 1, 0],
      scale: [0, 1, 1, 0],
      rotate: [0, 180, 360],
      y: [0, -100, 100],
      transition: {
        duration: 3,
        times: [0, 0.1, 0.9, 1],
        repeat: Infinity,
        repeatDelay: 2
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-8 text-center relative overflow-hidden"
    >
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              variants={confettiVariants}
              initial="hidden"
              animate="visible"
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 20}%`,
                color: ['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b'][i % 5]
              }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Celebration */}
      <motion.div variants={celebrationVariants} className="mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        
        <motion.h1
          variants={itemVariants}
          className="text-3xl font-bold text-gray-900 mb-3"
        >
          🎉 Welcome to GradApp, {data.firstName}!
        </motion.h1>
        
        <motion.p
          variants={itemVariants}
          className="text-lg text-gray-600 mb-6"
        >
          Your profile has been created successfully. You're all set to begin your graduate school journey!
        </motion.p>
      </motion.div>

      {/* Profile Summary */}
      <motion.div variants={itemVariants} className="mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-none shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center justify-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span>Your Profile Summary</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Personal Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-blue-600 mb-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Personal Info</span>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>{data.firstName} {data.lastName}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  {data.currentDegree} from {data.currentInstitution}
                </p>
                {data.gpa && (
                  <p className="text-sm text-gray-600">
                    GPA: {data.gpa}
                  </p>
                )}
              </div>

              {/* Target Program */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-purple-600 mb-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">Target Program</span>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>{data.targetDegreeLevel.charAt(0).toUpperCase() + data.targetDegreeLevel.slice(1)}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  in {data.targetField}
                </p>
              </div>

              {/* Research Interests */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-green-600 mb-2">
                  <Target className="h-4 w-4" />
                  <span className="font-medium">Research Interests</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {data.researchInterests.slice(0, 3).map((interest) => (
                    <Badge
                      key={interest}
                      variant="secondary"
                      className="text-xs bg-green-100 text-green-800"
                    >
                      {interest}
                    </Badge>
                  ))}
                  {data.researchInterests.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{data.researchInterests.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What's Next */}
      <motion.div variants={itemVariants} className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What's next?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="text-blue-600 mb-2">
              <BookOpen className="h-6 w-6 mx-auto" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Explore Universities</h4>
            <p className="text-gray-600">
              Discover programs that match your interests and goals
            </p>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="text-purple-600 mb-2">
              <User className="h-6 w-6 mx-auto" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Connect with Mentors</h4>
            <p className="text-gray-600">
              Get guidance from experienced professionals
            </p>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="text-green-600 mb-2">
              <Target className="h-6 w-6 mx-auto" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Track Applications</h4>
            <p className="text-gray-600">
              Manage deadlines and requirements efficiently
            </p>
          </Card>
        </div>
      </motion.div>

      {/* Action Button */}
      <motion.div variants={itemVariants}>
        <Button
          onClick={onComplete}
          disabled={isLoading}
          size="lg"
          className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Launching dashboard...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>Go to Your Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </div>
          )}
        </Button>
      </motion.div>

      {isLoading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-600 mt-4"
        >
          Almost ready! Taking you to your dashboard...
        </motion.p>
      )}
    </motion.div>
  );
};