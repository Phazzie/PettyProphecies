/**
 * ReadingRepository
 *
 * Repository implementation for Reading model
 * Implements IReadingRepository interface from seams
 * Provides data access layer for tarot readings
 */

import { IReadingRepository, IReading, QueryOptions } from "@/src/interfaces/seams"
import { Reading } from "@/src/models/Reading"
import { ValidationError } from "@/src/interfaces/seams"

/**
 * ReadingRepository class
 * Implements repository pattern for Reading model
 * Handles all database operations for readings
 */
export class ReadingRepository implements IReadingRepository {
  /**
   * Find reading by ID
   * @param id - Reading ID
   * @returns Reading document or null if not found
   */
  async findById(id: string): Promise<IReading | null> {
    return await Reading.findById(id)
  }

  /**
   * Find readings by user ID with pagination and sorting
   * Default sort: newest first (createdAt: -1)
   * @param userId - User ID
   * @param options - Query options (limit, skip, sort)
   * @returns Array of reading documents
   */
  async findByUserId(userId: string, options?: QueryOptions): Promise<IReading[]> {
    let query = Reading.find({ userId })

    // Apply sorting (default to newest first)
    const sortOption = options?.sort || { createdAt: -1 }

    // Build query chain
    if (options?.skip !== undefined) {
      query = query.skip(options.skip)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    query = query.sort(sortOption)

    return await query.lean() as unknown as IReading[]
  }

  /**
   * Rate a reading (1-5 stars)
   * @param readingId - Reading ID
   * @param rating - Rating value (1-5)
   * @returns Updated reading document or null if not found
   * @throws ValidationError if rating is invalid
   */
  async rateReading(readingId: string, rating: number): Promise<IReading | null> {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new ValidationError("Rating must be between 1 and 5", "rating")
    }

    return await Reading.findByIdAndUpdate(readingId, { rating }, { new: true })
  }

  /**
   * Find one reading matching query
   * @param query - MongoDB query object
   * @returns Reading document or null if not found
   */
  async findOne(query: Record<string, any>): Promise<IReading | null> {
    return await Reading.findOne(query)
  }

  /**
   * Find multiple readings matching query
   * @param query - MongoDB query object
   * @param options - Query options (limit, skip, sort)
   * @returns Array of reading documents
   */
  async findMany(query: Record<string, any>, options?: QueryOptions): Promise<IReading[]> {
    let queryBuilder = Reading.find(query)

    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options.limit)
    }

    if (options?.skip !== undefined) {
      queryBuilder = queryBuilder.skip(options.skip)
    }

    if (options?.sort) {
      queryBuilder = queryBuilder.sort(options.sort)
    }

    return await queryBuilder.lean() as unknown as IReading[]
  }

  /**
   * Create new reading
   * @param data - Reading data
   * @returns Created reading document
   */
  async create(data: Partial<IReading>): Promise<IReading> {
    const reading = new Reading(data)
    return await reading.save() as unknown as IReading
  }

  /**
   * Update reading by ID
   * @param id - Reading ID
   * @param data - Updated reading data
   * @returns Updated reading document or null if not found
   */
  async update(id: string, data: Partial<IReading>): Promise<IReading | null> {
    return await Reading.findByIdAndUpdate(id, data, { new: true })
  }

  /**
   * Delete reading by ID
   * @param id - Reading ID
   * @returns true if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const result = await Reading.findByIdAndDelete(id)
    return result !== null
  }
}
