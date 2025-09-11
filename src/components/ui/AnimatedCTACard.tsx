import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface AnimatedCTACardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  theme: 'student' | 'mentor';
  features?: string[];
  className?: string;
}

const AnimatedCTACard: React.FC<AnimatedCTACardProps> = ({
  title,
  subtitle,
  description,
  icon: Icon,
  onClick,
  theme,
  features = [],
  className = '',
}) => {
  const themeConfig = {
    student: {
      gradient: 'from-blue-500/20 via-cyan-500/20 to-teal-500/20',
      accentGradient: 'from-blue-600 to-cyan-600',
      borderGradient: 'from-blue-400/50 to-cyan-400/50',
      glowColor: 'blue-500/20',
      iconBg: 'from-blue-500 to-cyan-500',
    },
    mentor: {
      gradient: 'from-purple-500/20 via-pink-500/20 to-rose-500/20',
      accentGradient: 'from-purple-600 to-pink-600',
      borderGradient: 'from-purple-400/50 to-pink-400/50',
      glowColor: 'purple-500/20',
      iconBg: 'from-purple-500 to-pink-500',
    },
  };

  const config = themeConfig[theme];

  return (
    <motion.div
      className={`relative group cursor-pointer ${className}`}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      onClick={onClick}
    >
      {/* Glow Effect */}
      <motion.div
        className={`absolute -inset-0.5 bg-gradient-to-r ${config.borderGradient} rounded-2xl blur opacity-0 group-hover:opacity-100`}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main Card */}
      <div className={`
        relative h-full p-8 
        backdrop-blur-lg bg-gradient-to-br ${config.gradient}
        border border-white/30 rounded-2xl shadow-2xl
        backdrop-saturate-150
        transition-all duration-500 ease-out
        group-hover:shadow-3xl group-hover:backdrop-blur-xl
        group-hover:border-white/50
      `}>
        {/* Animated Icon */}
        <motion.div
          className={`
            inline-flex items-center justify-center w-16 h-16 mb-6
            bg-gradient-to-br ${config.iconBg} rounded-xl shadow-lg
          `}
          whileHover={{ 
            scale: 1.1, 
            rotate: 5,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>

        {/* Content */}
        <div className="space-y-4">
          {/* Title with Gradient */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h3 className={`
              text-2xl font-bold bg-gradient-to-r ${config.accentGradient} 
              bg-clip-text text-transparent mb-2
            `}>
              {title}
            </h3>
            <p className="text-lg font-semibold text-gray-700">
              {subtitle}
            </p>
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-gray-600 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {description}
          </motion.p>

          {/* Features List */}
          {features.length > 0 && (
            <motion.div
              className="space-y-2 pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                >
                  <div className={`
                    w-2 h-2 rounded-full bg-gradient-to-r ${config.iconBg}
                  `} />
                  <span className="text-sm text-gray-600 font-medium">
                    {feature}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* CTA Button */}
          <motion.div
            className="pt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <motion.button
              className={`
                w-full px-6 py-4 rounded-xl font-semibold text-white
                bg-gradient-to-r ${config.accentGradient}
                shadow-lg shadow-${theme === 'student' ? 'blue' : 'purple'}-500/25
                transition-all duration-300 ease-out
                hover:shadow-xl hover:shadow-${theme === 'student' ? 'blue' : 'purple'}-500/40
                active:scale-95
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started
              <motion.span
                className="inline-block ml-2"
                animate={{ x: [0, 5, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                →
              </motion.span>
            </motion.button>
          </motion.div>
        </div>

        {/* Corner Accent */}
        <div className={`
          absolute top-0 right-0 w-20 h-20 
          bg-gradient-to-br ${config.iconBg} opacity-10 rounded-bl-full
        `} />
      </div>
    </motion.div>
  );
};

export default AnimatedCTACard;