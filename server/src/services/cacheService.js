/**
 * Cache Service for AI Hair Simulation
 *
 * Caches generated images to reduce API costs and improve response times.
 * Uses in-memory cache with optional Redis support for production.
 *
 * Benefits:
 * - Reduces AI API calls for duplicate requests (saves ~$0.01-0.05 per cached hit)
 * - Instant response for cached results (~50ms vs ~10-30s for AI generation)
 * - Reduces server load and queue congestion
 */

const crypto = require('crypto');

class CacheService {
  constructor() {
    // In-memory cache as fallback/default
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      saves: 0
    };

    // Cache settings
    this.maxCacheSize = 1000; // Maximum entries in memory cache
    this.defaultTTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    // Redis client (optional, for production scaling)
    this.redis = null;
    this.useRedis = false;

    // Initialize Redis if available
    this.initRedis();
  }

  async initRedis() {
    if (process.env.REDIS_URL) {
      try {
        const Redis = require('ioredis');
        this.redis = new Redis(process.env.REDIS_URL);

        this.redis.on('connect', () => {
          console.log('✓ Redis cache connected');
          this.useRedis = true;
        });

        this.redis.on('error', (err) => {
          console.warn('Redis connection error, falling back to memory cache:', err.message);
          this.useRedis = false;
        });
      } catch (err) {
        console.log('Redis not available, using memory cache');
      }
    } else {
      console.log('✓ Cache Service initialized (memory mode)');
    }
  }

  /**
   * Generate a unique cache key based on generation parameters
   */
  generateCacheKey(params) {
    const { imageHash, haircut, hairColor, aiModel, gender } = params;

    // Create a normalized string of parameters
    const keyString = JSON.stringify({
      img: imageHash,
      style: (haircut || '').toLowerCase().trim(),
      color: (hairColor || '').toLowerCase().trim(),
      model: (aiModel || 'replicate').toLowerCase(),
      gender: (gender || 'male').toLowerCase()
    });

    // Generate MD5 hash for compact key
    return `hair_sim:${crypto.createHash('md5').update(keyString).digest('hex')}`;
  }

  /**
   * Generate a hash of the input image for cache key
   */
  generateImageHash(imageBase64) {
    // Use first 10000 chars + last 10000 chars for faster hashing of large images
    const sample = imageBase64.length > 20000
      ? imageBase64.substring(0, 10000) + imageBase64.substring(imageBase64.length - 10000)
      : imageBase64;

    return crypto.createHash('md5').update(sample).digest('hex');
  }

  /**
   * Get cached result
   */
  async get(cacheKey) {
    try {
      let result = null;

      if (this.useRedis && this.redis) {
        // Try Redis first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          result = JSON.parse(cached);
        }
      } else {
        // Use memory cache
        const cached = this.memoryCache.get(cacheKey);
        if (cached && cached.expiry > Date.now()) {
          result = cached.data;
        } else if (cached) {
          // Expired, remove it
          this.memoryCache.delete(cacheKey);
        }
      }

      if (result) {
        this.cacheStats.hits++;
        console.log(`Cache HIT: ${cacheKey.substring(0, 20)}... (Total hits: ${this.cacheStats.hits})`);
      } else {
        this.cacheStats.misses++;
      }

      return result;
    } catch (err) {
      console.error('Cache get error:', err.message);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Store result in cache
   */
  async set(cacheKey, data, ttlMs = this.defaultTTL) {
    try {
      if (this.useRedis && this.redis) {
        // Store in Redis with TTL
        await this.redis.setex(
          cacheKey,
          Math.floor(ttlMs / 1000), // Redis uses seconds
          JSON.stringify(data)
        );
      } else {
        // Store in memory cache
        // Clean up if cache is too large
        if (this.memoryCache.size >= this.maxCacheSize) {
          this.cleanupMemoryCache();
        }

        this.memoryCache.set(cacheKey, {
          data,
          expiry: Date.now() + ttlMs,
          createdAt: Date.now()
        });
      }

      this.cacheStats.saves++;
      console.log(`Cache SAVE: ${cacheKey.substring(0, 20)}... (Total saves: ${this.cacheStats.saves})`);
      return true;
    } catch (err) {
      console.error('Cache set error:', err.message);
      return false;
    }
  }

  /**
   * Check if a generation is cached
   */
  async isCached(params) {
    const imageHash = this.generateImageHash(params.imageBase64);
    const cacheKey = this.generateCacheKey({
      imageHash,
      haircut: params.haircut,
      hairColor: params.hairColor,
      aiModel: params.aiModel,
      gender: params.gender
    });

    const result = await this.get(cacheKey);
    return {
      isCached: !!result,
      cacheKey,
      imageHash,
      cachedData: result
    };
  }

  /**
   * Cache a generation result
   */
  async cacheGeneration(params, resultImageUrl) {
    const imageHash = params.imageHash || this.generateImageHash(params.imageBase64);
    const cacheKey = this.generateCacheKey({
      imageHash,
      haircut: params.haircut,
      hairColor: params.hairColor,
      aiModel: params.aiModel,
      gender: params.gender
    });

    const cacheData = {
      resultImageUrl,
      haircut: params.haircut,
      hairColor: params.hairColor,
      aiModel: params.aiModel,
      cachedAt: new Date().toISOString()
    };

    return await this.set(cacheKey, cacheData);
  }

  /**
   * Clean up oldest entries from memory cache
   */
  cleanupMemoryCache() {
    const entries = Array.from(this.memoryCache.entries());

    // Sort by creation time (oldest first)
    entries.sort((a, b) => a[1].createdAt - b[1].createdAt);

    // Remove oldest 20% of entries
    const removeCount = Math.floor(this.maxCacheSize * 0.2);
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      this.memoryCache.delete(entries[i][0]);
    }

    console.log(`Cache cleanup: removed ${removeCount} old entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(1)
      : 0;

    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      memoryCacheSize: this.memoryCache.size,
      usingRedis: this.useRedis,
      estimatedSavings: `$${(this.cacheStats.hits * 0.02).toFixed(2)}` // Estimate ~$0.02 per AI call
    };
  }

  /**
   * Clear all cache (admin use only)
   */
  async clearAll() {
    if (this.useRedis && this.redis) {
      const keys = await this.redis.keys('hair_sim:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
    this.memoryCache.clear();
    console.log('Cache cleared');
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
