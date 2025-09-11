import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedGradientProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'mentor' | 'dashboard' | 'hero' | 'subtle';
  speed?: 'slow' | 'normal' | 'fast';
  direction?: 'horizontal' | 'vertical' | 'diagonal' | 'radial';
}

const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
  children,
  className,
  variant = 'mentor',
  speed = 'normal',
  direction = 'diagonal'
}) => {
  const gradientVariants = {
    mentor: {
      base: "bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500",
      animated: "bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400"
    },
    dashboard: {
      base: "bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50",
      animated: "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
    },
    hero: {
      base: "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600",
      animated: "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
    },
    subtle: {
      base: "bg-gradient-to-br from-gray-50 via-white to-gray-50",
      animated: "bg-gradient-to-br from-blue-50 via-white to-purple-50"
    }
  };

  const speedSettings = {
    slow: 8,
    normal: 5,
    fast: 3
  };

  const directionClasses = {
    horizontal: "bg-gradient-to-r",
    vertical: "bg-gradient-to-b", 
    diagonal: "bg-gradient-to-br",
    radial: "bg-radial-gradient"
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Base gradient */}
      <div className={cn("absolute inset-0", gradientVariants[variant].base)} />
      
      {/* Animated gradient overlay */}
      <motion.div
        className={cn("absolute inset-0", gradientVariants[variant].animated)}
        animate={{
          background: [
            gradientVariants[variant].base,
            gradientVariants[variant].animated,
            gradientVariants[variant].base
          ]
        }}
        transition={{
          duration: speedSettings[speed],
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />

      {/* Animated floating shapes */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full mix-blend-multiply filter blur-xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: speedSettings[speed] * 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute top-40 right-10 w-72 h-72 bg-white/10 rounded-full mix-blend-multiply filter blur-xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1.2, 1, 1.2]
        }}
        transition={{
          duration: speedSettings[speed] * 2.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-20 left-1/2 w-72 h-72 bg-white/10 rounded-full mix-blend-multiply filter blur-xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -50, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: speedSettings[speed] * 1.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />

      {/* Content overlay */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
};

export default AnimatedGradient;