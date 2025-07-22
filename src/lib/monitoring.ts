// import CacheService from './cache' // Currently unused

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number
  lastCheck: Date
  errorCount: number
  successRate: number
}

export class MonitoringService {
  private static services: Map<string, ServiceStatus> = new Map()
  private static checkIntervals: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Initialize monitoring for external services
   */
  static initialize() {
    console.log('🔍 Initializing monitoring service...')
    
    // Monitor external APIs
    this.addService('openai', 'https://api.openai.com/v1/models', 30000)
    this.addService('figma', 'https://api.figma.com/v1/me', 60000)
    this.addService('kupibilet', 'https://lpc.kupibilet.ru/api/v2/health', 45000)
    
    console.log('✅ Monitoring service initialized')
  }

  /**
   * Add a service to monitor
   */
  static addService(name: string, endpoint: string, interval: number = 30000) {
    // Initialize service status
    this.services.set(name, {
      name,
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date(),
      errorCount: 0,
      successRate: 100
    })

    // Start monitoring interval
    const intervalId = setInterval(() => {
      this.checkService(name, endpoint)
    }, interval)

    this.checkIntervals.set(name, intervalId)
    
    // Perform initial check
    this.checkService(name, endpoint)
  }

  /**
   * Check service health
   */
  static async checkService(name: string, endpoint: string): Promise<ServiceStatus> {
    const start = Date.now()
    const service = this.services.get(name) || {
      name,
      status: 'healthy' as const,
      responseTime: 0,
      lastCheck: new Date(),
      errorCount: 0,
      successRate: 100
    }

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'EmailMakers-Monitor/1.0',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      const responseTime = Date.now() - start
      const isSuccess = response.ok

      // Update service status
      service.responseTime = responseTime
      service.lastCheck = new Date()
      
      if (isSuccess) {
        service.status = responseTime > 5000 ? 'degraded' : 'healthy'
        service.successRate = Math.min(100, service.successRate + 1)
      } else {
        service.errorCount++
        service.status = 'degraded'
        service.successRate = Math.max(0, service.successRate - 5)
      }

      this.services.set(name, service)
      console.log(`🔍 ${name}: ${service.status} (${responseTime}ms)`)
      
    } catch (error) {
      service.errorCount++
      service.responseTime = Date.now() - start
      service.lastCheck = new Date()
      service.status = 'down'
      service.successRate = Math.max(0, service.successRate - 10)
      
      this.services.set(name, service)
      console.error(`❌ ${name} check failed:`, error instanceof Error ? error.message : String(error))
    }

    return service
  }

  /**
   * Get all service statuses
   */
  static getAllServices(): ServiceStatus[] {
    return Array.from(this.services.values())
  }

  /**
   * Get system health summary
   */
  static getHealthSummary(): {
    overall: 'healthy' | 'degraded' | 'critical'
    services: ServiceStatus[]
    metrics: {
      totalServices: number
      healthyServices: number
      degradedServices: number
      downServices: number
      averageResponseTime: number
    }
  } {
    const services = this.getAllServices()
    const healthyCount = services.filter(s => s.status === 'healthy').length
    const degradedCount = services.filter(s => s.status === 'degraded').length
    const downCount = services.filter(s => s.status === 'down').length
    const avgResponseTime = services.reduce((sum, s) => sum + s.responseTime, 0) / services.length || 0

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy'
    if (downCount > 0) overall = 'critical'
    else if (degradedCount > 0) overall = 'degraded'

    return {
      overall,
      services,
      metrics: {
        totalServices: services.length,
        healthyServices: healthyCount,
        degradedServices: degradedCount,
        downServices: downCount,
        averageResponseTime: Math.round(avgResponseTime)
      }
    }
  }
}

export default MonitoringService 