import React from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award, 
  Target,
  TrendingUp,
  Lightbulb,
  Star,
  Heart,
  Building
} from 'lucide-react';

interface FloatingImagesProps {
  theme: 'student' | 'mentor';
  className?: string;
}

const FloatingImages: React.FC<FloatingImagesProps> = ({ theme, className = '' }) => {
  const studentIcons = [
    { Icon: GraduationCap, delay: 0, position: 'top-10 left-10' },
    { Icon: BookOpen, delay: 1, position: 'top-20 right-20' },
    { Icon: Target, delay: 2, position: 'bottom-20 left-20' },
    { Icon: Building, delay: 1.5, position: 'bottom-10 right-10' },
  ];

  const mentorIcons = [
    { Icon: Users, delay: 0, position: 'top-10 left-10' },
    { Icon: Award, delay: 1, position: 'top-20 right-20' },
    { Icon: TrendingUp, delay: 2, position: 'bottom-20 left-20' },
    { Icon: Lightbulb, delay: 1.5, position: 'bottom-10 right-10' },
    { Icon: Star, delay: 0.5, position: 'top-1/2 left-5' },
    { Icon: Heart, delay: 2.5, position: 'top-1/3 right-5' },
  ];

  const icons = theme === 'student' ? studentIcons : mentorIcons;
  
  const floatAnimation = {
    y: [-10, 10, -10],
    rotate: [-5, 5, -5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };

  const themeColors = {
    student: 'from-blue-400 to-cyan-400',
    mentor: 'from-purple-400 to-pink-400',
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {icons.map(({ Icon, delay, position }, index) => (
        <motion.div
          key={index}
          className={`absolute ${position}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 0.2, 
            scale: 1,
            ...floatAnimation,
          }}
          transition={{
            opacity: { delay: delay * 0.5, duration: 1 },
            scale: { delay: delay * 0.5, duration: 0.5 },
            y: { 
              delay: delay,
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            rotate: {
              delay: delay,
              duration: 6 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        >
          <div className={`
            w-12 h-12 rounded-full 
            bg-gradient-to-br ${themeColors[theme]}
            flex items-center justify-center
            backdrop-blur-sm shadow-lg
            border border-white/30
          `}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </motion.div>
      ))}
      
      {/* Additional decorative elements */}
      <motion.div
        className="absolute top-1/4 left-1/3 w-2 h-2 bg-white/20 rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-white/15 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
    </div>
  );
};

export default FloatingImages;