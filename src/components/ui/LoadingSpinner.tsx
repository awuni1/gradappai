import React from 'react';
import { cn } from '@/lib/utils';
import { 
  loadingSizes, 
  loadingColors, 
  loadingPositions,
  LoadingSize, 
  LoadingColor, 
  LoadingPosition 
} from '@/utils/loadingVariants';

export interface LoadingSpinnerProps {
  /** Spinner variant - different visual styles */
  variant?: 'primary' | 'secondary' | 'micro' | 'progress';
  
  /** Size of the spinner */
  size?: LoadingSize;
  
  /** Color theme */
  color?: LoadingColor;
  
  /** Loading message to display */
  message?: string;
  
  /** Progress percentage (0-100) for progress variant */
  progress?: number;
  
  /** Position within container */
  position?: LoadingPosition;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Disable animations for reduced motion */
  reducedMotion?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'primary',
  size = 'md',
  color = 'primary',
  message,
  progress = 0,
  position = 'center',
  className,
  reducedMotion = false
}) => {
  const sizeClasses = loadingSizes[size];
  const colorClasses = loadingColors[color];
  const positionClasses = loadingPositions[position];
  
  const motionClass = reducedMotion ? 'motion-reduce-fallback' : '';

  const renderPrimarySpinner = () => (
    <div className={cn('relative', sizeClasses.container)}>
      {/* Outer decorative ring */}
      <div className={cn(
        'absolute inset-0 rounded-full border-2',
        colorClasses.border,
        'opacity-20'
      )} />
      
      {/* Main spinning element with gradient effect */}
      <div className={cn(
        'absolute inset-0 rounded-full border-4 border-transparent',
        'border-t-gradapp-primary border-r-gradapp-secondary',
        'animate-spin-elegant',
        motionClass
      )} />
      
      {/* Inner spinning ring */}
      <div className={cn(
        'absolute inset-2 rounded-full border-2 border-transparent border-t-current',
        colorClasses.spinner,
        'animate-spin',
        'opacity-60',
        motionClass
      )} style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
      
      {/* Center pulsing dot */}
      <div className={cn(
        'absolute inset-0 m-auto w-2 h-2 rounded-full',
        colorClasses.bg,
        'animate-pulse-smooth',
        motionClass
      )} />
    </div>
  );

  const renderSecondarySpinner = () => (
    <div className={cn('flex items-center', sizeClasses.gap)}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full',
            sizeClasses.dots,
            colorClasses.bg,
            `animate-dot-${i}`,
            motionClass
          )}
        />
      ))}
    </div>
  );

  const renderMicroSpinner = () => (
    <div className={cn(
      'rounded-full border-2 border-current border-t-transparent',
      sizeClasses.spinner,
      colorClasses.spinner,
      'animate-spin',
      motionClass
    )} />
  );

  const renderProgressSpinner = () => {
    const circumference = 2 * Math.PI * 16; // radius of 16
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    return (
      <div className={cn('relative', sizeClasses.container)}>
        <svg 
          className={cn(sizeClasses.container, 'transform -rotate-90')}
          viewBox="0 0 40 40"
        >
          {/* Background circle */}
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="opacity-20"
          />
          
          {/* Progress circle */}
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              colorClasses.spinner,
              'transition-all duration-300 ease-out',
              !reducedMotion && 'animate-progress-circle'
            )}
          />
        </svg>
        
        {/* Progress percentage */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center',
          'text-xs font-medium',
          colorClasses.spinner
        )}>
          {Math.round(progress)}%
        </div>
      </div>
    );
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'secondary':
        return renderSecondarySpinner();
      case 'micro':
        return renderMicroSpinner();
      case 'progress':
        return renderProgressSpinner();
      default:
        return renderPrimarySpinner();
    }
  };

  return (
    <div 
      className={cn(
        positionClasses,
        'select-none',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading...'}
    >
      <div className={cn(
        'flex flex-col items-center',
        sizeClasses.gap,
        'animate-scale-in',
        motionClass
      )}>
        {renderSpinner()}
        
        {message && (
          <div className={cn(
            'text-center font-medium',
            sizeClasses.text,
            colorClasses.spinner,
            'animate-fade-in-up',
            motionClass
          )}>
            {message}
          </div>
        )}
      </div>
      
      {/* Screen reader only text */}
      <span className="sr-only">
        {message || 'Loading content, please wait...'}
      </span>
    </div>
  );
};

export default LoadingSpinner;