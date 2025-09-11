import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'mentor' | 'gradient' | 'elevated';
  hoverable?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  className,
  variant = 'default',
  hoverable = false,
  animated = true,
  onClick
}) => {
  const baseClasses = "relative overflow-hidden border border-white/20 shadow-xl";
  
  const variants = {
    default: "bg-white/80 backdrop-blur-md",
    mentor: "bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-indigo-500/10 backdrop-blur-lg border-purple-200/30",
    gradient: "bg-gradient-to-br from-white/90 via-white/70 to-white/50 backdrop-blur-lg",
    elevated: "bg-white/90 backdrop-blur-xl shadow-2xl border-white/30"
  };

  const hoverVariants = {
    default: {
      scale: 1.02,
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.3, ease: "easeOut" }
    },
    mentor: {
      scale: 1.02,
      boxShadow: "0 25px 50px rgba(124, 58, 237, 0.2)",
      borderColor: "rgba(124, 58, 237, 0.3)",
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const CardComponent = animated ? motion.div : 'div';

  const motionProps = animated ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    whileHover: hoverable ? hoverVariants[variant] || hoverVariants.default : undefined,
    whileTap: onClick ? { scale: 0.98 } : undefined,
    transition: { duration: 0.5, ease: "easeOut" }
  } : {};

  return (
    <CardComponent
      className={cn(
        baseClasses,
        variants[variant],
        "rounded-xl",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...motionProps}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Floating elements for mentor variant */}
      {variant === 'mentor' && (
        <>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-400/20 rounded-full blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-pink-400/20 rounded-full blur-xl" />
        </>
      )}
    </CardComponent>
  );
};

export default GlassmorphicCard;