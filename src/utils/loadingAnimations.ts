/**
 * CSS animation definitions for loading spinners
 * Optimized for performance using transforms and GPU acceleration
 */

export const loadingAnimations = {
  // Smooth rotation with easing
  spin: 'animate-spin',
  
  // Pulsing animation for dots
  pulse: 'animate-pulse',
  
  // Bouncing dots with staggered timing
  bounce: 'animate-bounce',
  
  // Custom animations defined in CSS
  spinElegant: 'animate-spin-elegant',
  pulseSmooth: 'animate-pulse-smooth',
  floatUp: 'animate-float-up',
  scaleIn: 'animate-scale-in',
  fadeInUp: 'animate-fade-in-up'
} as const;

export const customAnimationClasses = `
  /* Elegant spinning with smooth easing */
  @keyframes spin-elegant {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .animate-spin-elegant {
    animation: spin-elegant 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  /* Smooth pulsing */
  @keyframes pulse-smooth {
    0%, 100% { 
      opacity: 1;
      transform: scale(1);
    }
    50% { 
      opacity: 0.7;
      transform: scale(1.05);
    }
  }
  
  .animate-pulse-smooth {
    animation: pulse-smooth 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  /* Floating upward motion */
  @keyframes float-up {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
  }
  
  .animate-float-up {
    animation: float-up 2s ease-in-out infinite;
  }
  
  /* Scale in animation */
  @keyframes scale-in {
    0% { 
      opacity: 0;
      transform: scale(0.8);
    }
    100% { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-scale-in {
    animation: scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  /* Fade in upward */
  @keyframes fade-in-up {
    0% { 
      opacity: 0;
      transform: translateY(8px);
    }
    100% { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  
  /* Staggered dot animations */
  .animate-dot-1 {
    animation: pulse-smooth 1.4s ease-in-out infinite;
    animation-delay: 0s;
  }
  
  .animate-dot-2 {
    animation: pulse-smooth 1.4s ease-in-out infinite;
    animation-delay: 0.2s;
  }
  
  .animate-dot-3 {
    animation: pulse-smooth 1.4s ease-in-out infinite;
    animation-delay: 0.4s;
  }
  
  /* Progress circle animation */
  @keyframes progress-circle {
    0% { stroke-dasharray: 0 100; }
  }
  
  .animate-progress-circle {
    animation: progress-circle 1.5s ease-out;
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .animate-spin-elegant,
    .animate-pulse-smooth,
    .animate-float-up,
    .animate-scale-in,
    .animate-fade-in-up,
    .animate-dot-1,
    .animate-dot-2,
    .animate-dot-3 {
      animation: none;
    }
    
    /* Provide minimal feedback for reduced motion */
    .motion-reduce-fallback {
      opacity: 0.8;
      transition: opacity 0.2s ease;
    }
  }
`;

export type LoadingAnimation = keyof typeof loadingAnimations;