import { logAnalyzer } from "./logAnalyzer"

type LogLevel = "error" | "warn" | "info" | "debug"

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info"
const currentLevelValue = LOG_LEVELS[currentLevel]

function formatLog(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString()
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ""
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= currentLevelValue
}

// Simple console-based logger for Next.js
const wrappedLogger = {
  error: (message: string, meta?: any) => {
    if (shouldLog("error")) {
      logAnalyzer.analyzeLog("error", message, meta)
      console.error(formatLog("error", message, meta))
    }
  },
  warn: (message: string, meta?: any) => {
    if (shouldLog("warn")) {
      logAnalyzer.analyzeLog("warn", message, meta)
      console.warn(formatLog("warn", message, meta))
    }
  },
  info: (message: string, meta?: any) => {
    if (shouldLog("info")) {
      logAnalyzer.analyzeLog("info", message, meta)
      console.info(formatLog("info", message, meta))
    }
  },
  debug: (message: string, meta?: any) => {
    if (shouldLog("debug")) {
      logAnalyzer.analyzeLog("debug", message, meta)
      console.debug(formatLog("debug", message, meta))
    }
  },
}

export default wrappedLogger

