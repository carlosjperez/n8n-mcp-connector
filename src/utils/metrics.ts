/**
 * Advanced metrics and monitoring system for N8N MCP Connector
 * Provides comprehensive performance tracking and health monitoring
 */

import { logger } from './logger.js';
import { cacheManager } from './cache.js';

// Node.js global types
declare const setImmediate: (callback: () => void) => NodeJS.Immediate;
declare namespace NodeJS {
  interface Timeout extends ReturnType<typeof setTimeout> {}
  interface Immediate {}
}



interface HistogramBucket {
  le: number; // Less than or equal to
  count: number;
}

interface HistogramData {
  buckets: HistogramBucket[];
  sum: number;
  count: number;
}

interface PerformanceMetrics {
  requestCount: number;
  requestDuration: HistogramData;
  errorCount: number;
  cacheHitRatio: number;
  memoryUsage: number;
  activeConnections: number;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  metrics: PerformanceMetrics;
  timestamp: number;
}

/**
 * Metrics collector and aggregator
 */
export class MetricsCollector {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, HistogramData>();
  private timers = new Map<string, number>();
  private labels = new Map<string, Record<string, string>>();
  
  private readonly histogramBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
  private startTime = Date.now();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
    
    if (labels) {
      this.labels.set(key, labels);
    }
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, value);
    
    if (labels) {
      this.labels.set(key, labels);
    }
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, {
        buckets: this.histogramBuckets.map(le => ({ le, count: 0 })),
        sum: 0,
        count: 0
      });
    }
    
    const histogram = this.histograms.get(key)!;
    histogram.sum += value;
    histogram.count++;
    
    // Update buckets
    for (const bucket of histogram.buckets) {
      if (value <= bucket.le) {
        bucket.count++;
      }
    }
    
    if (labels) {
      this.labels.set(key, labels);
    }
  }

  /**
   * Start a timer
   */
  startTimer(name: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      this.recordHistogram(name, duration);
    };
  }

  /**
   * Get counter value
   */
  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.getMetricKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, labels?: Record<string, string>): number {
    const key = this.getMetricKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  /**
   * Get histogram data
   */
  getHistogram(name: string, labels?: Record<string, string>): HistogramData | undefined {
    const key = this.getMetricKey(name, labels);
    return this.histograms.get(key);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): {
    counters: Map<string, number>;
    gauges: Map<string, number>;
    histograms: Map<string, HistogramData>;
  } {
    return {
      counters: new Map(this.counters),
      gauges: new Map(this.gauges),
      histograms: new Map(this.histograms)
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.labels.clear();
    this.startTime = Date.now();
    
    logger.info('Metrics reset');
  }

  /**
   * Get uptime in seconds
   */
  getUptime(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Generate metric key with labels
   */
  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    
    const labelString = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    
    return `${name}{${labelString}}`;
  }
}

/**
 * Health checker for system components
 */
export class HealthChecker {
  private checks = new Map<string, () => Promise<boolean>>();
  private lastResults = new Map<string, boolean>();
  private checkInterval?: ReturnType<typeof setInterval>;

  constructor(private metrics: MetricsCollector) {
    this.setupDefaultChecks();
  }

  /**
   * Register a health check
   */
  registerCheck(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
    logger.info('Health check registered', { name });
  }

  /**
   * Run all health checks
   */
  async runChecks(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, check] of this.checks.entries()) {
      try {
        const result = await check();
        results[name] = result;
        this.lastResults.set(name, result);
        
        this.metrics.setGauge('health_check', result ? 1 : 0, { check: name });
      } catch (error: any) {
        results[name] = false;
        this.lastResults.set(name, false);
        
        logger.error('Health check failed', {
          check: name,
          error: error.message
        });
        
        this.metrics.setGauge('health_check', 0, { check: name });
      }
    }
    
    return results;
  }

  /**
   * Get overall health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const checks = await this.runChecks();
    const allHealthy = Object.values(checks).every(result => result);
    const someHealthy = Object.values(checks).some(result => result);
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allHealthy) {
      status = 'healthy';
    } else if (someHealthy) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    const cacheStats = cacheManager.getAllStats();
    const totalHits = Object.values(cacheStats).reduce((sum, stats) => sum + stats.hits, 0);
    const totalRequests = Object.values(cacheStats).reduce((sum, stats) => sum + stats.hits + stats.misses, 0);
    const cacheHitRatio = totalRequests > 0 ? totalHits / totalRequests : 0;
    
    const metrics: PerformanceMetrics = {
      requestCount: this.metrics.getCounter('requests_total'),
      requestDuration: this.metrics.getHistogram('request_duration_seconds') || {
        buckets: [],
        sum: 0,
        count: 0
      },
      errorCount: this.metrics.getCounter('errors_total'),
      cacheHitRatio,
      memoryUsage: process.memoryUsage().heapUsed,
      activeConnections: this.metrics.getGauge('active_connections')
    };
    
    return {
      status,
      checks,
      metrics,
      timestamp: Date.now()
    };
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(intervalMs: number = 30000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(async () => {
      await this.runChecks();
    }, intervalMs);
    
    logger.info('Periodic health checks started', { intervalMs });
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
    
    logger.info('Periodic health checks stopped');
  }

  /**
   * Setup default health checks
   */
  private setupDefaultChecks(): void {
    // Memory usage check
    this.registerCheck('memory', async () => {
      const usage = process.memoryUsage();
      const maxHeapMB = 512; // 512MB limit
      return usage.heapUsed < maxHeapMB * 1024 * 1024;
    });
    
    // Event loop lag check
    this.registerCheck('event_loop', async () => {
      return new Promise((resolve) => {
        const start = Date.now();
        setImmediate(() => {
          const lag = Date.now() - start;
          resolve(lag < 100); // Less than 100ms lag
        });
      });
    });
    
    // Cache health check
    this.registerCheck('cache', async () => {
      try {
        const stats = cacheManager.getAllStats();
        return Object.keys(stats).length > 0;
      } catch {
        return false;
      }
    });
  }
}

