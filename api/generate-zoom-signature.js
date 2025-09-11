// Zoom Video SDK Signature Generation - Secure Server Endpoint
// This replaces the client-side signature generation which exposes API keys

import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

// Rate limiting configuration
const signatureRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many signature requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation schema
const validateRequest = (body) => {
  const { sessionName, userIdentity, sessionKey, roleType } = body;
  
  const errors = [];
  
  if (!sessionName || typeof sessionName !== 'string' || sessionName.length < 1 || sessionName.length > 200) {
    errors.push('sessionName must be a string between 1-200 characters');
  }
  
  if (!userIdentity || typeof userIdentity !== 'string' || userIdentity.length < 1 || userIdentity.length > 100) {
    errors.push('userIdentity must be a string between 1-100 characters');
  }
  
  if (!sessionKey || typeof sessionKey !== 'string' || sessionKey.length < 1 || sessionKey.length > 100) {
    errors.push('sessionKey must be a string between 1-100 characters');
  }
  
  if (roleType && !['host', 'participant'].includes(roleType)) {
    errors.push('roleType must be either "host" or "participant"');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Security headers
const setSecurityHeaders = (res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'none';");
};

// CORS configuration
const setCORSHeaders = (req, res) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://gradapp.com',
    'https://www.gradapp.com',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
};

// Main handler function
export default async function handler(req, res) {
  // Set security headers
  setSecurityHeaders(res);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    setCORSHeaders(req, res);
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      allowedMethods: ['POST']
    });
  }
  
  // Set CORS headers for POST request
  setCORSHeaders(req, res);
  
  // Apply rate limiting (if using Express-like framework)
  if (signatureRateLimit) {
    try {
      await new Promise((resolve, reject) => {
        signatureRateLimit(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (err) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  }
  
  try {
    // Validate environment variables
    const zoomApiKey = process.env.ZOOM_VIDEO_SDK_KEY;
    const zoomApiSecret = process.env.ZOOM_VIDEO_SDK_SECRET;
    
    if (!zoomApiKey || !zoomApiSecret) {
      console.error('Missing Zoom Video SDK credentials');
      return res.status(500).json({
        error: 'Server configuration error',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // Validate request body
    const validation = validateRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        code: 'VALIDATION_ERROR',
        details: validation.errors
      });
    }
    
    const { sessionName, userIdentity, sessionKey, roleType = 'participant' } = req.body;
    
    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create JWT payload
    const payload = {
      iss: zoomApiKey,
      exp: timestamp + 3600, // Token expires in 1 hour
      iat: timestamp,
      aud: 'zoom',
      appKey: zoomApiKey,
      tokenExp: timestamp + 3600,
      alg: 'HS256',
      // Zoom Video SDK specific claims
      sessionName: sessionName,
      userIdentity: userIdentity,
      sessionKey: sessionKey,
      roleType: roleType,
      // Additional security claims
      sub: userIdentity,
      jti: `${sessionKey}-${userIdentity}-${timestamp}` // Unique token identifier
    };
    
    // Generate JWT signature
    const signature = jwt.sign(payload, zoomApiSecret, {
      algorithm: 'HS256',
      header: {
        typ: 'JWT',
        alg: 'HS256'
      }
    });
    
    // Log successful signature generation (without exposing sensitive data)
    console.log(`✅ Zoom signature generated for session: ${sessionName}, user: ${userIdentity.substring(0, 5)}...`);
    
    // Return the signature
    return res.status(200).json({
      success: true,
      signature,
      expiresIn: 3600,
      timestamp: timestamp,
      sessionInfo: {
        sessionName,
        userIdentity,
        roleType
      }
    });
    
  } catch (error) {
    console.error('❌ Zoom signature generation failed:', error);
    
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return res.status(500).json({
      error: 'Internal server error',
      code: 'SIGNATURE_GENERATION_FAILED',
      ...(isDevelopment && { details: error.message })
    });
  }
}

// Alternative implementation for Next.js API routes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

// Alternative implementation for Vercel Serverless Functions
export async function POST(request) {
  const body = await request.json();
  
  // Create a mock Express-like req/res object
  const req = { 
    method: 'POST', 
    body,
    headers: Object.fromEntries(request.headers.entries())
  };
  
  const res = {
    status: (code) => ({
      json: (data) => new Response(JSON.stringify(data), {
        status: code,
        headers: { 'Content-Type': 'application/json' }
      }),
      end: () => new Response(null, { status: code })
    }),
    setHeader: () => {}, // Mock setHeader for compatibility
    json: (data) => new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  };
  
  return handler(req, res);
}

// Alternative implementation for AWS Lambda
export const lambdaHandler = async (event, context) => {
  const req = {
    method: event.httpMethod,
    body: JSON.parse(event.body || '{}'),
    headers: event.headers
  };
  
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = JSON.stringify(data);
      this.headers['Content-Type'] = 'application/json';
      return this;
    },
    setHeader: function(name, value) {
      this.headers[name] = value;
    }
  };
  
  await handler(req, res);
  
  return {
    statusCode: res.statusCode,
    headers: res.headers,
    body: res.body
  };
};