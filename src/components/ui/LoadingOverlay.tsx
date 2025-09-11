import React from 'react';
import { cn } from '@/lib/utils';
import LoadingSpinner, { LoadingSpinnerProps } from './LoadingSpinner';
import { 
  loadingOverlayStyles,
  LoadingOverlayStyle 
} from '@/utils/loadingVariants';

export interface LoadingOverlayProps extends Omit<LoadingSpinnerProps, 'position'> {
  /** Whether to show the overlay */
  show?: boolean;
  
  /** Overlay style variant */
  overlayStyle?: LoadingOverlayStyle;
  
  /** Custom backdrop opacity (0-100) */
  backdropOpacity?: number;
  
  /** Disable backdrop blur effect */
  noBlur?: boolean;
  
  /** Render as absolute positioned (for containers) vs fixed (full screen) */
  absolute?: boolean;
  
  /** Additional backdrop classes */
  backdropClassName?: string;
  
  /** Additional container classes */
  containerClassName?: string;
  
  /** Z-index override */
  zIndex?: number;
  
  /** Prevent backdrop clicks from bubbling */
  preventBackdropClick?: boolean;
  
  /** Custom content instead of default spinner */
  children?: React.ReactNode;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show = true,
  overlayStyle = 'backdrop',
  backdropOpacity = 20,
  noBlur = false,
  absolute = false,
  backdropClassName,
  containerClassName,
  zIndex = 50,
  preventBackdropClick = true,
  children,
  variant = 'primary',
  size = 'lg',
  color = 'primary',
  message = 'Loading...',
  progress,
  className,
  reducedMotion = false,
  ...spinnerProps
}) => {
  if (!show) {return null;}

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (preventBackdropClick) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const backdropClasses = cn(
    // Base positioning
    absolute ? 'absolute' : 'fixed',
    'inset-0 flex items-center justify-center',
    
    // Backdrop styling
    !noBlur && 'backdrop-blur-sm',
    
    // Z-index - use predefined classes
    zIndex >= 100 ? 'z-100' : 
    zIndex >= 90 ? 'z-90' :
    zIndex >= 80 ? 'z-80' :
    zIndex >= 70 ? 'z-70' :
    zIndex >= 60 ? 'z-60' : 'z-50',
    
    // Custom backdrop classes
    backdropClassName
  );

  const backgroundStyle = {
    backgroundColor: `rgba(0, 0, 0, ${backdropOpacity / 100})`
  };

  const containerClasses = cn(
    // Overlay style
    overlayStyle !== 'transparent' && loadingOverlayStyles[overlayStyle],
    
    // Default container styling
    overlayStyle === 'card' && 'max-w-sm w-full',
    
    // Animation
    'animate-scale-in',
    reducedMotion && 'motion-reduce-fallback',
    
    // Custom container classes
    containerClassName
  );

  return (
    <div 
      className={backdropClasses}
      style={backgroundStyle}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Loading content"
    >
      <div className={containerClasses}>
        {children || (
          <LoadingSpinner
            variant={variant}
            size={size}
            color={color}
            message={message}
            progress={progress}
            position="center"
            reducedMotion={reducedMotion}
            className={className}
            {...spinnerProps}
          />
        )}
      </div>
    </div>
  );
};

// Convenience component for full-screen loading
export const FullScreenLoader: React.FC<Omit<LoadingOverlayProps, 'absolute'>> = (props) => (
  <LoadingOverlay {...props} absolute={false} />
);

// Convenience component for container loading
export const ContainerLoader: React.FC<Omit<LoadingOverlayProps, 'absolute'>> = (props) => (
  <LoadingOverlay {...props} absolute={true} />
);

export default LoadingOverlay;