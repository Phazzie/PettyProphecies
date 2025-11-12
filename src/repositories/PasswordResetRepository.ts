/**
 * PasswordResetRepository
 *
 * Repository implementation for PasswordReset model
 * Implements IPasswordResetRepository interface from seams
 * Handles secure token generation and validation
 */

import crypto from "crypto"
import { IPasswordResetRepository, IPasswordReset, QueryOptions } from "@/src/interfaces/seams"
import { PasswordReset } from "@/src/models/PasswordReset"

/**
 * Token expiry duration in milliseconds (1 hour)
 */
const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

/**
 * Token byte length for cryptographic security (32 bytes = 64 hex characters)
 */
const TOKEN_BYTES = 32

/**
 * PasswordResetRepository class
 * Implements repository pattern for PasswordReset model
 * Handles all database operations for password reset tokens
 */
export class PasswordResetRepository implements IPasswordResetRepository {
  /**
   * Create a new password reset request
   * Generates cryptographically secure random token
   * Sets expiry to 1 hour from creation
   * @param userId - User ID requesting password reset
   * @returns Object containing token and expiry date
   */
  async createResetRequest(userId: string): Promise<{ token: string; expiresAt: Date }> {
    // Generate cryptographically secure random token
    const token = crypto.randomBytes(TOKEN_BYTES).toString("hex")

    // Set expiry to 1 hour from now
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS)

    // Create and save password reset document
    const passwordReset = new PasswordReset({
      userId,
      token,
      expiresAt,
    })

    await passwordReset.save()

    return {
      token,
      expiresAt,
    }
  }

  /**
   * Find valid (non-expired) password reset token
   * @param token - Reset token
   * @returns PasswordReset document or null if not found or expired
   */
  async findValidToken(token: string): Promise<IPasswordReset | null> {
    return await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() }, // Only find non-expired tokens
    })
  }

  /**
   * Invalidate all password reset tokens for a user
   * Useful after successful password reset or for security
   * @param userId - User ID
   */
  async invalidateUserTokens(userId: string): Promise<void> {
    await PasswordReset.deleteMany({ userId })
  }

  /**
   * Find password reset by ID
   * @param id - PasswordReset ID
   * @returns PasswordReset document or null if not found
   */
  async findById(id: string): Promise<IPasswordReset | null> {
    return await PasswordReset.findById(id)
  }

  /**
   * Find one password reset matching query
   * @param query - MongoDB query object
   * @returns PasswordReset document or null if not found
   */
  async findOne(query: Record<string, any>): Promise<IPasswordReset | null> {
    return await PasswordReset.findOne(query)
  }

  /**
   * Find multiple password resets matching query
   * @param query - MongoDB query object
   * @param options - Query options (limit, skip, sort)
   * @returns Array of PasswordReset documents
   */
  async findMany(query: Record<string, any>, options?: QueryOptions): Promise<IPasswordReset[]> {
    let queryBuilder = PasswordReset.find(query)

    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options.limit)
    }

    if (options?.skip !== undefined) {
      queryBuilder = queryBuilder.skip(options.skip)
    }

    if (options?.sort) {
      queryBuilder = queryBuilder.sort(options.sort)
    }

    return await queryBuilder.lean() as unknown as IPasswordReset[]
  }

  /**
   * Create new password reset
   * Note: For creating reset requests, use createResetRequest() instead
   * This is a low-level method for direct document creation
   * @param data - PasswordReset data
   * @returns Created PasswordReset document
   */
  async create(data: Partial<IPasswordReset>): Promise<IPasswordReset> {
    const passwordReset = new PasswordReset(data)
    return await passwordReset.save() as unknown as IPasswordReset
  }

  /**
   * Update password reset by ID
   * @param id - PasswordReset ID
   * @param data - Updated data
   * @returns Updated PasswordReset document or null if not found
   */
  async update(id: string, data: Partial<IPasswordReset>): Promise<IPasswordReset | null> {
    return await PasswordReset.findByIdAndUpdate(id, data, { new: true })
  }

  /**
   * Delete password reset by ID
   * @param id - PasswordReset ID
   * @returns true if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const result = await PasswordReset.findByIdAndDelete(id)
    return result !== null
  }
}
