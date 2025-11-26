/**
 * Redis Cache Adapter
 * Implements the same interface as cache.service.js but uses Redis (ioredis)
 * Falls back to in-memory cache if Redis is unavailable
 */

const Redis = require('ioredis');
const crypto = require('crypto');

class RedisAdapter {
  constructor() {
    this.redis = null;
    this.fallbackCache = new Map(); // In-memory fallback
    this.isRedisAvailable = false;
    this.maxSize = 1000;
    this.ttl = 24 * 60 * 60; // 24 hours in seconds
    this.hits = 0;
    this.misses = 0;
    this.initialized = false;
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    if (this.initialized) return;

    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.warn('RedisAdapter: REDIS_URL not configured, using in-memory fallback');
      this.initialized = true;
      return;
    }

    try {
      // Parse Redis URL (supports redis:// and rediss:// for TLS)
      this.redis = new Redis(redisUrl, {
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          console.warn('RedisAdapter: Reconnect on error:', err.message);
          return true;
        }
      });

      this.redis.on('connect', () => {
        console.log('RedisAdapter: Connected to Redis');
        this.isRedisAvailable = true;
      });

      this.redis.on('error', (err) => {
        console.error('RedisAdapter: Redis error:', err.message);
        this.isRedisAvailable = false;
      });

      this.redis.on('close', () => {
        console.warn('RedisAdapter: Redis connection closed');
        this.isRedisAvailable = false;
      });

