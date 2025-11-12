const ERROR_THRESHOLD = 5
const TIME_WINDOW = 60000 // 1 minute

class LogAnalyzer {
  private errorCount = 0
  private lastResetTime: number = Date.now()

  analyzeLog(level: string, message: string, meta: any) {
    if (level === "error") {
      this.errorCount++

      if (Date.now() - this.lastResetTime > TIME_WINDOW) {
        this.resetErrorCount()
      }

      if (this.errorCount >= ERROR_THRESHOLD) {
        this.triggerAlert(message, meta)
      }
    }
  }

  private resetErrorCount() {
    this.errorCount = 0
    this.lastResetTime = Date.now()
  }

  private triggerAlert(message: string, meta: any) {
    // In a real-world scenario, you might want to send an email, SMS, or integrate with a service like PagerDuty
    // Avoid circular dependency by using console directly
    console.error("ALERT: High error rate detected", { message, meta })
  }
}

export const logAnalyzer = new LogAnalyzer()

