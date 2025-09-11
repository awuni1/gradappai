import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: 'purple' | 'blue' | 'green' | 'pink' | 'gradient';
  showPercentage?: boolean;
  className?: string;
  children?: React.ReactNode;
  animated?: boolean;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'purple',
  showPercentage = true,
  className,
  children,
  animated = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorVariants = {
    purple: {
      stroke: 'url(#purpleGradient)',
      background: '#f3e8ff'
    },
    blue: {
      stroke: 'url(#blueGradient)', 
      background: '#dbeafe'
    },
    green: {
      stroke: 'url(#greenGradient)',
      background: '#dcfce7'
    },
    pink: {
      stroke: 'url(#pinkGradient)',
      background: '#fce7f3'
    },
    gradient: {
      stroke: 'url(#rainbowGradient)',
      background: '#f8fafc'
    }
  };

  const CircleComponent = animated ? motion.circle : 'circle';

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>
          <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorVariants[color].background}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-30"
        />
        
        {/* Progress circle */}
        <CircleComponent
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorVariants[color].stroke}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          {...(animated && {
            animate: { strokeDashoffset },
            initial: { strokeDashoffset: circumference },
            transition: { duration: 1, ease: "easeOut" }
          })}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ? children : showPercentage && (
          <motion.div 
            className="text-center"
            {...(animated && {
              initial: { opacity: 0, scale: 0.5 },
              animate: { opacity: 1, scale: 1 },
              transition: { delay: 0.5, duration: 0.5 }
            })}
          >
            <div className="text-2xl font-bold text-gray-800">
              {Math.round(progress)}%
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Complete
            </div>
          </motion.div>
        )}
      </div>

      {/* Glow effect for gradient variant */}
      {color === 'gradient' && (
        <div 
          className="absolute inset-0 rounded-full opacity-20 blur-md"
          style={{
            background: 'conic-gradient(from 0deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)',
            transform: 'scale(1.1)'
          }}
        />
      )}
    </div>
  );
};

export default ProgressRing;