/**
 * Performance monitor for tracking system performance
 */
export class PerformanceMonitor {
  private metrics: MetricsCollector;
  private healthChecker: HealthChecker;
  private monitoringInterval?: ReturnType<typeof setInterval>;

  constructor() {
    this.metrics = new MetricsCollector();
    this.healthChecker = new HealthChecker(this.metrics);
  }

  /**
   * Start monitoring
   */
  start(): void {
    this.healthChecker.startPeriodicChecks();
    this.startSystemMetrics();
    
    logger.info('Performance monitoring started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.healthChecker.stopPeriodicChecks();
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    logger.info('Performance monitoring stopped');
  }

  /**
   * Get metrics collector
   */
  getMetrics(): MetricsCollector {
    return this.metrics;
  }

  /**
   * Get health checker
   */
  getHealthChecker(): HealthChecker {
    return this.healthChecker;
  }

  /**
   * Record tool execution
   */
  recordToolExecution(toolName: string, duration: number, success: boolean): void {
    this.metrics.incrementCounter('requests_total', 1, { tool: toolName });
    this.metrics.recordHistogram('request_duration_seconds', duration, { tool: toolName });
    
    if (!success) {
      this.metrics.incrementCounter('errors_total', 1, { tool: toolName });
    }
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(operation: 'hit' | 'miss' | 'set', cacheName: string): void {
    this.metrics.incrementCounter('cache_operations_total', 1, {
      operation,
      cache: cacheName
    });
  }

  /**
   * Update connection count
   */
  updateConnectionCount(count: number): void {
    this.metrics.setGauge('active_connections', count);
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<{
    uptime: number;
    requestRate: number;
    errorRate: number;
    avgResponseTime: number;
    cacheHitRatio: number;
    memoryUsage: number;
    healthStatus: HealthStatus;
  }> {
    const uptime = this.metrics.getUptime();
    const totalRequests = this.metrics.getCounter('requests_total');
    const totalErrors = this.metrics.getCounter('errors_total');
    const requestDuration = this.metrics.getHistogram('request_duration_seconds');
    
    const requestRate = totalRequests / uptime;
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    const avgResponseTime = requestDuration && requestDuration.count > 0 
      ? requestDuration.sum / requestDuration.count 
      : 0;
    
    const cacheStats = cacheManager.getAllStats();
    const totalHits = Object.values(cacheStats).reduce((sum, stats) => sum + stats.hits, 0);
    const totalCacheRequests = Object.values(cacheStats).reduce((sum, stats) => sum + stats.hits + stats.misses, 0);
    const cacheHitRatio = totalCacheRequests > 0 ? totalHits / totalCacheRequests : 0;
    
    const memoryUsage = process.memoryUsage().heapUsed;
    const healthStatus = await this.healthChecker.getHealthStatus();
    
    return {
      uptime,
      requestRate,
      errorRate,
      avgResponseTime,
      cacheHitRatio,
      memoryUsage,
      healthStatus
    };
  }

  /**
   * Start collecting system metrics
   */
  private startSystemMetrics(): void {
    this.monitoringInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      
      this.metrics.setGauge('memory_heap_used_bytes', memUsage.heapUsed);
      this.metrics.setGauge('memory_heap_total_bytes', memUsage.heapTotal);
      this.metrics.setGauge('memory_external_bytes', memUsage.external);
      this.metrics.setGauge('memory_rss_bytes', memUsage.rss);
      
      // Update cache metrics
      const cacheStats = cacheManager.getAllStats();
      for (const [cacheName, stats] of Object.entries(cacheStats)) {
        this.metrics.setGauge('cache_size', stats.size, { cache: cacheName });
        this.metrics.setGauge('cache_memory_bytes', stats.memoryUsage, { cache: cacheName });
        this.metrics.setGauge('cache_hit_ratio', 
          stats.hits + stats.misses > 0 ? stats.hits / (stats.hits + stats.misses) : 0,
          { cache: cacheName }
        );
      }
    }, 5000); // Every 5 seconds
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Export metrics and health checker for easy access
export const metrics = performanceMonitor.getMetrics();
export const healthChecker = performanceMonitor.getHealthChecker();