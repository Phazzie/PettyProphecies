import mongoose from 'mongoose'
import { enableQueryMonitoring } from '../utils/mongooseLogger'
import logger from '../utils/logger'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in environment variables')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Cache connection in development to prevent multiple connections
declare global {
  var mongooseCache: MongooseCache | undefined
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null }

if (!global.mongooseCache) {
  global.mongooseCache = cached
}

const options = {
  // Connection pool settings
  maxPoolSize: 10,      // Maximum number of connections
  minPoolSize: 5,       // Minimum number of connections to maintain
  maxIdleTimeMS: 30000, // Close idle connections after 30s

  // Timeout settings
  serverSelectionTimeoutMS: 5000,  // Timeout after 5s
  socketTimeoutMS: 45000,          // Close sockets after 45s

  // Automatic reconnection
  retryWrites: true,
  retryReads: true,

  // Buffer commands
  bufferCommands: false,  // Fail fast if not connected
}

export async function connectToDatabase() {
  if (cached.conn) {
    enableQueryMonitoring()  // Enable after connection
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, options).then((mongoose) => {
      logger.info('MongoDB connected successfully')
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
    enableQueryMonitoring()  // Enable monitoring
  } catch (error) {
    cached.promise = null
    logger.error({ error }, 'MongoDB connection error')
    throw error
  }

  return cached.conn
}

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB')
})

mongoose.connection.on('error', (err) => {
  logger.error({ error: err }, 'Mongoose connection error')
})

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close()
  logger.info('Mongoose connection closed through app termination')
  process.exit(0)
})
