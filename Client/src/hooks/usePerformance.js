import { useEffect, useCallback } from "react"
import { performanceService, memoryService } from "../services/cacheService"

export function usePerformance(label) {
  const measureStart = useCallback(() => {
    performanceService.measureStart(label)
  }, [label])

  const measureEnd = useCallback(() => {
    const duration = performanceService.measureEnd(label)
    if (duration) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
    }
    return duration
  }, [label])

  return { measureStart, measureEnd }
}

export function usePerformanceMetrics() {
  return useCallback(() => {
    return performanceService.getAllMetrics()
  }, [])
}

export function useMemoryOptimization() {
  useEffect(() => {
    // Run memory optimization every 5 minutes
    const interval = setInterval(
      () => {
        memoryService.snapshot()
        memoryService.optimizeMemory()
      },
      5 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [])
}
