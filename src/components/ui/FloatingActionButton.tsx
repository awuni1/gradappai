import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'mentor' | 'success' | 'warning';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  tooltip?: string;
  disabled?: boolean;
  badge?: number;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon: Icon,
  onClick,
  className,
  size = 'md',
  variant = 'primary',
  position = 'bottom-right',
  tooltip,
  disabled = false,
  badge
}) => {
  const sizeVariants = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14', 
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  const colorVariants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-gray-500/30',
    mentor: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/30',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/30',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-yellow-500/30'
  };

  const positionVariants = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
    'center': 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <div className="relative">
      <motion.button
        className={cn(
          'relative rounded-full shadow-xl backdrop-blur-sm border border-white/20',
          'flex items-center justify-center z-50',
          'transition-all duration-300 ease-out',
          'hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/20',
          sizeVariants[size],
          colorVariants[variant],
          positionVariants[position],
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={onClick}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Gradient background for mentor variant */}
        {variant === 'mentor' && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 animate-pulse opacity-75" />
        )}

        {/* Icon */}
        <Icon className={cn(iconSizes[size], 'relative z-10')} />

        {/* Badge */}
        {badge && badge > 0 && (
          <motion.div
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {badge > 99 ? '99+' : badge}
          </motion.div>
        )}

        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white/20"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: [0, 1.2], opacity: [0.5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
        />
      </motion.button>

      {/* Tooltip */}
      {tooltip && (
        <motion.div
          className={cn(
            'absolute bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap z-40',
            'pointer-events-none opacity-0 group-hover:opacity-100',
            position.includes('right') ? 'right-full mr-3 top-1/2 transform -translate-y-1/2' :
            position.includes('left') ? 'left-full ml-3 top-1/2 transform -translate-y-1/2' :
            'bottom-full mb-3 left-1/2 transform -translate-x-1/2'
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {tooltip}
          {/* Arrow */}
          <div 
            className={cn(
              'absolute w-2 h-2 bg-gray-900 transform rotate-45',
              position.includes('right') ? 'right-0 top-1/2 transform translate-x-1 -translate-y-1/2 rotate-45' :
              position.includes('left') ? 'left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 rotate-45' :
              'top-full left-1/2 transform -translate-x-1/2 -translate-y-1 rotate-45'
            )}
          />
        </motion.div>
      )}
    </div>
  );
};

export default FloatingActionButton;