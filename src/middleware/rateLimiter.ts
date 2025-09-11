// Rate Limiting Middleware
// Protects API endpoints from abuse and DDoS attacks

type RateLimitStore = Record<string, {
    count: number;
    resetTime: number;
  }>;

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: any) => string;
  onLimitReached?: (key: string) => void;
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 15 * 60 * 1000, // 15 minutes default
      maxRequests: 100, // 100 requests default
      ...config
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  private generateKey(request: any): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }
    
    // Default key generation based on IP
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  public checkLimit(request: any): { allowed: boolean; limit: number; remaining: number; resetTime: number } {
    const key = this.generateKey(request);
    const now = Date.now();

    // Initialize or reset if window expired
    if (!this.store[key] || this.store[key].resetTime <= now) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    const entry = this.store[key];
    const allowed = entry.count < this.config.maxRequests;

    if (allowed) {
      entry.count++;
    } else {
      this.config.onLimitReached?.(key);
    }

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  public reset(request: any): void {
    const key = this.generateKey(request);
    delete this.store[key];
  }
}

// Pre-configured rate limiters for different use cases
export const createRateLimiter = (config: RateLimitConfig) => new RateLimiter(config);

// Strict rate limiter for authentication endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per window
  onLimitReached: (key) => {
    console.warn(`Rate limit exceeded for auth endpoint: ${key}`);
  }
});

// General API rate limiter
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per window
  skipSuccessfulRequests: false,
  onLimitReached: (key) => {
    console.warn(`API rate limit exceeded: ${key}`);
  }
});

// File upload rate limiter
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 50 uploads per hour
  onLimitReached: (key) => {
    console.warn(`Upload rate limit exceeded: ${key}`);
  }
});

// Search rate limiter (more permissive)
export const searchRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 60, // 60 searches per minute
  onLimitReached: (key) => {
    console.warn(`Search rate limit exceeded: ${key}`);
  }
});

// Express.js middleware wrapper
export const createExpressRateLimit = (limiter: RateLimiter) => {
  return (req: any, res: any, next: any) => {
    const result = limiter.checkLimit(req);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      });
    }

    next();
  };
};

// Client-side rate limiting for browser requests
export class ClientRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();

  constructor(private maxRequests = 60, private windowMs = 60000) {}

  public canMakeRequest(endpoint: string): boolean {
    const now = Date.now();
    const entry = this.store.get(endpoint);

    if (!entry || entry.resetTime <= now) {
      this.store.set(endpoint, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count < this.maxRequests) {
      entry.count++;
      return true;
    }

    return false;
  }

  public getRemainingRequests(endpoint: string): number {
    const entry = this.store.get(endpoint);
    if (!entry || entry.resetTime <= Date.now()) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  public getResetTime(endpoint: string): number {
    const entry = this.store.get(endpoint);
    return entry?.resetTime || Date.now();
  }
}

// Rate limiting hook for React components
export const useRateLimit = (endpoint: string, maxRequests = 60, windowMs = 60000) => {
  const limiter = new ClientRateLimiter(maxRequests, windowMs);
  
  return {
    canMakeRequest: () => limiter.canMakeRequest(endpoint),
    remainingRequests: limiter.getRemainingRequests(endpoint),
    resetTime: limiter.getResetTime(endpoint)
  };
};

// IP-based rate limiting utilities
export const IPRateLimiter = {
  // Track suspicious IPs
  suspiciousIPs: new Set<string>(),
  
  // Mark IP as suspicious
  markSuspicious: (ip: string) => {
    IPRateLimiter.suspiciousIPs.add(ip);
    console.warn(`IP marked as suspicious: ${ip}`);
  },

  // Check if IP is suspicious
  isSuspicious: (ip: string): boolean => {
    return IPRateLimiter.suspiciousIPs.has(ip);
  },

  // Stricter limits for suspicious IPs
  createStrictLimiter: () => createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // Very strict
    keyGenerator: (request) => request.ip || 'unknown',
    onLimitReached: (key) => {
      IPRateLimiter.markSuspicious(key);
    }
  })
};