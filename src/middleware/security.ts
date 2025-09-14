// // Security Middleware
// // Comprehensive security features for API protection

// import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// // CORS Configuration
// export interface CORSOptions {
//   origin: string | string[] | boolean;
//   methods?: string[];
//   allowedHeaders?: string[];
//   exposedHeaders?: string[];
//   credentials?: boolean;
//   maxAge?: number;
//   preflightContinue?: boolean;
//   optionsSuccessStatus?: number;
// }

// export const createCORSMiddleware = (options: CORSOptions) => {
//   return (req: any, res: any, next: any) => {
//     const origin = req.headers.origin;
    
//     // Set CORS headers based on configuration
//     if (typeof options.origin === 'boolean') {
//       res.setHeader('Access-Control-Allow-Origin', options.origin ? '*' : 'null');
//     } else if (typeof options.origin === 'string') {
//       res.setHeader('Access-Control-Allow-Origin', options.origin);
//     } else if (Array.isArray(options.origin)) {
//       const allowedOrigin = options.origin.includes(origin) ? origin : options.origin[0];
//       res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
//     }

//     if (options.methods) {
//       res.setHeader('Access-Control-Allow-Methods', options.methods.join(', '));
//     }

//     if (options.allowedHeaders) {
//       res.setHeader('Access-Control-Allow-Headers', options.allowedHeaders.join(', '));
//     }

//     if (options.exposedHeaders) {
//       res.setHeader('Access-Control-Expose-Headers', options.exposedHeaders.join(', '));
//     }

//     if (options.credentials) {
//       res.setHeader('Access-Control-Allow-Credentials', 'true');
//     }

//     if (options.maxAge) {
//       res.setHeader('Access-Control-Max-Age', options.maxAge.toString());
//     }

//     // Handle preflight requests
//     if (req.method === 'OPTIONS') {
//       res.status(options.optionsSuccessStatus || 204).end();
//       return;
//     }

//     next();
//   };
// };

// // Default CORS configuration for development
// export const developmentCORS = createCORSMiddleware({
//   origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//   credentials: true
// });

// // Production CORS configuration
// export const productionCORS = createCORSMiddleware({
//   origin: [
//     'https://gradapp-ascend.com',
//     'https://www.gradapp-ascend.com',
//     'https://gradapp-ascend-platform.vercel.app'
//   ],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
//   maxAge: 86400 // 24 hours
// });

// // Security Headers Middleware
// export const securityHeaders = (req: any, res: any, next: any) => {
//   // Prevent XSS attacks
//   res.setHeader('X-XSS-Protection', '1; mode=block');
  
//   // Prevent clickjacking
//   res.setHeader('X-Frame-Options', 'DENY');
  
//   // Prevent MIME type sniffing
//   res.setHeader('X-Content-Type-Options', 'nosniff');
  
//   // Enforce HTTPS
//   res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
//   // Content Security Policy
//   res.setHeader('Content-Security-Policy', 
//     "default-src 'self'; " +
//     "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com; " +
//     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
//     "font-src 'self' https://fonts.gstatic.com; " +
//     "img-src 'self' data: https: http:; " +
//     "connect-src 'self' https://api.supabase.io wss://realtime.supabase.io; " +
//     "frame-src 'self' https://www.youtube.com;"
//   );
  
//   // Referrer Policy
//   res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
//   // Remove server signature
//   res.removeHeader('X-Powered-By');
  
//   next();
// };

// // Request validation middleware
// export const validateRequest = (schema: any) => {
//   return (req: any, res: any, next: any) => {
//     const { error } = schema.validate(req.body);
    
//     if (error) {
//       return res.status(400).json({
//         error: 'Validation Error',
//         message: error.details[0].message,
//         field: error.details[0].path.join('.')
//       });
//     }
    
//     next();
//   };
// };

// // Input sanitization
// export const sanitizeInput = (input: any): any => {
//   if (typeof input === 'string') {
//     // Remove potential XSS vectors
//     return input
//       .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
//       .replace(/javascript:/gi, '')
//       .replace(/on\w+\s*=/gi, '')
//       .trim();
//   }
  
//   if (Array.isArray(input)) {
//     return input.map(sanitizeInput);
//   }
  
