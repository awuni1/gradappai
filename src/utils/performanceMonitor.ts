// 🚀 ULTRA-PERFORMANCE MONITORING SYSTEM
// Advanced performance optimization and memory leak detection

import React from 'react';
import { errorHandler } from './errorHandler';

// =============================================================================
// PERFORMANCE TYPES & INTERFACES
// =============================================================================

export interface PerformanceMetrics {
  id: string;
  timestamp: number;
  component?: string;
  action?: string;
  duration: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  navigation?: PerformanceNavigationTiming;
  resource?: PerformanceResourceTiming;
  custom?: Record<string, number | string>;
}

export interface MemoryLeak {
  id: string;
  component: string;
  detectedAt: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  memoryGrowth: number;
  recommendations: string[];
}

export interface PerformanceAlert {
  id: string;
  type: 'memory' | 'cpu' | 'network' | 'render' | 'bundle';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  component?: string;
  action?: string;
}

// =============================================================================
// PERFORMANCE THRESHOLDS
// =============================================================================

const PERFORMANCE_THRESHOLDS = {
  // Timing thresholds (milliseconds)
  COMPONENT_RENDER: 100,
  API_RESPONSE: 2000,
  PAGE_LOAD: 3000,
  FIRST_CONTENTFUL_PAINT: 1800,
  LARGEST_CONTENTFUL_PAINT: 2500,
  CUMULATIVE_LAYOUT_SHIFT: 0.1,
  FIRST_INPUT_DELAY: 100,
  
  // Memory thresholds
  MEMORY_USAGE_WARNING: 0.8, // 80% of available memory
  MEMORY_USAGE_CRITICAL: 0.95, // 95% of available memory
  MEMORY_LEAK_THRESHOLD: 50 * 1024 * 1024, // 50MB growth
  
  // Bundle size thresholds (bytes)
  BUNDLE_SIZE_WARNING: 1024 * 1024, // 1MB
  BUNDLE_SIZE_CRITICAL: 2 * 1024 * 1024, // 2MB
  
  // Network thresholds
  SLOW_NETWORK_THRESHOLD: 1000, // 1 second
  FAILED_REQUEST_THRESHOLD: 0.05, // 5% failure rate
} as const;

