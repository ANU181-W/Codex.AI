const crypto = require('crypto');

class Cache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 1000; // Maximum number of entries
        this.ttl = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.hits = 0;
        this.misses = 0;
    }

    hashContent(content) {
        return crypto
            .createHash('sha256')
            .update(typeof content === 'string' ? content : JSON.stringify(content))
            .digest('hex');
    }

    async get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            this.misses++;
            return null;
        }

        // Check if the item has expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        return item.value;
    }

    async set(key, value) {
        // If cache is full, remove the oldest entry
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            value,
            expiry: Date.now() + this.ttl,
            createdAt: Date.now()
        });
    }

    async invalidate(key) {
        return this.cache.delete(key);
    }

    async clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits / (this.hits + this.misses || 1),
            keys: Array.from(this.cache.keys())
        };
    }

    // Utility methods for managing cache entries
    async invalidateByPattern(pattern) {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    async touch(key) {
        const item = this.cache.get(key);
        if (item) {
            item.expiry = Date.now() + this.ttl;
            return true;
        }
        return false;
    }

    async has(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    async getMultiple(keys) {
        const results = new Map();
        for (const key of keys) {
            const value = await this.get(key);
            if (value !== null) {
                results.set(key, value);
            }
        }
        return results;
    }

    async setMultiple(entries) {
        for (const [key, value] of entries) {
            await this.set(key, value);
        }
    }
}

// Create a singleton instance
const cacheInstance = new Cache();

module.exports = {
    Cache,
    cache: cacheInstance,  // Export singleton instance
};