//   if (typeof input === 'object' && input !== null) {
//     const sanitized: any = {};
//     Object.keys(input).forEach(key => {
//       sanitized[key] = sanitizeInput(input[key]);
//     });
//     return sanitized;
//   }
  
//   return input;
// };

// // SQL injection prevention
// export const preventSQLInjection = (query: string): boolean => {
//   const suspiciousPatterns = [
//     /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
//     /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
//     /(;|\||&&)/gi,
//     /(--|\/\*|\*\/)/gi
//   ];
  
//   return !suspiciousPatterns.some(pattern => pattern.test(query));
// };

// // CSRF Protection
// export class CSRFProtection {
//   private static tokens = new Map<string, { token: string; expires: number }>();
  
//   public static generateToken(sessionId: string): string {
//     const token = randomBytes(32).toString('hex');
//     const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
//     CSRFProtection.tokens.set(sessionId, { token, expires });
    
//     // Cleanup expired tokens
//     CSRFProtection.cleanup();
    
//     return token;
//   }
  
//   public static validateToken(sessionId: string, token: string): boolean {
//     const stored = CSRFProtection.tokens.get(sessionId);
    
//     if (!stored || stored.expires < Date.now()) {
//       CSRFProtection.tokens.delete(sessionId);
//       return false;
//     }
    
//     // Use timing-safe comparison to prevent timing attacks
//     const storedBuffer = Buffer.from(stored.token, 'hex');
//     const providedBuffer = Buffer.from(token, 'hex');
    
//     return storedBuffer.length === providedBuffer.length && 
//            timingSafeEqual(storedBuffer, providedBuffer);
//   }
  
//   private static cleanup(): void {
//     const now = Date.now();
//     CSRFProtection.tokens.forEach((value, key) => {
//       if (value.expires < now) {
//         CSRFProtection.tokens.delete(key);
//       }
//     });
//   }
  
//   public static middleware() {
//     return (req: any, res: any, next: any) => {
//       if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
//         return next();
//       }
      
//       const sessionId = req.sessionId || req.headers['x-session-id'];
//       const token = req.headers['x-csrf-token'] || req.body._csrf;
      
//       if (!sessionId || !token || !CSRFProtection.validateToken(sessionId, token)) {
//         return res.status(403).json({
//           error: 'CSRF Token Invalid',
//           message: 'Invalid or missing CSRF token'
//         });
//       }
      
//       next();
//     };
//   }
// }

// // Request logging for security monitoring
// export const securityLogger = (req: any, res: any, next: any) => {
//   const start = Date.now();
//   const ip = req.ip || req.connection?.remoteAddress;
//   const userAgent = req.headers['user-agent'];
  
//   res.on('finish', () => {
//     const duration = Date.now() - start;
//     const logEntry = {
//       timestamp: new Date().toISOString(),
//       method: req.method,
//       url: req.originalUrl || req.url,
//       statusCode: res.statusCode,
//       ip,
//       userAgent,
//       duration: `${duration}ms`,
//       contentLength: res.get('content-length') || 0
//     };
    
//     // Log suspicious activities
//     if (res.statusCode >= 400 || duration > 5000) {
//       console.warn('Suspicious request:', logEntry);
//     }
    
//     // In production, send to monitoring service
//     if (process.env.NODE_ENV === 'production') {
//       // sendToMonitoringService(logEntry);
//     }
//   });
  
//   next();
// };

// // API Key validation
// export const validateAPIKey = (validKeys: string[]) => {
//   return (req: any, res: any, next: any) => {
//     const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
//     if (!apiKey || !validKeys.includes(apiKey)) {
//       return res.status(401).json({
//         error: 'Invalid API Key',
//         message: 'A valid API key is required to access this endpoint'
//       });
//     }
    
//     next();
//   };
// };

// // Webhook signature validation
// export const validateWebhookSignature = (secret: string, headerName = 'x-webhook-signature') => {
//   return (req: any, res: any, next: any) => {
//     const signature = req.headers[headerName.toLowerCase()];
//     const payload = JSON.stringify(req.body);
    
//     if (!signature) {
//       return res.status(401).json({
//         error: 'Missing Signature',
//         message: 'Webhook signature is required'
//       });
//     }
    
//     const expectedSignature = createHmac('sha256', secret)
//       .update(payload, 'utf8')
//       .digest('hex');
    
