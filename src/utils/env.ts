import { z } from 'zod'
import logger from './logger'

const envSchema = z.object({
  // Required
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Required for production
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Optional services
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // Optional config
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export type Env = z.infer<typeof envSchema>

let validatedEnv: Env | null = null

export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv
  }

  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    logger.error({
      errors: parsed.error.format()
    }, 'Invalid environment variables')
    throw new Error('Environment validation failed')
  }

  validatedEnv = parsed.data

  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      logger.warn('Redis not configured - rate limiting will use in-memory fallback')
    }
    if (!process.env.SENTRY_DSN) {
      logger.warn('Sentry not configured - error monitoring disabled')
    }
  }

  logger.info('Environment variables validated successfully')
  return validatedEnv
}

// Validate on module load (but not in tests)
if (process.env.NODE_ENV !== 'test') {
  validateEnv()
}
