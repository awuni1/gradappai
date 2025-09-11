import React from 'react';
import { motion } from 'framer-motion';

interface ImageOverlayProps {
  imageUrl: string;
  alt: string;
  overlayGradient?: string;
  overlayOpacity?: number;
  className?: string;
  children?: React.ReactNode;
  parallax?: boolean;
}

const ImageOverlay: React.FC<ImageOverlayProps> = ({
  imageUrl,
  alt,
  overlayGradient = 'from-black/40 to-transparent',
  overlayOpacity = 0.6,
  className = '',
  children,
  parallax = false,
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Image */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
        initial={parallax ? { scale: 1.1 } : {}}
        animate={parallax ? { scale: 1 } : {}}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
      />
      
      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${overlayGradient}`}
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Accessibility - Hidden alt text for screen readers */}
      <span className="sr-only">{alt}</span>
    </div>
  );
};

export default ImageOverlay;