//     const providedSignature = signature.replace(/^sha256=/, '');
    
//     if (!timingSafeEqual(
//       Buffer.from(expectedSignature, 'hex'),
//       Buffer.from(providedSignature, 'hex')
//     )) {
//       return res.status(401).json({
//         error: 'Invalid Signature',
//         message: 'Webhook signature validation failed'
//       });
//     }
    
//     next();
//   };
// };

// // Environment-specific security configuration
// export const getSecurityConfig = () => {
//   const isDevelopment = process.env.NODE_ENV === 'development';
  
//   return {
//     cors: isDevelopment ? developmentCORS : productionCORS,
//     strictMode: !isDevelopment,
//     logLevel: isDevelopment ? 'debug' : 'warn',
//     enableCSRF: !isDevelopment,
//     requireHTTPS: !isDevelopment
//   };
// };



// Security Middleware
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// CORS Configuration
export interface CORSOptions {
  origin: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

export const createCORSMiddleware = (options: CORSOptions) => {
  return (req: any, res: any, next: any) => {
    const origin = req.headers.origin;

    if (typeof options.origin === 'boolean') {
      res.setHeader('Access-Control-Allow-Origin', options.origin ? '*' : 'null');
    } else if (typeof options.origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', options.origin);
    } else if (Array.isArray(options.origin)) {
      const allowedOrigin = options.origin.includes(origin) ? origin : options.origin[0];
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    }

    if (options.methods) res.setHeader('Access-Control-Allow-Methods', options.methods.join(', '));
    if (options.allowedHeaders) res.setHeader('Access-Control-Allow-Headers', options.allowedHeaders.join(', '));
    if (options.exposedHeaders) res.setHeader('Access-Control-Expose-Headers', options.exposedHeaders.join(', '));
    if (options.credentials) res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (options.maxAge) res.setHeader('Access-Control-Max-Age', options.maxAge.toString());

    if (req.method === 'OPTIONS') {
      res.status(options.optionsSuccessStatus || 204).end();
      return;
    }

    next();
  };
};

// Development CORS
export const developmentCORS = createCORSMiddleware({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
});

// Production CORS — include your actual frontend
export const productionCORS = createCORSMiddleware({
  origin: [
    'https://www.gradappai.com',
    'https://gradapp-ascend.com',
    'https://www.gradapp-ascend.com',
    'https://gradapp-ascend-platform.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
});

// CSRF Protection — exclude OAuth callback
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();

  public static generateToken(sessionId: string): string {
    const token = randomBytes(32).toString('hex');
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    CSRFProtection.tokens.set(sessionId, { token, expires });
    CSRFProtection.cleanup();
    return token;
  }

  public static validateToken(sessionId: string, token: string): boolean {
    const stored = CSRFProtection.tokens.get(sessionId);
    if (!stored || stored.expires < Date.now()) {
      CSRFProtection.tokens.delete(sessionId);
      return false;
    }
    return timingSafeEqual(Buffer.from(stored.token, 'hex'), Buffer.from(token, 'hex'));
  }

  private static cleanup(): void {
    const now = Date.now();
    CSRFProtection.tokens.forEach((value, key) => {
      if (value.expires < now) CSRFProtection.tokens.delete(key);
    });
  }

  public static middleware() {
    return (req: any, res: any, next: any) => {
      // Exclude GET/HEAD/OPTIONS and Supabase OAuth callback
      if (
        req.method === 'GET' ||
        req.method === 'HEAD' ||
        req.method === 'OPTIONS' ||
        req.path.startsWith('/auth/callback')
      ) {
        return next();
      }

      const sessionId = req.sessionId || req.headers['x-session-id'];
      const token = req.headers['x-csrf-token'] || req.body._csrf;

      if (!sessionId || !token || !CSRFProtection.validateToken(sessionId, token)) {
        return res.status(403).json({
          error: 'CSRF Token Invalid',
          message: 'Invalid or missing CSRF token',
        });
      }

      next();
    };
  }
}

// Environment config
export const getSecurityConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return {
    cors: isDevelopment ? developmentCORS : productionCORS,
    strictMode: !isDevelopment,
    logLevel: isDevelopment ? 'debug' : 'warn',
    enableCSRF: !isDevelopment,
    requireHTTPS: !isDevelopment,
  };
};
