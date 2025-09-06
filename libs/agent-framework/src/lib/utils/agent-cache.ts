import { AgentCache, AgentCacheEntry } from '../types/agent-types';

/**
 * In-memory cache implementation for agents
 */
export class MemoryAgentCache implements AgentCache {
  private cache: Map<string, AgentCacheEntry> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private defaultTTL: number = 300000) {
    // 5 minutes default
    this.startCleanupInterval();
  }

  async get(key: string): Promise<AgentCacheEntry | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  async set(
    key: string,
    data: any,
    ttl?: number,
    tags?: string[]
  ): Promise<void> {
    const entry: AgentCacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      tags,
    };

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(tags?: string[]): Promise<void> {
    if (tags && tags.length > 0) {
      // Clear only entries with matching tags
      for (const [key, entry] of this.cache) {
        if (entry.tags && entry.tags.some((tag) => tags.includes(tag))) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all entries
      this.cache.clear();
    }
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    missRate: number;
    expiredEntries: number;
  } {
    const totalEntries = this.cache.size;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) {
        expiredEntries++;
      }
    }

    return {
      size: totalEntries,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      missRate: 0,
      expiredEntries,
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key));
  }

  /**
   * Check if an entry has expired
   */
  private isExpired(entry: AgentCacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Cleanup every minute
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

/**
 * No-op cache implementation for testing or when caching is disabled
 */
export class NoOpAgentCache implements AgentCache {
  async get(key: string): Promise<AgentCacheEntry | null> {
    return null;
  }

  async set(
    key: string,
    data: any,
    ttl?: number,
    tags?: string[]
  ): Promise<void> {
    // No-op
  }

  async delete(key: string): Promise<void> {
    // No-op
  }

  async clear(tags?: string[]): Promise<void> {
    // No-op
  }

  async has(key: string): Promise<boolean> {
    return false;
  }
}