      // Test connection
      await this.redis.ping();
      this.isRedisAvailable = true;
      console.log('RedisAdapter: Initialized successfully');
    } catch (error) {
      console.error('RedisAdapter: Initialization failed, using fallback:', error.message);
      this.isRedisAvailable = false;
    }

    this.initialized = true;
  }

  /**
   * Hash content for cache key
   */
  hashContent(content) {
    return crypto
      .createHash('sha256')
      .update(typeof content === 'string' ? content : JSON.stringify(content))
      .digest('hex');
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>}
   */
  async get(key) {
    await this.initialize();

    if (this.isRedisAvailable && this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          this.hits++;
          return JSON.parse(value);
        }
        this.misses++;
        return null;
      } catch (error) {
        console.error('RedisAdapter: Get failed, falling back to memory:', error.message);
        this.isRedisAvailable = false;
      }
    }

    // Fallback to in-memory
    const item = this.fallbackCache.get(key);
    if (!item) {
      this.misses++;
      return null;
    }

    if (Date.now() > item.expiry) {
      this.fallbackCache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - TTL in seconds (optional)
   * @returns {Promise<void>}
   */
  async set(key, value, ttl = this.ttl) {
    await this.initialize();

    if (this.isRedisAvailable && this.redis) {
      try {
        const serialized = JSON.stringify(value);
        await this.redis.setex(key, ttl, serialized);
        return;
      } catch (error) {
        console.error('RedisAdapter: Set failed, falling back to memory:', error.message);
        this.isRedisAvailable = false;
      }
    }

    // Fallback to in-memory
    if (this.fallbackCache.size >= this.maxSize) {
      const oldestKey = this.fallbackCache.keys().next().value;
      this.fallbackCache.delete(oldestKey);
    }

    this.fallbackCache.set(key, {
      value,
      expiry: Date.now() + (ttl * 1000),
      createdAt: Date.now()
    });
  }

  /**
   * Invalidate cache key
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async invalidate(key) {
    await this.initialize();

    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.del(key);
        return true;
      } catch (error) {
        console.error('RedisAdapter: Invalidate failed:', error.message);
      }
    }

    return this.fallbackCache.delete(key);
  }

  /**
   * Clear all cache
   * @returns {Promise<void>}
   */
  async clear() {
    await this.initialize();

    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.flushdb();
      } catch (error) {
        console.error('RedisAdapter: Clear failed:', error.message);
      }
    }

    this.fallbackCache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>}
   */
  async getStats() {
    await this.initialize();

    const stats = {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses || 1),
      backend: this.isRedisAvailable ? 'redis' : 'memory',
      memorySize: this.fallbackCache.size,
      maxSize: this.maxSize
    };

    if (this.isRedisAvailable && this.redis) {
      try {
        const info = await this.redis.info('stats');
        const dbSize = await this.redis.dbsize();
        stats.redisKeys = dbSize;
        stats.redisInfo = info;
      } catch (error) {
        console.error('RedisAdapter: Stats failed:', error.message);
      }
    }

    return stats;
  }

  /**
   * Invalidate keys by pattern (Redis only)
   * @param {string} pattern - Redis pattern (e.g., 'project:*')
   * @returns {Promise<number>} Number of deleted keys
   */
  async invalidateByPattern(pattern) {
    await this.initialize();

    if (this.isRedisAvailable && this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          return keys.length;
        }
        return 0;
      } catch (error) {
        console.error('RedisAdapter: InvalidateByPattern failed:', error.message);
        return 0;
      }
    }

    // Fallback: delete from in-memory cache
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;
    for (const key of this.fallbackCache.keys()) {
      if (regex.test(key)) {
        this.fallbackCache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Touch key to extend TTL
   * @param {string} key - Cache key
   * @param {number} ttl - New TTL in seconds
   * @returns {Promise<boolean>}
   */
  async touch(key, ttl = this.ttl) {
    await this.initialize();

    if (this.isRedisAvailable && this.redis) {
      try {
        const result = await this.redis.expire(key, ttl);
        return result === 1;
      } catch (error) {
        console.error('RedisAdapter: Touch failed:', error.message);
      }
    }

    // Fallback
    const item = this.fallbackCache.get(key);
    if (item) {
      item.expiry = Date.now() + (ttl * 1000);
      return true;
    }
    return false;
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async has(key) {
    await this.initialize();

    if (this.isRedisAvailable && this.redis) {
      try {
        const exists = await this.redis.exists(key);
        return exists === 1;
      } catch (error) {
        console.error('RedisAdapter: Has failed:', error.message);
      }
    }

    // Fallback
    const item = this.fallbackCache.get(key);
    if (!item) return false;
    if (Date.now() > item.expiry) {
      this.fallbackCache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get multiple keys
   * @param {string[]} keys - Array of cache keys
   * @returns {Promise<Map>}
   */
  async getMultiple(keys) {
    await this.initialize();

    const results = new Map();

    if (this.isRedisAvailable && this.redis) {
      try {
        const values = await this.redis.mget(...keys);
        keys.forEach((key, index) => {
          if (values[index]) {
            results.set(key, JSON.parse(values[index]));
          }
        });
        return results;
      } catch (error) {
        console.error('RedisAdapter: GetMultiple failed:', error.message);
      }
    }

    // Fallback
    for (const key of keys) {
      const value = await this.get(key);
      if (value !== null) {
        results.set(key, value);
      }
    }
    return results;
  }

  /**
   * Set multiple keys
   * @param {Array<[string, any]>} entries - Array of [key, value] tuples
   * @param {number} ttl - TTL in seconds
   * @returns {Promise<void>}
   */
  async setMultiple(entries, ttl = this.ttl) {
    await this.initialize();

    if (this.isRedisAvailable && this.redis) {
      try {
        const pipeline = this.redis.pipeline();
        for (const [key, value] of entries) {
          const serialized = JSON.stringify(value);
          pipeline.setex(key, ttl, serialized);
        }
        await pipeline.exec();
        return;
      } catch (error) {
        console.error('RedisAdapter: SetMultiple failed:', error.message);
      }
    }

    // Fallback
    for (const [key, value] of entries) {
      await this.set(key, value, ttl);
    }
  }

  /**
   * Check if Redis is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    await this.initialize();
    return this.isRedisAvailable;
  }

  /**
   * Gracefully disconnect
   */
  async disconnect() {
    if (this.redis) {
      try {
        await this.redis.quit();
        console.log('RedisAdapter: Disconnected');
      } catch (error) {
        console.error('RedisAdapter: Disconnect error:', error.message);
      }
    }
  }
}

// Export singleton instance
module.exports = new RedisAdapter();
