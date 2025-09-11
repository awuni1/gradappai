import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Comprehensive security service for the mentor platform
 */

// Input validation schemas
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  type?: 'string' | 'number' | 'email' | 'url' | 'date' | 'uuid';
  custom?: (value: any) => boolean | string;
}

export type ValidationSchema = Record<string, ValidationRule>;

export interface ValidationError {
  field: string;
  message: string;
}

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
  created_at: string;
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (userId: string, action: string) => string;
}

class SecurityService {
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private suspiciousActivities = new Map<string, number>();
  private blockedIPs = new Set<string>();
  private securityConfig = {
    maxLoginAttempts: 5,
    loginLockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
    passwordMinLength: 8,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ]
  };

  /**
   * Input validation and sanitization
   */
  validateInput(data: Record<string, any>, schema: ValidationSchema): {
    isValid: boolean;
    errors: ValidationError[];
    sanitizedData: Record<string, any>;
  } {
    const errors: ValidationError[] = [];
    const sanitizedData: Record<string, any> = {};

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      // Skip validation for optional empty fields
      if (!rule.required && (value === undefined || value === null || value === '')) {
        sanitizedData[field] = value;
        continue;
      }

      // Type validation
      if (rule.type) {
        const typeError = this.validateType(field, value, rule.type);
        if (typeError) {
          errors.push(typeError);
          continue;
        }
      }

      // Length validation
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push({ field, message: `${field} must be at least ${rule.minLength} characters` });
          continue;
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({ field, message: `${field} must not exceed ${rule.maxLength} characters` });
          continue;
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push({ field, message: `${field} format is invalid` });
        continue;
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          const message = typeof customResult === 'string' ? customResult : `${field} validation failed`;
          errors.push({ field, message });
          continue;
        }
      }

      // Sanitize the value
      sanitizedData[field] = this.sanitizeValue(value, rule.type);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }

  /**
   * Type validation helper
   */
  private validateType(field: string, value: any, type: string): ValidationError | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return { field, message: `${field} must be a string` };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { field, message: `${field} must be a valid number` };
        }
        break;

      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== 'string' || !emailRegex.test(value)) {
          return { field, message: `${field} must be a valid email address` };
        }
        break;
      }

      case 'url':
        try {
          new URL(value);
        } catch {
          return { field, message: `${field} must be a valid URL` };
        }
        break;

      case 'date':
        if (isNaN(Date.parse(value))) {
          return { field, message: `${field} must be a valid date` };
        }
        break;

      case 'uuid': {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof value !== 'string' || !uuidRegex.test(value)) {
          return { field, message: `${field} must be a valid UUID` };
        }
        break;
      }
    }

    return null;
  }

  /**
   * Sanitize input values
   */
  private sanitizeValue(value: any, type?: string): any {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      let sanitized = value
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript protocols
        .replace(/data:/gi, '') // Remove data URLs
        .trim();

      // Additional sanitization based on type
      if (type === 'email') {
        sanitized = sanitized.toLowerCase();
      }

      return sanitized;
    }

    return value;
  }

  /**
   * Rate limiting implementation
   */
  checkRateLimit(
    userId: string,
    action: string,
    config: RateLimitConfig
  ): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
    const key = config.keyGenerator ? config.keyGenerator(userId, action) : `${userId}:${action}`;
    const now = Date.now();
    
    const record = this.rateLimitStore.get(key);

    // Initialize or reset if window expired
    if (!record || now >= record.resetTime) {
      const newRecord = {
        count: 1,
        resetTime: now + config.windowMs
      };
      this.rateLimitStore.set(key, newRecord);
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newRecord.resetTime
      };
    }

    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      // Log suspicious activity
      this.logSuspiciousActivity(userId, action, 'rate_limit_exceeded');
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter
      };
    }

    // Increment counter
    record.count++;
    this.rateLimitStore.set(key, record);

    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  /**
   * Audit logging
   */
  async logAuditEvent(auditData: Omit<AuditLogEntry, 'created_at'>): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        ...auditData,
        created_at: new Date().toISOString()
      };

      // Store in database
      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to log audit event:', error);
        // Fallback to localStorage for critical events
        this.logToLocalStorage('audit_fallback', auditEntry);
      }

      // Additional logging for high-risk events
      if (auditEntry.risk_level === 'high' || auditEntry.risk_level === 'critical') {
        this.alertSecurityTeam(auditEntry);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      this.logToLocalStorage('audit_error', { error: error.message, auditData });
    }
  }

  /**
   * File upload security validation
   */
  validateFileUpload(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.securityConfig.maxFileSize) {
      return {
        isValid: false,
        error: `File size must be less than ${this.securityConfig.maxFileSize / 1024 / 1024}MB`
      };
    }

    // Check file type
    if (!this.securityConfig.allowedFileTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not allowed. Please upload PDF, Word, or image files.'
      };
    }

    // Check file name for suspicious patterns
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.scr$/i,
      /\.bat$/i,
      /\.com$/i,
      /\.pif$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      return {
        isValid: false,
        error: 'File name contains suspicious patterns'
      };
    }

    return { isValid: true };
  }

  /**
   * Session security validation
   */
  async validateSession(userId: string): Promise<{ isValid: boolean; action?: string }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return { isValid: false, action: 'redirect_to_login' };
      }

      // Check session expiry
      const sessionAge = Date.now() - new Date(session.created_at).getTime();
      if (sessionAge > this.securityConfig.sessionTimeout) {
        await supabase.auth.signOut();
        return { isValid: false, action: 'session_expired' };
      }

      // Check for suspicious activity
      if (this.suspiciousActivities.has(userId)) {
        const suspiciousCount = this.suspiciousActivities.get(userId)!;
        if (suspiciousCount > 5) {
          await this.logAuditEvent({
            user_id: userId,
            action: 'session_terminated_suspicious',
            resource_type: 'session',
            risk_level: 'high',
            metadata: { suspicious_count: suspiciousCount }
          });

          await supabase.auth.signOut();
          return { isValid: false, action: 'account_locked' };
        }
      }

      return { isValid: true };
    } catch (error) {
      console.error('Session validation error:', error);
      return { isValid: false, action: 'validation_error' };
    }
  }

  /**
   * Access control verification
   */
  async verifyAccess(
    userId: string,
    resource: string,
    action: string,
    resourceId?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Check if user has required role
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role, permissions')
        .eq('user_id', userId)
        .single();

      if (roleError || !userRole) {
        await this.logAuditEvent({
          user_id: userId,
          action: 'access_denied_no_role',
          resource_type: resource,
          resource_id: resourceId,
          risk_level: 'medium'
        });

        return { allowed: false, reason: 'No valid role found' };
      }

      // Check role-based permissions
      const hasPermission = await this.checkRolePermission(userRole.role, resource, action);
      if (!hasPermission) {
        await this.logAuditEvent({
          user_id: userId,
          action: 'access_denied_insufficient_permissions',
          resource_type: resource,
          resource_id: resourceId,
          risk_level: 'medium',
          metadata: { user_role: userRole.role, required_action: action }
        });

        return { allowed: false, reason: 'Insufficient permissions' };
      }

      // Check resource-specific access (e.g., mentor can only access their own sessions)
      if (resourceId) {
        const hasResourceAccess = await this.checkResourceAccess(userId, resource, resourceId);
        if (!hasResourceAccess) {
          await this.logAuditEvent({
            user_id: userId,
            action: 'access_denied_resource_ownership',
            resource_type: resource,
            resource_id: resourceId,
            risk_level: 'high'
          });

          return { allowed: false, reason: 'Resource access denied' };
        }
      }

      // Log successful access
      await this.logAuditEvent({
        user_id: userId,
        action: `access_granted_${action}`,
        resource_type: resource,
        resource_id: resourceId,
        risk_level: 'low'
      });

      return { allowed: true };
    } catch (error) {
      console.error('Access verification error:', error);
      return { allowed: false, reason: 'Verification error' };
    }
  }

  /**
   * Check role-based permissions
   */
  private async checkRolePermission(role: string, resource: string, action: string): Promise<boolean> {
    // Define permission matrix
    const permissions: Record<string, Record<string, string[]>> = {
      mentor: {
        mentorship: ['read', 'update'],
        session: ['create', 'read', 'update', 'delete'],
        document: ['create', 'read', 'update', 'delete'],
        review: ['create', 'read', 'update'],
        analytics: ['read']
      },
      student: {
        mentorship: ['read'],
        session: ['read', 'update'],
        document: ['read'],
        review: ['create', 'read'],
        analytics: ['read']
      },
      admin: {
        '*': ['*'] // Admin has all permissions
      }
    };

    const rolePermissions = permissions[role];
    if (!rolePermissions) {return false;}

    // Check wildcard permissions (admin)
    if (rolePermissions['*'] && rolePermissions['*'].includes('*')) {
      return true;
    }

    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions) {return false;}

    return resourcePermissions.includes(action) || resourcePermissions.includes('*');
  }

  /**
   * Check resource-specific access
   */
  private async checkResourceAccess(userId: string, resource: string, resourceId: string): Promise<boolean> {
    try {
      switch (resource) {
        case 'session': {
          const { data: session } = await supabase
            .from('mentor_sessions')
            .select('mentor_id, mentee_id')
            .eq('id', resourceId)
            .single();
          
          return session && (session.mentor_id === userId || session.mentee_id === userId);
        }

        case 'mentorship': {
          const { data: mentorship } = await supabase
            .from('mentorship_relationships')
            .select('mentor_id, mentee_id')
            .eq('id', resourceId)
            .single();
          
          return mentorship && (mentorship.mentor_id === userId || mentorship.mentee_id === userId);
        }

        case 'document': {
          const { data: document } = await supabase
            .from('mentor_documents')
            .select('mentor_id, access_level, allowed_mentees')
            .eq('id', resourceId)
            .single();
          
          if (!document) {return false;}
          
          // Owner always has access
          if (document.mentor_id === userId) {return true;}
          
          // Check access level
          if (document.access_level === 'public') {return true;}
          if (document.access_level === 'private') {return false;}
          if (document.access_level === 'specific_mentees') {
            return document.allowed_mentees?.includes(userId) || false;
          }
          
          return false;
        }

        default:
          return false;
      }
    } catch (error) {
      console.error('Resource access check error:', error);
      return false;
    }
  }

  /**
   * Log suspicious activity
   */
  private logSuspiciousActivity(userId: string, action: string, reason: string): void {
    const current = this.suspiciousActivities.get(userId) || 0;
    this.suspiciousActivities.set(userId, current + 1);

    // Log to audit trail
    this.logAuditEvent({
      user_id: userId,
      action: 'suspicious_activity',
      resource_type: 'security',
      risk_level: 'medium',
      metadata: { 
        suspicious_action: action,
        reason,
        count: current + 1
      }
    }).catch(console.error);

    console.warn(`Suspicious activity detected for user ${userId}: ${reason}`);
  }

  /**
   * Alert security team for critical events
   */
  private alertSecurityTeam(auditEntry: AuditLogEntry): void {
    // In a real implementation, this would send alerts to security team
    // For now, we'll log to console and could send to external monitoring service
    console.error('SECURITY ALERT:', {
      severity: auditEntry.risk_level,
      user: auditEntry.user_id,
      action: auditEntry.action,
      resource: auditEntry.resource_type,
      timestamp: auditEntry.created_at,
      metadata: auditEntry.metadata
    });

    // Could integrate with services like:
    // - PagerDuty
    // - Slack webhooks
    // - Email notifications
    // - SIEM systems
  }

  /**
   * Fallback logging to localStorage
   */
  private logToLocalStorage(key: string, data: any): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem(key) || '[]');
      existingLogs.push({ ...data, timestamp: new Date().toISOString() });
      
      // Keep only last 100 entries
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem(key, JSON.stringify(existingLogs));
    } catch (error) {
      console.error('Failed to log to localStorage:', error);
    }
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    rateLimitEntries: number;
    suspiciousActivities: number;
    blockedIPs: number;
    memoryUsage: string;
  } {
    return {
      rateLimitEntries: this.rateLimitStore.size,
      suspiciousActivities: this.suspiciousActivities.size,
      blockedIPs: this.blockedIPs.size,
      memoryUsage: `${Math.round((JSON.stringify(Array.from(this.rateLimitStore.entries())).length / 1024))} KB`
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    
    // Clean up rate limit store
    for (const [key, record] of this.rateLimitStore.entries()) {
      if (now >= record.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }

    // Reset suspicious activity counters (daily reset)
    const dayInMs = 24 * 60 * 60 * 1000;
    const lastCleanup = parseInt(localStorage.getItem('security_last_cleanup') || '0');
    
    if (now - lastCleanup > dayInMs) {
      this.suspiciousActivities.clear();
      localStorage.setItem('security_last_cleanup', now.toString());
    }
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(userId: string, days = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: auditLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {throw error;}

      // Analyze security events
      const report = {
        user_id: userId,
        period_days: days,
        total_events: auditLogs?.length || 0,
        risk_breakdown: {
          low: auditLogs?.filter(log => log.risk_level === 'low').length || 0,
          medium: auditLogs?.filter(log => log.risk_level === 'medium').length || 0,
          high: auditLogs?.filter(log => log.risk_level === 'high').length || 0,
          critical: auditLogs?.filter(log => log.risk_level === 'critical').length || 0
        },
        top_actions: this.getTopActions(auditLogs || []),
        suspicious_patterns: this.detectSuspiciousPatterns(auditLogs || []),
        generated_at: new Date().toISOString()
      };

      return report;
    } catch (error) {
      console.error('Error generating security report:', error);
      return null;
    }
  }

  /**
   * Analyze top actions from audit logs
   */
  private getTopActions(auditLogs: AuditLogEntry[]): Record<string, number> {
    const actionCounts: Record<string, number> = {};
    
    auditLogs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    // Sort by count and return top 10
    return Object.fromEntries(
      Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    );
  }

  /**
   * Detect suspicious patterns in audit logs
   */
  private detectSuspiciousPatterns(auditLogs: AuditLogEntry[]): string[] {
    const patterns: string[] = [];

    // Check for rapid consecutive actions
    const timeThreshold = 1000; // 1 second
    for (let i = 1; i < auditLogs.length; i++) {
      const timeDiff = new Date(auditLogs[i-1].created_at).getTime() - new Date(auditLogs[i].created_at).getTime();
      if (timeDiff < timeThreshold) {
        patterns.push('Rapid consecutive actions detected');
        break;
      }
    }

    // Check for unusual access patterns
    const accessDeniedCount = auditLogs.filter(log => log.action.includes('access_denied')).length;
    if (accessDeniedCount > 5) {
      patterns.push('Multiple access denied attempts');
    }

    // Check for high-risk events
    const highRiskCount = auditLogs.filter(log => log.risk_level === 'high' || log.risk_level === 'critical').length;
    if (highRiskCount > 2) {
      patterns.push('Multiple high-risk security events');
    }

    return patterns;
  }
}

// Export singleton instance
export const securityService = new SecurityService();

// Common validation schemas
export const ValidationSchemas = {
  session: {
    title: { required: true, type: 'string' as const, minLength: 1, maxLength: 200 },
    description: { type: 'string' as const, maxLength: 1000 },
    session_type: { required: true, type: 'string' as const },
    scheduled_start: { required: true, type: 'date' as const },
    duration_minutes: { required: true, type: 'number' as const, custom: (v: number) => v > 0 && v <= 480 }
  },
  
  document: {
    title: { required: true, type: 'string' as const, minLength: 1, maxLength: 200 },
    description: { type: 'string' as const, maxLength: 2000 },
    category: { required: true, type: 'string' as const },
    access_level: { required: true, type: 'string' as const },
    tags: { type: 'string' as const }
  },

  mentorship: {
    mentee_id: { required: true, type: 'uuid' as const },
    goals: { type: 'string' as const, maxLength: 2000 },
    relationship_type: { required: true, type: 'string' as const }
  },

  profile: {
    display_name: { required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
    bio: { type: 'string' as const, maxLength: 1000 },
    expertise_areas: { type: 'string' as const, maxLength: 500 },
    years_experience: { type: 'number' as const, custom: (v: number) => v >= 0 && v <= 50 }
  }
};

// Rate limit configurations
export const RateLimitConfigs = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  sessionCreate: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 sessions per minute
  documentUpload: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 uploads per minute
  messagesSend: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 messages per minute
  profileUpdate: { windowMs: 5 * 60 * 1000, maxRequests: 3 } // 3 updates per 5 minutes
};

export default securityService;