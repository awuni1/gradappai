import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User,
  GraduationCap,
  Heart,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Quote,
  Timer,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

interface OnboardingSkeletonScreenProps {
  onRetry?: () => void;
  stage?: 'authenticating' | 'loading_profile' | 'preparing' | 'almost_ready' | 'error' | 'timeout';
  progress?: number;
  isOffline?: boolean;
}

const OnboardingSkeletonScreen: React.FC<OnboardingSkeletonScreenProps> = ({
  onRetry,
  stage = 'authenticating',
  progress = 0,
  isOffline = false
}) => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Inspiring mentorship quotes
  const quotes = [
    {
      text: "The delicate balance of mentoring someone is not creating them in your own image, but giving them the opportunity to create themselves.",
      author: "Steven Spielberg"
    },
    {
      text: "A mentor is someone who allows you to see the hope inside yourself.",
      author: "Oprah Winfrey"
    },
    {
      text: "Tell me and I forget, teach me and I may remember, involve me and I learn.",
      author: "Benjamin Franklin"
    },
    {
      text: "The greatest good you can do for another is not just to share your riches but to reveal to him his own.",
      author: "Benjamin Disraeli"
    },
    {
      text: "Mentoring is a brain to pick, an ear to listen, and a push in the right direction.",
      author: "John C. Crosby"
    }
  ];

  // Rotate quotes every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  // Track time elapsed
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Define steps for skeleton
  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      icon: User,
      color: 'bg-blue-500',
      completed: progress >= 25
    },
    {
      id: 2,
      title: 'Academic Program',
      icon: GraduationCap,
      color: 'bg-green-500',
      completed: progress >= 50
    },
    {
      id: 3,
      title: 'Mentoring Preferences',
      icon: Heart,
      color: 'bg-purple-500',
      completed: progress >= 75
    },
    {
      id: 4,
      title: 'Summary',
      icon: CheckCircle,
      color: 'bg-pink-500',
      completed: progress >= 100
    }
  ];

  // Stage configurations
  const stageConfig = {
    authenticating: {
      title: "Authenticating your account...",
      description: "Verifying your mentor credentials",
      duration: "Usually takes 2-3 seconds"
    },
    loading_profile: {
      title: "Loading your mentor profile...",
      description: "Fetching your academic background and preferences",
      duration: "This may take a moment"
    },
    preparing: {
      title: "Preparing your onboarding...",
      description: "Setting up your personalized mentor journey",
      duration: "Almost there..."
    },
    almost_ready: {
      title: "Almost ready!",
      description: "Finalizing your mentor dashboard",
      duration: "Just a few more seconds"
    },
    error: {
      title: "Something went wrong",
      description: "We're having trouble loading your onboarding",
      duration: "Please try again"
    },
    timeout: {
      title: "This is taking longer than expected",
      description: "Your connection might be slow",
      duration: "Try again or check your internet connection"
    }
  };

  const currentStage = stageConfig[stage];

  // Skeleton shimmer animation
  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: { 
      x: '100%',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear'
      }
    }
  };

  const SkeletonElement = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className={`relative overflow-hidden bg-gray-200 rounded ${className}`}
    >
      <motion.div
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        style={{ animationDelay: `${delay}s` }}
      />
    </motion.div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl">
          
          {/* Status Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-6">
              {/* Status Icon */}
              <motion.div
                className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-4"
                animate={{ 
                  rotate: stage === 'error' || stage === 'timeout' ? 0 : 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
              >
                {stage === 'error' || stage === 'timeout' ? (
                  <RefreshCw className="w-8 h-8 text-white" />
                ) : isOffline ? (
                  <WifiOff className="w-8 h-8 text-white" />
                ) : (
                  <Sparkles className="w-8 h-8 text-white" />
                )}
              </motion.div>

              {/* Network Status */}
              <div className="flex items-center gap-2">
                {isOffline ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full">
                    <WifiOff className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">Offline</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">Connected</span>
                  </div>
                )}
                
                {/* Timer */}
                <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">{timeElapsed}s</span>
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {currentStage.title}
            </h1>
            <p className="text-gray-600 text-lg mb-2">{currentStage.description}</p>
            <p className="text-sm text-gray-500">{currentStage.duration}</p>

            {/* Progress Bar */}
            {stage !== 'error' && stage !== 'timeout' && (
              <div className="w-full max-w-md mx-auto mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress + 10, 90)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Step Indicators Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex justify-center items-center space-x-4 md:space-x-8">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <motion.div
                      className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center mb-2 ${
                        step.completed ? 'opacity-100' : 'opacity-50'
                      }`}
                      animate={{
                        scale: step.completed ? [1, 1.1, 1] : 1,
                        opacity: step.completed ? 1 : 0.5
                      }}
                      transition={{
                        scale: { duration: 0.5, delay: index * 0.1 },
                        opacity: { duration: 0.3 }
                      }}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </motion.div>
                    <SkeletonElement className="h-3 w-16" delay={index * 0.1} />
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Main Content Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/80 backdrop-blur-md shadow-2xl border border-white/20">
              <CardContent className="p-8">
                
                {/* Header Skeleton */}
                <div className="flex items-center gap-4 mb-8">
                  <SkeletonElement className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <SkeletonElement className="h-6 w-48" />
                    <SkeletonElement className="h-4 w-64" />
                  </div>
                </div>

                {/* Form Fields Skeleton */}
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <SkeletonElement className="h-4 w-24" delay={0.1} />
                      <SkeletonElement className="h-12 w-full" delay={0.2} />
                    </div>
                    <div className="space-y-4">
                      <SkeletonElement className="h-4 w-32" delay={0.3} />
                      <SkeletonElement className="h-12 w-full" delay={0.4} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <SkeletonElement className="h-4 w-40" delay={0.5} />
                    <SkeletonElement className="h-32 w-full" delay={0.6} />
                  </div>

                  <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                      <SkeletonElement 
                        key={i} 
                        className="h-8 w-24 rounded-full" 
                        delay={0.7 + i * 0.1} 
                      />
                    ))}
                  </div>
                </div>

                {/* Navigation Skeleton */}
                <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200">
                  <SkeletonElement className="h-10 w-24 rounded-lg" />
                  <SkeletonElement className="h-4 w-20" />
                  <SkeletonElement className="h-10 w-28 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Inspirational Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6 text-center">
                <Quote className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuoteIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <blockquote className="text-lg italic text-gray-700 mb-3">
                      "{quotes[currentQuoteIndex].text}"
                    </blockquote>
                    <cite className="text-sm font-medium text-purple-600">
                      — {quotes[currentQuoteIndex].author}
                    </cite>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Error/Timeout Actions */}
          {(stage === 'error' || stage === 'timeout') && onRetry && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-8"
            >
              <Button
                onClick={onRetry}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 px-8 py-6 text-lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </Button>
              
              {stage === 'timeout' && (
                <p className="text-sm text-gray-500 mt-4">
                  If this continues, try refreshing the page or check your internet connection.
                </p>
              )}
            </motion.div>
          )}

          {/* Development Info (only in dev mode) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
                <span>Stage: {stage}</span>
                <span>•</span>
                <span>Progress: {progress}%</span>
                <span>•</span>
                <span>Time: {timeElapsed}s</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingSkeletonScreen;