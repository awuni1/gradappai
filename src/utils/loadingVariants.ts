/**
 * Loading spinner variants and styling configurations
 * Provides consistent sizing, colors, and animations across the platform
 */

export const loadingSizes = {
  xs: {
    spinner: 'w-3 h-3',
    container: 'w-4 h-4',
    text: 'text-xs',
    dots: 'w-1 h-1',
    gap: 'gap-1'
  },
  sm: {
    spinner: 'w-4 h-4',
    container: 'w-6 h-6',
    text: 'text-sm',
    dots: 'w-1.5 h-1.5',
    gap: 'gap-1.5'
  },
  md: {
    spinner: 'w-6 h-6',
    container: 'w-8 h-8',
    text: 'text-base',
    dots: 'w-2 h-2',
    gap: 'gap-2'
  },
  lg: {
    spinner: 'w-8 h-8',
    container: 'w-12 h-12',
    text: 'text-lg',
    dots: 'w-2.5 h-2.5',
    gap: 'gap-2.5'
  },
  xl: {
    spinner: 'w-12 h-12',
    container: 'w-16 h-16',
    text: 'text-xl',
    dots: 'w-3 h-3',
    gap: 'gap-3'
  }
} as const;

export const loadingColors = {
  primary: {
    spinner: 'text-gradapp-primary',
    border: 'border-gradapp-primary',
    bg: 'bg-gradapp-primary',
    gradient: 'from-gradapp-primary to-gradapp-secondary',
    dots: 'bg-gradapp-primary',
    accent: 'text-gradapp-accent'
  },
  secondary: {
    spinner: 'text-gradapp-secondary',
    border: 'border-gradapp-secondary',
    bg: 'bg-gradapp-secondary',
    gradient: 'from-gradapp-secondary to-gradapp-accent',
    dots: 'bg-gradapp-secondary',
    accent: 'text-gradapp-primary'
  },
  success: {
    spinner: 'text-green-600',
    border: 'border-green-600',
    bg: 'bg-green-600',
    gradient: 'from-green-500 to-emerald-500',
    dots: 'bg-green-600',
    accent: 'text-green-500'
  },
  warning: {
    spinner: 'text-yellow-600',
    border: 'border-yellow-600',
    bg: 'bg-yellow-600',
    gradient: 'from-yellow-500 to-orange-500',
    dots: 'bg-yellow-600',
    accent: 'text-yellow-500'
  },
  error: {
    spinner: 'text-red-600',
    border: 'border-red-600',
    bg: 'bg-red-600',
    gradient: 'from-red-500 to-pink-500',
    dots: 'bg-red-600',
    accent: 'text-red-500'
  },
  neutral: {
    spinner: 'text-gray-600',
    border: 'border-gray-600',
    bg: 'bg-gray-600',
    gradient: 'from-gray-500 to-slate-500',
    dots: 'bg-gray-600',
    accent: 'text-gray-500'
  }
} as const;

export const loadingPositions = {
  center: 'flex items-center justify-center',
  inline: 'inline-flex items-center',
  absolute: 'absolute inset-0 flex items-center justify-center',
  'top-center': 'flex items-start justify-center pt-8',
  'bottom-center': 'flex items-end justify-center pb-8'
} as const;

export const loadingOverlayStyles = {
  backdrop: 'fixed inset-0 bg-black/20 backdrop-blur-sm z-50',
  container: 'bg-white/90 backdrop-blur-md',
  card: 'bg-white rounded-lg shadow-lg p-6 mx-4',
  transparent: 'bg-transparent'
} as const;

export type LoadingSize = keyof typeof loadingSizes;
export type LoadingColor = keyof typeof loadingColors;
export type LoadingPosition = keyof typeof loadingPositions;
export type LoadingOverlayStyle = keyof typeof loadingOverlayStyles;