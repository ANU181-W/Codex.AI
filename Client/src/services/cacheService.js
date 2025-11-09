export const cacheService = {
  // Cache storage with TTL support
  cache: new Map(),
  timers: new Map(),

  // Set cache with optional TTL (in milliseconds)
  set: (key, value, ttl = null) => {
    // Clear existing timer if any
    if (cacheService.timers.has(key)) {
      clearTimeout(cacheService.timers.get(key))
    }

    cacheService.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    })

    // Set TTL expiration if specified
    if (ttl) {
      const timer = setTimeout(() => {
        cacheService.cache.delete(key)
        cacheService.timers.delete(key)
      }, ttl)
      cacheService.timers.set(key, timer)
    }
  },

  // Get value from cache
  get: (key) => {
    const entry = cacheService.cache.get(key)
    if (!entry) return null

    const { value, ttl, timestamp } = entry
    if (ttl && Date.now() - timestamp > ttl) {
      cacheService.cache.delete(key)
      cacheService.timers.delete(key)
      return null
    }

    return value
  },

  // Check if key exists in cache
  has: (key) => {
    return cacheService.get(key) !== null
  },

  // Clear specific cache entry
  delete: (key) => {
    cacheService.cache.delete(key)
    if (cacheService.timers.has(key)) {
      clearTimeout(cacheService.timers.get(key))
      cacheService.timers.delete(key)
    }
  },

  // Clear all cache entries
  clear: () => {
    cacheService.timers.forEach((timer) => clearTimeout(timer))
    cacheService.cache.clear()
    cacheService.timers.clear()
  },

  // Get cache statistics
  getStats: () => {
    const stats = {
      size: cacheService.cache.size,
      entries: Array.from(cacheService.cache.entries()).map(([key, entry]) => ({
        key,
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        ageMs: Date.now() - entry.timestamp,
      })),
      totalMemory: 0,
    }

    stats.entries.forEach((entry) => {
      // Rough estimation of memory usage
      stats.totalMemory += entry.key.length * 2
    })

    return stats
  },

  // Cache file analysis results
  cacheFileAnalysis: (fileHash, result, ttl = 30 * 60 * 1000) => {
    const cacheKey = `analysis:${fileHash}`
    cacheService.set(cacheKey, result, ttl)
    return cacheKey
  },

  // Get cached file analysis
  getCachedAnalysis: (fileHash) => {
    const cacheKey = `analysis:${fileHash}`
    return cacheService.get(cacheKey)
  },

  // Cache scan results
  cacheScanResults: (scanId, results, ttl = 60 * 60 * 1000) => {
    const cacheKey = `scan:${scanId}`
    cacheService.set(cacheKey, results, ttl)
    return cacheKey
  },

  // Get cached scan results
  getCachedScanResults: (scanId) => {
    const cacheKey = `scan:${scanId}`
    return cacheService.get(cacheKey)
  },
}

export const performanceService = {
  // Track performance metrics
  metrics: {
    startTimes: new Map(),
    durations: new Map(),
    callCounts: new Map(),
  },

  // Start performance measurement
  measureStart: (label) => {
    performanceService.metrics.startTimes.set(label, performance.now())
  },

  // End performance measurement
  measureEnd: (label) => {
    const startTime = performanceService.metrics.startTimes.get(label)
    if (!startTime) {
      console.warn(`[Performance] No start time found for label: ${label}`)
      return null
    }

    const duration = performance.now() - startTime
    performanceService.metrics.startTimes.delete(label)

    // Track durations
    if (!performanceService.metrics.durations.has(label)) {
      performanceService.metrics.durations.set(label, [])
    }
    performanceService.metrics.durations.get(label).push(duration)

    // Track call counts
    performanceService.metrics.callCounts.set(label, (performanceService.metrics.callCounts.get(label) || 0) + 1)

    return duration
  },

  // Get performance metrics for a label
  getMetrics: (label) => {
    const durations = performanceService.metrics.durations.get(label) || []
    if (durations.length === 0) return null

    const sorted = [...durations].sort((a, b) => a - b)
    const sum = durations.reduce((a, b) => a + b, 0)
    const avg = sum / durations.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const min = sorted[0]
    const max = sorted[sorted.length - 1]

    return {
      label,
      callCount: performanceService.metrics.callCounts.get(label),
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      median: Math.round(median * 100) / 100,
      total: Math.round(sum * 100) / 100,
    }
  },

  // Get all performance metrics
  getAllMetrics: () => {
    const labels = Array.from(performanceService.metrics.durations.keys())
    return labels.map((label) => performanceService.getMetrics(label))
  },

  // Clear performance metrics
  clearMetrics: () => {
    performanceService.metrics.startTimes.clear()
    performanceService.metrics.durations.clear()
    performanceService.metrics.callCounts.clear()
  },

  // Detect performance bottlenecks
  detectBottlenecks: () => {
    const allMetrics = performanceService.getAllMetrics()
    return allMetrics
      .filter((m) => m !== null)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  },
}

export const lazyLoadService = {
  // Lazy load file content
  lazyLoadFile: async (file, chunkSize = 10000) => {
    const chunks = []
    let offset = 0

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize)
      const text = await chunk.text()
      chunks.push(text)
      offset += chunkSize
    }

    return chunks.join("")
  },

  // Process large arrays with pagination
  processPaginatedArray: (array, pageSize, processor) => {
    const results = []
    for (let i = 0; i < array.length; i += pageSize) {
      const page = array.slice(i, i + pageSize)
      results.push(processor(page, Math.floor(i / pageSize)))
    }
    return results
  },

  // Debounce function calls
  debounce: (func, delay) => {
    let timeoutId

    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
      }, delay)
    }
  },

  // Throttle function calls
  throttle: (func, limit) => {
    let inThrottle
    return (...args) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  },
}

export const memoryService = {
  // Monitor memory usage trends
  memorySnapshots: [],

  // Take memory snapshot
  snapshot: () => {
    const timestamp = Date.now()
    const cacheStats = cacheService.getStats()
    const performanceMetrics = performanceService.getAllMetrics()

    const snapshot = {
      timestamp,
      cacheSize: cacheStats.size,
      cacheMemory: cacheStats.totalMemory,
      metricCount: performanceMetrics.length,
    }

    memoryService.memorySnapshots.push(snapshot)

    // Keep only last 100 snapshots
    if (memoryService.memorySnapshots.length > 100) {
      memoryService.memorySnapshots.shift()
    }

    return snapshot
  },

  // Get memory trends
  getMemoryTrends: () => {
    if (memoryService.memorySnapshots.length < 2) {
      return null
    }

    const snapshots = memoryService.memorySnapshots
    const latest = snapshots[snapshots.length - 1]
    const previous = snapshots[snapshots.length - 2]

    return {
      cacheSizeTrend: latest.cacheSize - previous.cacheSize,
      cacheMemoryTrend: latest.cacheMemory - previous.cacheMemory,
      isIncreasing: latest.cacheMemory > previous.cacheMemory,
    }
  },

  // Optimize memory by clearing old cache entries
  optimizeMemory: () => {
    const stats = cacheService.getStats()
    const entries = stats.entries

    // Remove entries older than 1 hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    entries.forEach((entry) => {
      if (entry.timestamp < oneHourAgo) {
        cacheService.delete(entry.key)
      }
    })
  },
}

export default {
  cacheService,
  performanceService,
  lazyLoadService,
  memoryService,
}
