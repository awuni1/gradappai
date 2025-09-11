// Security utilities for enhanced authentication security

export interface PasswordStrengthResult {
  score: number;
  feedback: string[];
  entropy: number;
  isStrong: boolean;
}

export interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

// Enhanced password strength checker with entropy calculation
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;
  
  // Length checks
  if (password.length >= 12) {
    score += 30;
  } else if (password.length >= 8) {
    score += 20;
    feedback.push('Use 12+ characters for better security');
  } else {
    feedback.push('Password must be at least 8 characters');
  }
  
  // Character variety
  if (/[a-z]/.test(password)) {score += 10;}
  else {feedback.push('Include lowercase letters');}
  
  if (/[A-Z]/.test(password)) {score += 10;}
  else {feedback.push('Include uppercase letters');}
  
  if (/\d/.test(password)) {score += 10;}
  else {feedback.push('Include numbers');}
  
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {score += 15;}
  else {feedback.push('Include special characters');}
  
  // Pattern checks
  if (!/(.)\1{2,}/.test(password)) {score += 10;}
  else {feedback.push('Avoid repeating characters');}
  
  if (!/123|abc|qwe|password|admin/i.test(password)) {score += 10;}
  else {feedback.push('Avoid common patterns');}
  
  // Calculate entropy
  const entropy = calculatePasswordEntropy(password);
  if (entropy >= 60) {score += 15;}
  else if (entropy >= 40) {score += 10;}
  else {feedback.push('Increase password randomness');}
  
  const isStrong = score >= 85 && entropy >= 50;
  
  return {
    score: Math.min(score, 100),
    feedback,
    entropy,
    isStrong
  };
}

// Calculate password entropy
function calculatePasswordEntropy(password: string): number {
  const charSets = [
    /[a-z]/.test(password) ? 26 : 0, // lowercase
    /[A-Z]/.test(password) ? 26 : 0, // uppercase  
    /\d/.test(password) ? 10 : 0, // digits
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? 32 : 0 // symbols
  ];
  
  const charset = charSets.reduce((sum, set) => sum + set, 0);
  return charset > 0 ? password.length * Math.log2(charset) : 0;
}

// Rate limiting for authentication attempts
const rateLimitStore = new Map<string, RateLimitState>();

export function checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const key = `auth_${identifier}`;
  const state = rateLimitStore.get(key) || { attempts: 0, lastAttempt: 0 };
  
  // Check if still blocked
  if (state.blockedUntil && now < state.blockedUntil) {
    return false;
  }
  
  // Reset if window expired
  if (now - state.lastAttempt > windowMs) {
    state.attempts = 0;
  }
  
  // Check if exceeded attempts
  if (state.attempts >= maxAttempts) {
    state.blockedUntil = now + windowMs;
    rateLimitStore.set(key, state);
    return false;
  }
  
  return true;
}

export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const key = `auth_${identifier}`;
  const state = rateLimitStore.get(key) || { attempts: 0, lastAttempt: 0 };
  
  state.attempts += 1;
  state.lastAttempt = now;
  rateLimitStore.set(key, state);
}

export function resetRateLimit(identifier: string): void {
  const key = `auth_${identifier}`;
  rateLimitStore.delete(key);
}

export function getRateLimitStatus(identifier: string): { blocked: boolean; attemptsLeft: number; resetTime?: number } {
  const now = Date.now();
  const key = `auth_${identifier}`;
  const state = rateLimitStore.get(key);
  
  if (!state) {
    return { blocked: false, attemptsLeft: 5 };
  }
  
  if (state.blockedUntil && now < state.blockedUntil) {
    return { 
      blocked: true, 
      attemptsLeft: 0, 
      resetTime: state.blockedUntil 
    };
  }
  
  return { 
    blocked: false, 
    attemptsLeft: Math.max(0, 5 - state.attempts) 
  };
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/data:/gi, ''); // Remove data protocol
}

// Email validation with enhanced checks
export function validateEmail(email: string): { isValid: boolean; reason?: string } {
  const sanitized = sanitizeInput(email.toLowerCase());
  
  // Basic format check
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, reason: 'Invalid email format' };
  }
  
  // Check for suspicious patterns
  if (sanitized.includes('..') || sanitized.startsWith('.') || sanitized.endsWith('.')) {
    return { isValid: false, reason: 'Invalid email format' };
  }
  
  // Disposable email check (basic)
  const disposableDomains = ['10minutemail.com', 'guerrillamail.com', 'tempmail.org'];
  const domain = sanitized.split('@')[1];
  if (disposableDomains.includes(domain)) {
    return { isValid: false, reason: 'Disposable email addresses are not allowed' };
  }
  
  return { isValid: true };
}

// Generate CSRF token
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Session timeout management
export class SessionManager {
  private static readonly TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly WARNING_MS = 5 * 60 * 1000; // 5 minutes before timeout
  
  private timeoutId?: number;
  private warningId?: number;
  private onTimeout?: () => void;
  private onWarning?: () => void;
  
  constructor(onTimeout?: () => void, onWarning?: () => void) {
    this.onTimeout = onTimeout;
    this.onWarning = onWarning;
    this.resetTimer();
    this.setupActivityListeners();
  }
  
  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, () => this.resetTimer(), { passive: true });
    });
  }
  
  private resetTimer(): void {
    this.clearTimers();
    
    // Set warning timer
    this.warningId = window.setTimeout(() => {
      this.onWarning?.();
    }, SessionManager.TIMEOUT_MS - SessionManager.WARNING_MS);
    
    // Set timeout timer
    this.timeoutId = window.setTimeout(() => {
      this.onTimeout?.();
    }, SessionManager.TIMEOUT_MS);
  }
  
  private clearTimers(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
      this.warningId = undefined;
    }
  }
  
  destroy(): void {
    this.clearTimers();
  }
}

// Content Security Policy helper
export function getCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.supabase.co wss://api.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
}