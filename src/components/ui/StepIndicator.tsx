import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon, CheckCircle } from 'lucide-react';

interface StepIndicatorProps {
  steps: {
    id: string;
    title: string;
    description?: string;
    icon: LucideIcon;
  }[];
  currentStep: number;
  className?: string;
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'purple' | 'green' | 'mentor';
  onStepClick?: (stepIndex: number) => void;
  clickable?: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  className,
  variant = 'horizontal',
  size = 'md',
  color = 'blue',
  onStepClick,
  clickable = false
}) => {
  const sizeVariants = {
    sm: {
      circle: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-sm',
      description: 'text-xs'
    },
    md: {
      circle: 'w-12 h-12',
      icon: 'w-5 h-5', 
      text: 'text-base',
      description: 'text-sm'
    },
    lg: {
      circle: 'w-16 h-16',
      icon: 'w-6 h-6',
      text: 'text-lg',
      description: 'text-base'
    }
  };

  const colorVariants = {
    blue: {
      active: 'bg-blue-600 border-blue-600 text-white',
      completed: 'bg-green-600 border-green-600 text-white',
      pending: 'bg-gray-200 border-gray-300 text-gray-500',
      line: 'bg-blue-600',
      lineInactive: 'bg-gray-300'
    },
    purple: {
      active: 'bg-purple-600 border-purple-600 text-white',
      completed: 'bg-green-600 border-green-600 text-white', 
      pending: 'bg-gray-200 border-gray-300 text-gray-500',
      line: 'bg-purple-600',
      lineInactive: 'bg-gray-300'
    },
    green: {
      active: 'bg-green-600 border-green-600 text-white',
      completed: 'bg-green-700 border-green-700 text-white',
      pending: 'bg-gray-200 border-gray-300 text-gray-500',
      line: 'bg-green-600', 
      lineInactive: 'bg-gray-300'
    },
    mentor: {
      active: 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-600 text-white',
      completed: 'bg-gradient-to-r from-green-600 to-emerald-600 border-green-600 text-white',
      pending: 'bg-gray-200 border-gray-300 text-gray-500',
      line: 'bg-gradient-to-r from-purple-600 to-pink-600',
      lineInactive: 'bg-gray-300'
    }
  };

  const getStepState = (index: number) => {
    if (index < currentStep) {return 'completed';}
    if (index === currentStep) {return 'active';}
    return 'pending';
  };

  const handleStepClick = (index: number) => {
    if (clickable && onStepClick) {
      onStepClick(index);
    }
  };

  if (variant === 'vertical') {
    return (
      <div className={cn("flex flex-col space-y-4", className)}>
        {steps.map((step, index) => {
          const state = getStepState(index);
          const IconComponent = state === 'completed' ? CheckCircle : step.icon;
          
          return (
            <div key={step.id} className="relative flex items-start">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 -ml-px">
                  <div 
                    className={cn(
                      "w-full h-full",
                      index < currentStep ? colorVariants[color].line : colorVariants[color].lineInactive
                    )}
                  />
                </div>
              )}
              
              {/* Step circle */}
              <motion.button
                className={cn(
                  "relative flex items-center justify-center rounded-full border-2 flex-shrink-0",
                  sizeVariants[size].circle,
                  colorVariants[color][state],
                  clickable && "cursor-pointer hover:scale-110 transition-transform",
                  !clickable && "cursor-default"
                )}
                onClick={() => handleStepClick(index)}
                whileHover={clickable ? { scale: 1.1 } : {}}
                whileTap={clickable ? { scale: 0.95 } : {}}
              >
                <IconComponent className={sizeVariants[size].icon} />
              </motion.button>
              
              {/* Step content */}
              <div className="ml-4 flex-1">
                <h3 className={cn("font-semibold", sizeVariants[size].text)}>
                  {step.title}
                </h3>
                {step.description && (
                  <p className={cn("text-gray-600 mt-1", sizeVariants[size].description)}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {steps.map((step, index) => {
        const state = getStepState(index);
        const IconComponent = state === 'completed' ? CheckCircle : step.icon;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              {/* Step circle */}
              <motion.button
                className={cn(
                  "relative flex items-center justify-center rounded-full border-2 mb-2",
                  sizeVariants[size].circle,
                  colorVariants[color][state],
                  clickable && "cursor-pointer hover:scale-110 transition-transform",
                  !clickable && "cursor-default"
                )}
                onClick={() => handleStepClick(index)}
                whileHover={clickable ? { scale: 1.1 } : {}}
                whileTap={clickable ? { scale: 0.95 } : {}}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <IconComponent className={sizeVariants[size].icon} />
                
                {/* Pulse animation for active step */}
                {state === 'active' && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-current"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
              
              {/* Step label */}
              <div className="text-center">
                <h3 className={cn("font-medium", sizeVariants[size].text)}>
                  {step.title}
                </h3>
                {step.description && (
                  <p className={cn("text-gray-600 mt-1", sizeVariants[size].description)}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-4 relative">
                <div className={cn("w-full h-full", colorVariants[color].lineInactive)} />
                <motion.div
                  className={cn("h-full", colorVariants[color].line)}
                  initial={{ width: '0%' }}
                  animate={{ 
                    width: index < currentStep ? '100%' : '0%'
                  }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;