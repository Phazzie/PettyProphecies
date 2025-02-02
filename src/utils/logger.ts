import winston from "winston"
import { logAnalyzer } from "./logAnalyzer"

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "passive-aggressive-tarot" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
})

// If we're not in production, log to the console with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  )
}

// Wrap the logger methods to include log analysis
const wrappedLogger = {
  error: (message: string, meta?: any) => {
    logAnalyzer.analyzeLog("error", message, meta)
    logger.error(message, meta)
  },
  warn: (message: string, meta?: any) => {
    logAnalyzer.analyzeLog("warn", message, meta)
    logger.warn(message, meta)
  },
  info: (message: string, meta?: any) => {
    logAnalyzer.analyzeLog("info", message, meta)
    logger.info(message, meta)
  },
  debug: (message: string, meta?: any) => {
    logAnalyzer.analyzeLog("debug", message, meta)
    logger.debug(message, meta)
  },
}

export default wrappedLogger

