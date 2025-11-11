/**
 * PasswordReset Model
 *
 * Mongoose model for password reset tokens
 * Implements secure token storage with automatic expiration
 */

import mongoose from "mongoose"

/**
 * PasswordReset document interface
 * Extends mongoose.Document for proper typing
 */
export interface IPasswordReset extends mongoose.Document {
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

/**
 * PasswordReset schema definition
 * Includes indexes for optimized queries
 */
const passwordResetSchema = new mongoose.Schema({
  /**
   * User ID associated with this reset request
   * Indexed for fast lookup of all resets for a user
   */
  userId: {
    type: String,
    required: true,
    index: true,
  },

  /**
   * Secure random token for password reset
   * Unique constraint prevents token duplication
   * Indexed for fast lookup during reset verification
   */
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  /**
   * Expiration timestamp for this reset token
   * Indexed for efficient cleanup queries
   */
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },

  /**
   * Creation timestamp
   * Automatically set on document creation
   */
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

/**
 * Create compound index for efficient queries
 * Useful for finding valid tokens for a specific user
 */
passwordResetSchema.index({ userId: 1, expiresAt: 1 })

/**
 * Create TTL index to automatically delete expired tokens
 * MongoDB will automatically remove documents after expiresAt
 */
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

/**
 * Index for creation timestamp queries
 * Useful for auditing and cleanup operations
 */
passwordResetSchema.index({ createdAt: 1 })

/**
 * Export the PasswordReset model
 * Use existing model if already compiled (prevents recompilation errors)
 */
export const PasswordReset =
  (mongoose.models.PasswordReset as mongoose.Model<IPasswordReset>) ||
  mongoose.model<IPasswordReset>("PasswordReset", passwordResetSchema)
