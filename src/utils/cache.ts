/**
 * Advanced caching system for N8N MCP Connector
 * Provides intelligent caching with TTL, LRU eviction, and memory management
 */

import { logger } from './logger.js';

// Node.js global types
declare namespace _NodeJS {
  interface Timeout extends ReturnType<typeof setTimeout> {}
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  memoryUsage: number;
}

interface CacheOptions {
  maxSize?: number;
  defaultTtl?: number;
  cleanupInterval?: number;
  maxMemoryMB?: number;
}

/**
 * Intelligent cache with LRU eviction and TTL support
 */
export class IntelligentCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    memoryUsage: 0
  };
  
  private readonly maxSize: number;
  private readonly defaultTtl: number;
  private readonly maxMemoryBytes: number;
  private cleanupTimer?: _NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTtl = options.defaultTtl || 300000; // 5 minutes
    this.maxMemoryBytes = (options.maxMemoryMB || 50) * 1024 * 1024; // 50MB default
    
    // Start cleanup interval
    const cleanupInterval = options.cleanupInterval || 60000; // 1 minute
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
    
    logger.info('Cache initialized', {
      maxSize: this.maxSize,
      defaultTtl: this.defaultTtl,
      maxMemoryMB: options.maxMemoryMB || 50
    });
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);
    this.stats.hits++;
    
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entryTtl = ttl || this.defaultTtl;
    
    // Check memory usage before adding
    if (this.shouldEvictForMemory()) {
      this.evictLRU();
    }
    
    // Check size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      ttl: entryTtl,
      accessCount: 1,
      lastAccessed: now
    };
    
    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.updateStats();
    
    logger.debug('Cache entry set', {
      key,
      ttl: entryTtl,
      cacheSize: this.cache.size
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
      this.updateStats();
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats.size = 0;
    this.stats.memoryUsage = 0;
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit ratio
   */
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Check if cache has key
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const _now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger.debug('Cache cleanup completed', {
        expiredEntries: expiredCount,
        remainingEntries: this.cache.size
      });
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;
    
    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
    this.stats.evictions++;
    
    logger.debug('LRU eviction', {
      evictedKey: lruKey,
      cacheSize: this.cache.size
    });
  }

  /**
   * Check if should evict for memory
   */
  private shouldEvictForMemory(): boolean {
    return this.estimateMemoryUsage() > this.maxMemoryBytes;
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += this.estimateEntrySize(key, entry);
    }
    
    return totalSize;
  }

  /**
   * Estimate size of cache entry
   */
  private estimateEntrySize(key: string, entry: CacheEntry<T>): number {
    const keySize = key.length * 2; // UTF-16
    const valueSize = JSON.stringify(entry.value).length * 2;
    const metadataSize = 64; // Approximate size of metadata
    
    return keySize + valueSize + metadataSize;
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
    logger.info('Cache destroyed');
  }
}

/**
 * Cache manager for different cache types
 */
export class CacheManager {
  private caches = new Map<string, IntelligentCache<any>>();

  /**
   * Get or create cache instance
   */
  getCache<T>(name: string, options?: CacheOptions): IntelligentCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new IntelligentCache<T>(options));
      logger.info('Cache instance created', { name });
    }
    return this.caches.get(name)!;
  }

  /**
   * Get all cache statistics
   */
  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    
    return stats;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
    logger.info('All caches cleared');
  }

  /**
   * Destroy all caches
   */
  destroyAll(): void {
    for (const cache of this.caches.values()) {
      cache.destroy();
    }
    this.caches.clear();
    logger.info('All caches destroyed');
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Pre-configured cache instances
export const workflowCache = cacheManager.getCache('workflows', {
  maxSize: 500,
  defaultTtl: 600000, // 10 minutes
  maxMemoryMB: 20
});

export const executionCache = cacheManager.getCache('executions', {
  maxSize: 1000,
  defaultTtl: 300000, // 5 minutes
  maxMemoryMB: 30
});

export const nodeCache = cacheManager.getCache('nodes', {
  maxSize: 200,
  defaultTtl: 900000, // 15 minutes
  maxMemoryMB: 10
});