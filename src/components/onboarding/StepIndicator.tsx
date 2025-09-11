import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
  className
}) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <React.Fragment key={stepNumber}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted 
                      ? '#10b981' 
                      : isCurrent 
                        ? '#3b82f6' 
                        : '#e5e7eb'
                  }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                    {
                      'border-green-500 bg-green-500 text-white': isCompleted,
                      'border-blue-500 bg-blue-500 text-white shadow-lg': isCurrent,
                      'border-gray-300 bg-gray-200 text-gray-500': isUpcoming
                    }
                  )}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Check className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}

                  {/* Current step pulse effect */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-400"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut'
                      }}
                    />
                  )}
                </motion.div>

                {/* Step Label */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-center"
                >
                  <p className={cn(
                    "text-xs font-medium max-w-20 leading-tight",
                    {
                      'text-green-600': isCompleted,
                      'text-blue-600': isCurrent,
                      'text-gray-500': isUpcoming
                    }
                  )}>
                    {stepLabels[index]}
                  </p>
                </motion.div>
              </div>

              {/* Connection Line */}
              {index < totalSteps - 1 && (
                <div className="flex-1 mx-4 mb-6">
                  <motion.div
                    className="h-0.5 bg-gray-200 relative overflow-hidden rounded-full"
                    initial={false}
                  >
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{
                        width: stepNumber <= currentStep ? '100%' : '0%'
                      }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </motion.div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Bar Alternative (for mobile) */}
      <div className="mt-4 md:hidden">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Step {currentStep}</span>
          <span>{totalSteps} steps total</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};