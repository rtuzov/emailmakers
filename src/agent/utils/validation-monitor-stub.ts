// Stub for ValidationMonitor functionality - moved to useless
export class ValidationMonitor {
  static getInstance(): ValidationMonitor {
    return new ValidationMonitor();
  }

  track(event: string, data: any): void {
    console.log(`Validation event: ${event}`, data);
  }

  recordValidation(data: any): void {
    console.log('Recording validation:', data);
  }

  recordCorrection(data: any): void {
    console.log('Recording correction:', data);
  }

  getMetrics(): any {
    return {};
  }
} 