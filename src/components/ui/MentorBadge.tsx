import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle, Shield, Star, Award, Crown, Zap } from 'lucide-react';

interface MentorBadgeProps {
  type: 'verified' | 'top_mentor' | 'expert' | 'rising_star' | 'experienced' | 'responsive';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showLabel?: boolean;
}

const MentorBadge: React.FC<MentorBadgeProps> = ({
  type,
  className,
  size = 'md',
  animated = true,
  showLabel = false
}) => {
  const badgeConfig = {
    verified: {
      icon: CheckCircle,
      label: 'Verified Mentor',
      colors: 'bg-green-100 text-green-800 border-green-300',
      iconColor: 'text-green-600',
      gradient: 'from-green-400 to-emerald-500'
    },
    top_mentor: {
      icon: Crown,
      label: 'Top 5% Mentor',
      colors: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      iconColor: 'text-yellow-600',
      gradient: 'from-yellow-400 to-amber-500'
    },
    expert: {
      icon: Award,
      label: 'Expert Mentor', 
      colors: 'bg-purple-100 text-purple-800 border-purple-300',
      iconColor: 'text-purple-600',
      gradient: 'from-purple-400 to-violet-500'
    },
    rising_star: {
      icon: Star,
      label: 'Rising Star',
      colors: 'bg-blue-100 text-blue-800 border-blue-300', 
      iconColor: 'text-blue-600',
      gradient: 'from-blue-400 to-cyan-500'
    },
    experienced: {
      icon: Shield,
      label: 'Experienced',
      colors: 'bg-gray-100 text-gray-800 border-gray-300',
      iconColor: 'text-gray-600',
      gradient: 'from-gray-400 to-slate-500'
    },
    responsive: {
      icon: Zap,
      label: 'Quick Response',
      colors: 'bg-orange-100 text-orange-800 border-orange-300',
      iconColor: 'text-orange-600', 
      gradient: 'from-orange-400 to-red-500'
    }
  };

  const sizeVariants = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      spacing: 'gap-1'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      spacing: 'gap-1.5'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      spacing: 'gap-2'
    }
  };

  const config = badgeConfig[type];
  const sizeConfig = sizeVariants[size];
  const IconComponent = config.icon;

  const BadgeComponent = animated ? motion.div : 'div';

  const motionProps = animated ? {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    whileHover: { scale: 1.05 },
    transition: { type: "spring", stiffness: 300, damping: 20 }
  } : {};

  return (
    <BadgeComponent
      className={cn(
        'relative inline-flex items-center font-medium rounded-full border',
        'backdrop-blur-sm shadow-sm',
        sizeConfig.container,
        sizeConfig.spacing,
        config.colors,
        className
      )}
      {...motionProps}
    >
      {/* Gradient background for special badges */}
      {(type === 'top_mentor' || type === 'expert') && (
        <div 
          className={cn(
            'absolute inset-0 rounded-full opacity-10',
            `bg-gradient-to-r ${config.gradient}`
          )}
        />
      )}

      {/* Icon */}
      <IconComponent className={cn(sizeConfig.icon, config.iconColor)} />
      
      {/* Label */}
      {showLabel && (
        <span className="relative z-10 font-semibold">
          {config.label}
        </span>
      )}

      {/* Glow effect for top mentor */}
      {type === 'top_mentor' && animated && (
        <motion.div
          className="absolute inset-0 rounded-full bg-yellow-400 opacity-20 blur-sm"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Sparkle animation for rising star */}
      {type === 'rising_star' && animated && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="absolute top-0 left-1/2 w-1 h-1 bg-blue-400 rounded-full transform -translate-x-1/2" />
          <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-cyan-400 rounded-full transform -translate-x-1/2" />
        </motion.div>
      )}
    </BadgeComponent>
  );
};

export default MentorBadge;