// =============================================================================
// PERFORMANCE MONITOR CLASS
// =============================================================================

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private memoryLeaks: MemoryLeak[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  private observers: {
    intersection?: IntersectionObserver;
    mutation?: MutationObserver;
    resize?: ResizeObserver;
  } = {};
  private memoryBaseline = 0;
  private componentRenderTimes = new Map<string, number[]>();
  private networkRequests = new Map<string, PerformanceResourceTiming>();

  private constructor() {
    this.setupPerformanceObservers();
    this.startMemoryMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // =============================================================================
  // MONITORING SETUP
  // =============================================================================

  private setupPerformanceObservers(): void {
    // Performance Observer for navigation and resource timing
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      try {
        observer.observe({ entryTypes: ['navigation', 'resource', 'measure', 'mark'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // Intersection Observer for visibility tracking
    this.observers.intersection = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.trackVisibilityStart(entry.target as HTMLElement);
          } else {
            this.trackVisibilityEnd(entry.target as HTMLElement);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Mutation Observer for DOM changes
    this.observers.mutation = new MutationObserver((mutations) => {
      let nodeCount = 0;
      mutations.forEach((mutation) => {
        nodeCount += mutation.addedNodes.length;
      });
      
      if (nodeCount > 100) {
        this.createAlert({
          type: 'render',
          severity: 'warning',
          message: `Large DOM mutation detected: ${nodeCount} nodes added`,
          value: nodeCount,
          threshold: 100,
        });
      }
    });

    // Resize Observer for layout shifts
    if ('ResizeObserver' in window) {
      this.observers.resize = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          this.trackLayoutShift(element);
        });
      });
    }
  }

  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      this.memoryBaseline = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize;
    }

    // Monitor memory every 30 seconds
    setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);
  }

  // =============================================================================
  // PERFORMANCE TRACKING
  // =============================================================================

  public startTracking(): void {
    this.isMonitoring = true;
    console.log('🚀 Performance monitoring started');
  }

  public stopTracking(): void {
    this.isMonitoring = false;
    this.cleanup();
    console.log('⏹️ Performance monitoring stopped');
  }

  public trackComponentRender(componentName: string, renderTime: number): void {
    if (!this.isMonitoring) {return;}

    const times = this.componentRenderTimes.get(componentName) || [];
    times.push(renderTime);
    
    // Keep only last 10 render times
    if (times.length > 10) {
      times.shift();
    }
    
    this.componentRenderTimes.set(componentName, times);

    // Check for slow renders
    if (renderTime > PERFORMANCE_THRESHOLDS.COMPONENT_RENDER) {
      this.createAlert({
        type: 'render',
        severity: 'warning',
        message: `Slow component render: ${componentName}`,
        value: renderTime,
        threshold: PERFORMANCE_THRESHOLDS.COMPONENT_RENDER,
        component: componentName,
      });
    }

    // Record metric
    this.recordMetric({
      component: componentName,
      action: 'render',
      duration: renderTime,
    });
  }

  public trackApiCall(url: string, duration: number, success: boolean): void {
    if (!this.isMonitoring) {return;}

    // Check for slow API calls
    if (duration > PERFORMANCE_THRESHOLDS.API_RESPONSE) {
      this.createAlert({
        type: 'network',
        severity: 'warning',
        message: `Slow API response: ${url}`,
        value: duration,
        threshold: PERFORMANCE_THRESHOLDS.API_RESPONSE,
      });
    }

    // Record metric
    this.recordMetric({
      action: 'api_call',
      duration,
      custom: {
        success: success ? 1 : 0,
        url_hash: this.hashString(url),
      },
    });
  }

  public trackUserAction(action: string, component?: string): () => void {
    if (!this.isMonitoring) {
      return () => {
        // No-op when monitoring is disabled
      };
    }

    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        component,
        action,
        duration,
      });
    };
  }

  public trackPageLoad(): void {
    if (!this.isMonitoring) {return;}

    // Wait for page to be fully loaded
    if (document.readyState === 'complete') {
      this.processPageLoadMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.processPageLoadMetrics(), 100);
      });
    }
  }

  // =============================================================================
  // MEMORY LEAK DETECTION
  // =============================================================================

  private checkMemoryUsage(): void {
    if (!('memory' in performance)) {return;}

    const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
    const currentUsage = memory.usedJSHeapSize;
    const totalMemory = memory.totalJSHeapSize;
    const percentage = currentUsage / totalMemory;

    // Check for memory warnings
    if (percentage > PERFORMANCE_THRESHOLDS.MEMORY_USAGE_CRITICAL) {
      this.createAlert({
        type: 'memory',
        severity: 'critical',
        message: `Critical memory usage: ${Math.round(percentage * 100)}%`,
        value: percentage,
        threshold: PERFORMANCE_THRESHOLDS.MEMORY_USAGE_CRITICAL,
      });
    } else if (percentage > PERFORMANCE_THRESHOLDS.MEMORY_USAGE_WARNING) {
      this.createAlert({
        type: 'memory',
        severity: 'warning',
        message: `High memory usage: ${Math.round(percentage * 100)}%`,
        value: percentage,
        threshold: PERFORMANCE_THRESHOLDS.MEMORY_USAGE_WARNING,
      });
    }

    // Check for memory leaks
    const memoryGrowth = currentUsage - this.memoryBaseline;
    if (memoryGrowth > PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD) {
      this.detectMemoryLeak(memoryGrowth);
    }

    // Record memory metric
    this.recordMetric({
      action: 'memory_check',
      duration: 0,
      custom: {
        used_memory: currentUsage,
        total_memory: totalMemory,
        memory_percentage: percentage,
        memory_growth: memoryGrowth,
      },
    });
  }

  private detectMemoryLeak(memoryGrowth: number): void {
    const leak: MemoryLeak = {
      id: this.generateId(),
      component: 'unknown',
      detectedAt: Date.now(),
      severity: this.getMemoryLeakSeverity(memoryGrowth),
      description: `Memory usage increased by ${this.formatBytes(memoryGrowth)}`,
      memoryGrowth,
      recommendations: this.getMemoryLeakRecommendations(memoryGrowth),
    };

    this.memoryLeaks.push(leak);

    // Create alert
    this.createAlert({
      type: 'memory',
      severity: 'error',
      message: `Potential memory leak detected: ${this.formatBytes(memoryGrowth)} growth`,
      value: memoryGrowth,
      threshold: PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD,
    });

    console.error('🔥 Memory leak detected:', leak);
  }

  private getMemoryLeakSeverity(growth: number): MemoryLeak['severity'] {
    if (growth > 200 * 1024 * 1024) {return 'critical';} // 200MB
    if (growth > 100 * 1024 * 1024) {return 'high';} // 100MB
    if (growth > 50 * 1024 * 1024) {return 'medium';} // 50MB
    return 'low';
  }

  private getMemoryLeakRecommendations(growth: number): string[] {
    const recommendations = [
      'Check for uncleaned event listeners',
      'Verify React component cleanup in useEffect',
      'Look for unclosed subscriptions (Supabase, WebSocket)',
      'Check for circular references in objects',
      'Verify proper cleanup of timers and intervals',
    ];

    if (growth > 100 * 1024 * 1024) {
      recommendations.push(
        'Consider implementing lazy loading for large components',
        'Review image and asset loading strategies',
        'Check for memory-intensive operations that are not properly disposed'
      );
    }

    return recommendations;
  }

  // =============================================================================
  // PERFORMANCE ANALYSIS
  // =============================================================================

  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (entry.entryType === 'navigation') {
      this.processNavigationTiming(entry as PerformanceNavigationTiming);
    } else if (entry.entryType === 'resource') {
      this.processResourceTiming(entry as PerformanceResourceTiming);
    } else if (entry.entryType === 'measure') {
      this.processMeasure(entry);
    }
  }

  private processNavigationTiming(entry: PerformanceNavigationTiming): void {
    const loadTime = entry.loadEventEnd - entry.loadEventStart;
    const domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
    const firstByte = entry.responseStart - entry.requestStart;

    // Check thresholds
    if (loadTime > PERFORMANCE_THRESHOLDS.PAGE_LOAD) {
      this.createAlert({
        type: 'network',
        severity: 'warning',
        message: `Slow page load: ${Math.round(loadTime)}ms`,
        value: loadTime,
        threshold: PERFORMANCE_THRESHOLDS.PAGE_LOAD,
      });
    }

    this.recordMetric({
      action: 'page_load',
      duration: loadTime,
      navigation: entry,
      custom: {
        dom_content_loaded: domContentLoaded,
        first_byte: firstByte,
        dns_lookup: entry.domainLookupEnd - entry.domainLookupStart,
        tcp_connect: entry.connectEnd - entry.connectStart,
      },
    });
  }

  private processResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.requestStart;
    
    // Track large resources
    if (entry.transferSize > PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_WARNING) {
      this.createAlert({
        type: 'bundle',
        severity: 'warning',
        message: `Large resource loaded: ${entry.name}`,
        value: entry.transferSize,
        threshold: PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_WARNING,
      });
    }

    // Track slow resources
    if (duration > PERFORMANCE_THRESHOLDS.SLOW_NETWORK_THRESHOLD) {
      this.createAlert({
        type: 'network',
        severity: 'warning',
        message: `Slow resource load: ${entry.name}`,
        value: duration,
        threshold: PERFORMANCE_THRESHOLDS.SLOW_NETWORK_THRESHOLD,
      });
    }

    this.recordMetric({
      action: 'resource_load',
      duration,
      resource: entry,
      custom: {
        transfer_size: entry.transferSize,
        encoded_size: entry.encodedBodySize,
        decoded_size: entry.decodedBodySize,
      },
    });
  }

  private processMeasure(entry: PerformanceEntry): void {
    this.recordMetric({
      action: entry.name,
      duration: entry.duration,
      custom: {
        start_time: entry.startTime,
      },
    });
  }

  private processPageLoadMetrics(): void {
    // Core Web Vitals
    if ('web-vitals' in window) {
      // This would integrate with web-vitals library if available
      // For now, we'll use Performance API directly
    }

    // Paint timing
    const paintEntries = performance.getEntriesByType('paint');
    for (const entry of paintEntries) {
      if (entry.name === 'first-contentful-paint' && 
          entry.startTime > PERFORMANCE_THRESHOLDS.FIRST_CONTENTFUL_PAINT) {
        this.createAlert({
          type: 'render',
          severity: 'warning',
          message: `Slow First Contentful Paint: ${Math.round(entry.startTime)}ms`,
          value: entry.startTime,
          threshold: PERFORMANCE_THRESHOLDS.FIRST_CONTENTFUL_PAINT,
        });
      }
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private recordMetric(partial: Partial<PerformanceMetrics>): void {
    const memory = this.getMemoryInfo();
    
    const metric: PerformanceMetrics = {
      id: this.generateId(),
      timestamp: Date.now(),
      duration: 0,
      memory,
      ...partial,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private createAlert(partial: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const alert: PerformanceAlert = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...partial,
    };

    this.alerts.push(alert);

    // Notify error handler for critical alerts
    if (alert.severity === 'critical') {
      errorHandler.handleError(
        new Error(alert.message),
        { 
          component: alert.component,
          action: alert.action,
          metadata: { performanceAlert: alert }
        }
      );
    }

    console.warn('⚠️ Performance Alert:', alert);
  }

  private getMemoryInfo(): PerformanceMetrics['memory'] {
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: memory.usedJSHeapSize / memory.totalJSHeapSize,
      };
    }

    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  }

  private trackVisibilityStart(element: HTMLElement): void {
    element.dataset.visibilityStart = Date.now().toString();
  }

  private trackVisibilityEnd(element: HTMLElement): void {
    const startTime = element.dataset.visibilityStart;
    if (startTime) {
      const duration = Date.now() - parseInt(startTime, 10);
      this.recordMetric({
        action: 'element_visibility',
        duration,
        custom: {
          element_tag: element.tagName.toLowerCase(),
          element_id: element.id || 'unknown',
        },
      });
    }
  }

  private trackLayoutShift(element: HTMLElement): void {
    // Simple layout shift detection
    this.recordMetric({
      action: 'layout_shift',
      duration: 0,
      custom: {
        element_tag: element.tagName.toLowerCase(),
        element_id: element.id || 'unknown',
      },
    });
  }

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) {return '0 Bytes';}
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private cleanup(): void {
    // Cleanup observers
    Object.values(this.observers).forEach(observer => {
      observer?.disconnect();
    });
    
    this.observers = {};
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public getMemoryLeaks(): MemoryLeak[] {
    return [...this.memoryLeaks];
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.alerts = [];
    this.memoryLeaks = [];
  }

  public getPerformanceReport(): {
    summary: Record<string, number>;
    recommendations: string[];
    criticalIssues: PerformanceAlert[];
  } {
    const criticalIssues = this.alerts.filter(alert => alert.severity === 'critical');
    
    const summary = {
      total_metrics: this.metrics.length,
      total_alerts: this.alerts.length,
      critical_alerts: criticalIssues.length,
      memory_leaks: this.memoryLeaks.length,
      avg_render_time: this.getAverageRenderTime(),
      avg_api_response: this.getAverageApiResponse(),
    };

    const recommendations = this.generateRecommendations();

    return {
      summary,
      recommendations,
      criticalIssues,
    };
  }

  private getAverageRenderTime(): number {
    const renderMetrics = this.metrics.filter(m => m.action === 'render');
    if (renderMetrics.length === 0) {return 0;}
    
    const total = renderMetrics.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(total / renderMetrics.length);
  }

  private getAverageApiResponse(): number {
    const apiMetrics = this.metrics.filter(m => m.action === 'api_call');
    if (apiMetrics.length === 0) {return 0;}
    
    const total = apiMetrics.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(total / apiMetrics.length);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Component render optimization
    if (this.getAverageRenderTime() > PERFORMANCE_THRESHOLDS.COMPONENT_RENDER) {
      recommendations.push('Consider optimizing component renders with React.memo or useMemo');
    }

    // API optimization
    if (this.getAverageApiResponse() > PERFORMANCE_THRESHOLDS.API_RESPONSE) {
      recommendations.push('Optimize API calls with caching, debouncing, or request batching');
    }

    // Memory optimization
    if (this.memoryLeaks.length > 0) {
      recommendations.push('Address memory leaks to improve application stability');
    }

    // Bundle size optimization
    const largeBundleAlerts = this.alerts.filter(a => a.type === 'bundle');
    if (largeBundleAlerts.length > 0) {
      recommendations.push('Implement code splitting and lazy loading for large bundles');
    }

    return recommendations;
  }
}

// =============================================================================
// EXPORT SINGLETON AND UTILITIES
// =============================================================================

export const performanceMonitor = PerformanceMonitor.getInstance();

// React Hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.trackComponentRender(componentName, renderTime);
    };
  });

  return {
    trackAction: (action: string) => performanceMonitor.trackUserAction(action, componentName),
    trackApiCall: (url: string, duration: number, success: boolean) => 
      performanceMonitor.trackApiCall(url, duration, success),
  };
};

// HOC for automatic performance tracking
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const name = componentName || Component.displayName || Component.name || 'Unknown';
  
  return React.memo(React.forwardRef<unknown, P>((props, ref) => {
    usePerformanceTracking(name);
    return React.createElement(Component, { ...(props as P), ...(ref ? { ref } : {}) });
  }));
};

export default performanceMonitor;