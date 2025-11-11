/**
 * UserRepository
 *
 * Repository implementation for User model
 * Implements IUserRepository interface from seams
 * Provides data access layer with proper error handling
 */

import { IUserRepository, IUser, QueryOptions } from "@/src/interfaces/seams"
import { User } from "@/src/models/User"
import { ConflictError, NotFoundError } from "@/src/interfaces/seams"

/**
 * UserRepository class
 * Implements repository pattern for User model
 * Handles all database operations for users
 */
export class UserRepository implements IUserRepository {
  /**
   * Find user by ID
   * @param id - User ID
   * @returns User document or null if not found
   */
  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id)
  }

  /**
   * Find user by email (case-insensitive)
   * @param email - User email
   * @returns User document or null if not found
   */
  async findByEmail(email: string): Promise<IUser | null> {
    // Normalize email to lowercase for case-insensitive search
    const normalizedEmail = email.toLowerCase()
    return await User.findOne({ email: normalizedEmail })
  }

  /**
   * Find user by username (case-insensitive)
   * @param username - Username
   * @returns User document or null if not found
   */
  async findByUsername(username: string): Promise<IUser | null> {
    // Normalize username to lowercase for case-insensitive search
    const normalizedUsername = username.toLowerCase()
    return await User.findOne({ username: normalizedUsername })
  }

  /**
   * Find one user matching query
   * @param query - MongoDB query object
   * @returns User document or null if not found
   */
  async findOne(query: Record<string, any>): Promise<IUser | null> {
    return await User.findOne(query)
  }

  /**
   * Find multiple users matching query
   * @param query - MongoDB query object
   * @param options - Query options (limit, skip, sort)
   * @returns Array of user documents
   */
  async findMany(query: Record<string, any>, options?: QueryOptions): Promise<IUser[]> {
    let queryBuilder = User.find(query)

    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options.limit)
    }

    if (options?.skip !== undefined) {
      queryBuilder = queryBuilder.skip(options.skip)
    }

    if (options?.sort) {
      queryBuilder = queryBuilder.sort(options.sort)
    }

    return await queryBuilder
  }

  /**
   * Create new user
   * Handles duplicate email/username errors with proper error messages
   * @param data - User data
   * @returns Created user document
   * @throws ConflictError if email or username already exists
   */
  async create(data: Partial<IUser>): Promise<IUser> {
    try {
      const user = new User(data)
      return await user.save()
    } catch (error: any) {
      // Handle duplicate key error (E11000)
      if (error.code === 11000) {
        // Check which field caused the duplicate
        if (error.keyPattern?.email) {
          throw new ConflictError("User with this email already exists")
        }
        if (error.keyPattern?.username) {
          throw new ConflictError("User with this username already exists")
        }
        throw new ConflictError("User already exists")
      }
      // Propagate other errors
      throw error
    }
  }

  /**
   * Update user by ID
   * @param id - User ID
   * @param data - Updated user data
   * @returns Updated user document or null if not found
   */
  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, data, { new: true })
  }

  /**
   * Delete user by ID
   * @param id - User ID
   * @returns true if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id)
    return result !== null
  }

  /**
   * Verify user password
   * Uses comparePassword method from User model
   * @param userId - User ID
   * @param password - Plain text password to verify
   * @returns true if password matches, false otherwise
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await User.findById(userId)
    if (!user) {
      return false
    }

    return await user.comparePassword(password)
  }

  /**
   * Update user password
   * Password will be hashed automatically by pre-save hook
   * @param userId - User ID
   * @param newPassword - New plain text password
   * @throws NotFoundError if user not found
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError("User")
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = newPassword
    await user.save()
  }
}
