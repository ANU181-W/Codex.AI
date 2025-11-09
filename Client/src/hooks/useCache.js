import { useCallback, useEffect } from "react"
import { cacheService } from "../services/cacheService"

export function useCache(key, fetcher, options = {}) {
  const { ttl = 5 * 60 * 1000, manual = false, dependencies = [] } = options

  const getCachedOrFetch = useCallback(async () => {
    // Check cache first
    const cached = cacheService.get(key)
    if (cached) {
      console.log(`[Cache] Hit for key: ${key}`)
      return cached
    }

    // Fetch if not cached
    console.log(`[Cache] Miss for key: ${key}`)
    const result = await fetcher()
    cacheService.set(key, result, ttl)
    return result
  }, [key, fetcher, ttl])

  useEffect(() => {
    if (!manual) {
      getCachedOrFetch()
    }
  }, dependencies)

  return getCachedOrFetch
}

export function useCacheInvalidate(key) {
  return useCallback(() => {
    cacheService.delete(key)
    console.log(`[Cache] Invalidated key: ${key}`)
  }, [key])
}

export function useCacheStats() {
  return useCallback(() => {
    return cacheService.getStats()
  }, [])
}
