import { mentorSessionService } from './mentorSessionService';
import { documentManagementService } from './documentManagementService';
import { activityTrackingService } from './activityTrackingService';
import { mentorCacheService } from './mentorCacheService';
import { securityService, ValidationSchemas, RateLimitConfigs } from './securityService';
import { performanceMonitor } from '@/utils/performanceOptimizer';

/**
 * Unified mentor platform service that orchestrates all mentor-related operations
 * with built-in security, caching, and performance monitoring
 */
export class MentorPlatformService {
  private static instance: MentorPlatformService;

  public static getInstance(): MentorPlatformService {
    if (!MentorPlatformService.instance) {
      MentorPlatformService.instance = new MentorPlatformService();
    }
    return MentorPlatformService.instance;
  }

  // Session Management
  async createSession(mentorId: string, sessionData: any) {
    const endTimer = performanceMonitor.startTimer('createSession');
    
    try {
      // Security validation
      const sessionValidation = await this.validateSessionAuth(mentorId);
      if (!sessionValidation.isValid) {
        throw new Error(sessionValidation.action || 'Session validation failed');
      }

      // Rate limiting
      const rateLimitCheck = securityService.checkRateLimit(
        mentorId,
        'sessionCreate',
        RateLimitConfigs.sessionCreate
      );
      
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded. Try again in ${rateLimitCheck.retryAfter} seconds.`);
      }

      // Input validation
      const validation = securityService.validateInput(sessionData, ValidationSchemas.session);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Access control
      const accessCheck = await securityService.verifyAccess(mentorId, 'session', 'create');
      if (!accessCheck.allowed) {
        throw new Error(accessCheck.reason || 'Access denied');
      }

      // Create session
      const result = await mentorSessionService.createSession(mentorId, validation.sanitizedData);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Log activity
      await activityTrackingService.logActivity(
        mentorId,
        'session_scheduled',
        'session',
        result.data?.id,
        { session_type: sessionData.session_type }
      );

      // Invalidate cache
      mentorCacheService.invalidateMentorCache(mentorId);

      // Audit log
      await securityService.logAuditEvent({
        user_id: mentorId,
        action: 'session_created',
        resource_type: 'session',
        resource_id: result.data?.id,
        risk_level: 'low',
        new_values: validation.sanitizedData
      });

      return { data: result.data, error: null };
    } catch (error) {
      await securityService.logAuditEvent({
        user_id: mentorId,
        action: 'session_create_failed',
        resource_type: 'session',
        risk_level: 'medium',
        metadata: { error: error.message }
      });

      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Session creation failed' 
      };
    } finally {
      endTimer();
    }
  }

  async updateSession(sessionId: string, mentorId: string, updates: any) {
    const endTimer = performanceMonitor.startTimer('updateSession');
    
    try {
      // Security validation
      const sessionValidation = await this.validateSessionAuth(mentorId);
      if (!sessionValidation.isValid) {
        throw new Error(sessionValidation.action || 'Session validation failed');
      }

      // Access control for specific resource
      const accessCheck = await securityService.verifyAccess(mentorId, 'session', 'update', sessionId);
      if (!accessCheck.allowed) {
        throw new Error(accessCheck.reason || 'Access denied');
      }

      // Input validation (partial schema for updates)
      const updateSchema = Object.fromEntries(
        Object.entries(ValidationSchemas.session).filter(([key]) => key in updates)
      );
      
      const validation = securityService.validateInput(updates, updateSchema);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const result = await mentorSessionService.updateSession(sessionId, mentorId, validation.sanitizedData);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Log activity
      await activityTrackingService.logActivity(
        mentorId,
        'session_updated',
        'session',
        sessionId,
        { updates: Object.keys(validation.sanitizedData) }
      );

      // Invalidate cache
      mentorCacheService.invalidateMentorCache(mentorId);

      return { data: result.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Session update failed' 
      };
    } finally {
      endTimer();
    }
  }

  async getMentorSessions(mentorId: string, options: any = {}) {
    const endTimer = performanceMonitor.startTimer('getMentorSessions');
    
    try {
      // Security validation
      const sessionValidation = await this.validateSessionAuth(mentorId);
      if (!sessionValidation.isValid) {
        throw new Error(sessionValidation.action || 'Session validation failed');
      }

      // Try cache first
      const cacheKey = `sessions_${mentorId}_${JSON.stringify(options)}`;
      const cached = mentorCacheService.getCachedDashboardData(mentorId);
      
      if (cached && !options.forceRefresh) {
        return { data: (await cached).sessions, error: null };
      }

      const result = await mentorSessionService.getMentorSessions(mentorId, options);
      return result;
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch sessions' 
      };
    } finally {
      endTimer();
    }
  }

  // Document Management
  async createDocument(mentorId: string, documentData: any) {
    const endTimer = performanceMonitor.startTimer('createDocument');
    
    try {
      // Security validation
      const sessionValidation = await this.validateSessionAuth(mentorId);
      if (!sessionValidation.isValid) {
        throw new Error(sessionValidation.action || 'Session validation failed');
      }

      // Rate limiting
      const rateLimitCheck = securityService.checkRateLimit(
        mentorId,
        'documentUpload',
        RateLimitConfigs.documentUpload
      );
      
      if (!rateLimitCheck.allowed) {
        throw new Error(`Upload rate limit exceeded. Try again in ${rateLimitCheck.retryAfter} seconds.`);
      }

      // File validation
      if (documentData.file) {
        const fileValidation = securityService.validateFileUpload(documentData.file);
        if (!fileValidation.isValid) {
          throw new Error(fileValidation.error);
        }
      }

      // Input validation
      const validation = securityService.validateInput(documentData, ValidationSchemas.document);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const result = await documentManagementService.createDocument(mentorId, {
        ...validation.sanitizedData,
        file: documentData.file
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Log activity
      await activityTrackingService.logActivity(
        mentorId,
        'document_uploaded',
        'document',
        result.data?.id,
        { document_type: documentData.document_type }
      );

      // Invalidate cache
      mentorCacheService.invalidateMentorCache(mentorId);

      return { data: result.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Document creation failed' 
      };
    } finally {
      endTimer();
    }
  }

  async getMentorDocuments(mentorId: string, options: any = {}) {
    const endTimer = performanceMonitor.startTimer('getMentorDocuments');
    
    try {
      // Security validation
      const sessionValidation = await this.validateSessionAuth(mentorId);
      if (!sessionValidation.isValid) {
        throw new Error(sessionValidation.action || 'Session validation failed');
      }

      // Use cached version if available
      if (!options.forceRefresh) {
        const cached = await mentorCacheService.getCachedDocuments(mentorId, options);
        return { data: cached, error: null };
      }

      const result = await documentManagementService.getMentorDocuments(mentorId, options);
      return result;
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch documents' 
      };
    } finally {
      endTimer();
    }
  }

  // Analytics and Reporting
  async getMentorAnalytics(mentorId: string) {
    const endTimer = performanceMonitor.startTimer('getMentorAnalytics');
    
    try {
      // Security validation
      const sessionValidation = await this.validateSessionAuth(mentorId);
      if (!sessionValidation.isValid) {
        throw new Error(sessionValidation.action || 'Session validation failed');
      }

      const analytics = await activityTrackingService.getMentorAnalytics(mentorId);
      
      // Log analytics access
      await activityTrackingService.logActivity(
        mentorId,
        'analytics_viewed',
        'analytics',
        undefined,
        { access_time: new Date().toISOString() }
      );

      return { data: analytics, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch analytics' 
      };
    } finally {
      endTimer();
    }
  }

  async getDashboardSummary(mentorId: string) {
    const endTimer = performanceMonitor.startTimer('getDashboardSummary');
    
    try {
      // Security validation
      const sessionValidation = await this.validateSessionAuth(mentorId);
      if (!sessionValidation.isValid) {
        throw new Error(sessionValidation.action || 'Session validation failed');
      }

      // Use cached dashboard data
      const cachedData = await mentorCacheService.getCachedDashboardData(mentorId);
      
      if (cachedData) {
        return { data: cachedData, error: null };
      }

      // Fallback to individual service calls
      const summary = await activityTrackingService.getDashboardSummary(mentorId);
      return { data: summary, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard summary' 
      };
    } finally {
      endTimer();
    }
  }

  // Batch Operations
  async batchLoadMentorData(mentorId: string) {
    const endTimer = performanceMonitor.startTimer('batchLoadMentorData');
    
    try {
      // Security validation
      const sessionValidation = await this.validateSessionAuth(mentorId);
      if (!sessionValidation.isValid) {
        throw new Error(sessionValidation.action || 'Session validation failed');
      }

      const batchData = await mentorCacheService.batchLoadMentorData(mentorId);
      
      // Log batch access
      await activityTrackingService.logActivity(
        mentorId,
        'batch_data_loaded',
        'platform',
        undefined,
        { load_time: new Date().toISOString() }
      );

      return { data: batchData, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to batch load data' 
      };
    } finally {
      endTimer();
    }
  }

  // Utility Methods
  async validateSessionAuth(userId: string) {
    return await securityService.validateSession(userId);
  }

  async warmUpCache(mentorId: string) {
    try {
      await mentorCacheService.warmUpCache(mentorId);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Cache warm-up failed' 
      };
    }
  }

  async generateSecurityReport(mentorId: string, days = 7) {
    try {
      // Security validation
      const sessionValidation = await this.validateSessionAuth(mentorId);
      if (!sessionValidation.isValid) {
        throw new Error(sessionValidation.action || 'Session validation failed');
      }

      const report = await securityService.generateSecurityReport(mentorId, days);
      
      // Log report generation
      await securityService.logAuditEvent({
        user_id: mentorId,
        action: 'security_report_generated',
        resource_type: 'report',
        risk_level: 'low',
        metadata: { report_period_days: days }
      });

      return { data: report, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to generate security report' 
      };
    }
  }

  getPerformanceMetrics() {
    return {
      metrics: performanceMonitor.getAllMetrics(),
      cache: mentorCacheService.getCacheStats(),
      security: securityService.getSecurityStats()
    };
  }

  async cleanup() {
    // Cleanup all services
    securityService.cleanup();
    mentorCacheService.clearAllMentorCache();
    performanceMonitor.clear();
    
    console.log('Mentor platform service cleanup completed');
  }
}

// Export singleton instance
export const mentorPlatformService = MentorPlatformService.getInstance();
export default mentorPlatformService;