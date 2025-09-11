import React from 'react';
import { motion } from 'framer-motion';
import { Check, User, GraduationCap, Settings, FileCheck } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  isOptional?: boolean;
}

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  className?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  completedSteps,
  className = ''
}) => {
  const steps: Step[] = [
    {
      number: 1,
      title: 'Basic Information',
      description: 'Personal & contact details',
      icon: User,
    },
    {
      number: 2,
      title: 'Academic Program',
      description: 'CV upload & expertise',
      icon: GraduationCap,
    },
    {
      number: 3,
      title: 'Preferences',
      description: 'Mentoring criteria',
      icon: Settings,
      isOptional: true,
    },
    {
      number: 4,
      title: 'Summary',
      description: 'Review & confirm',
      icon: FileCheck,
    },
  ];

  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) {return 'completed';}
    if (stepNumber === currentStep) {return 'current';}
    if (stepNumber < currentStep) {return 'completed';}
    return 'upcoming';
  };

  const getStepIcon = (step: Step, status: string) => {
    if (status === 'completed') {
      return <Check className="w-5 h-5 text-white" />;
    }
    const IconComponent = step.icon;
    return <IconComponent className="w-5 h-5 text-white" />;
  };

  const getStepColors = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          border: 'border-green-500',
          text: 'text-green-600',
        };
      case 'current':
        return {
          bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
          border: 'border-purple-500',
          text: 'text-purple-600',
        };
      default:
        return {
          bg: 'bg-gray-300',
          border: 'border-gray-300',
          text: 'text-gray-500',
        };
    }
  };

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile Progress Bar */}
      <div className="sm:hidden mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm font-medium text-purple-600">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {steps[currentStep - 1]?.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {steps[currentStep - 1]?.description}
            {steps[currentStep - 1]?.isOptional && (
              <span className="text-purple-500 ml-1">(Optional)</span>
            )}
          </p>
        </div>
      </div>

      {/* Desktop Step Indicator */}
      <div className="hidden sm:block">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-200">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step) => {
              const status = getStepStatus(step.number);
              const colors = getStepColors(status);

              return (
                <div key={step.number} className="flex flex-col items-center">
                  {/* Step Circle */}
                  <motion.div
                    className={`
                      relative w-16 h-16 rounded-full border-4 ${colors.border}
                      flex items-center justify-center z-10
                      ${colors.bg} shadow-lg
                    `}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: status === 'current' ? 1.1 : 1,
                      opacity: 1,
                    }}
                    transition={{ 
                      duration: 0.3, 
                      delay: step.number * 0.1,
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                    whileHover={{ scale: status === 'current' ? 1.15 : 1.05 }}
                  >
                    {getStepIcon(step, status)}
                    
                    {/* Pulse animation for current step */}
                    {status === 'current' && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-purple-400"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Step Content */}
                  <motion.div
                    className="mt-4 text-center max-w-32"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: step.number * 0.1 + 0.2, duration: 0.3 }}
                  >
                    <h3 className={`text-sm font-semibold ${colors.text}`}>
                      {step.title}
                      {step.isOptional && (
                        <span className="block text-xs text-purple-500 mt-1">
                          (Optional)
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </p>
                  </motion.div>

                  {/* Step Number Badge */}
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center z-20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: step.number * 0.1 + 0.3, duration: 0.2 }}
                  >
                    <span className="text-xs font-bold text-gray-700">
                      {step.number}
                    </span>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Progress */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-purple-600">
              {Math.round(progressPercentage)}% Complete
            </span>
            {' • '}
            <span>
              {completedSteps.length} of {steps.length} steps finished
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default StepIndicator;