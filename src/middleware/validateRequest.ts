/**
 * Request Validation Middleware
 * Validates and sanitizes API request data using Zod schemas
 */

import type { NextApiRequest, NextApiResponse } from "next"
import { ZodError } from "zod"
import { schemas, sanitizeObject, type SchemaName } from "../schemas"
import type { ValidationSchema } from "../interfaces/seams"
import type { IAPIResponse } from "../interfaces/seams"

/**
 * Extended NextApiRequest with validated data
 */
declare module "next" {
  interface NextApiRequest {
    validatedData?: any
  }
}

/**
 * Validate request middleware wrapper
 * Validates request body against specified schema and sanitizes all string inputs
 *
 * @param schemaName - Name of the schema to validate against
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler with validation
 *
 * @example
 * ```typescript
 * export default validateRequest("register", async (req, res) => {
 *   const { username, email, password } = req.validatedData
 *   // Data is validated and sanitized
 * })
 * ```
 */
export function validateRequest(
  schemaName: ValidationSchema,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get the appropriate schema
      const schema = schemas[schemaName as SchemaName]

      if (!schema) {
        throw new Error(`Unknown schema: ${schemaName}`)
      }

      // Validate and transform the request body
      const validatedData = schema.parse(req.body)

      // Sanitize all string fields recursively
      const sanitizedData = sanitizeObject(validatedData)

      // Attach validated and sanitized data to request
      req.validatedData = sanitizedData

      // Call the handler with validated data
      await handler(req, res)
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors into standardized response
        const errorDetails: Record<string, string[]> = {}

        error.errors.forEach((err) => {
          const field = err.path.join(".")
          if (!errorDetails[field]) {
            errorDetails[field] = []
          }
          errorDetails[field].push(err.message)
        })

        const response: IAPIResponse = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.errors[0]?.message || "Validation failed",
            details: errorDetails,
            field: error.errors[0]?.path[0] as string,
          },
          timestamp: new Date().toISOString(),
        }

        res.status(400).setHeader("Content-Type", "application/json").json(response)
      } else {
        // Re-throw non-validation errors to be handled by error handler middleware
        throw error
      }
    }
  }
}

/**
 * Validation service implementation
 * Implements IValidationService interface from seams.ts
 */
export class ValidationService {
  /**
   * Validate request body against schema
   *
   * @param data - Data to validate
   * @param schemaName - Schema name to validate against
   * @returns Validated and sanitized data
   * @throws ValidationError if validation fails
   */
  async validateRequest<T>(data: unknown, schemaName: ValidationSchema): Promise<T> {
    const schema = schemas[schemaName as SchemaName]

    if (!schema) {
      throw new Error(`Unknown schema: ${schemaName}`)
    }

    try {
      const validated = schema.parse(data)
      return sanitizeObject(validated) as T
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0]
        throw new Error(firstError?.message || "Validation failed")
      }
      throw error
    }
  }

  /**
   * Sanitize user input to prevent XSS
   *
   * @param input - String to sanitize
   * @returns Sanitized string
   */
  sanitize(input: string): string {
    const { sanitize } = require("../schemas")
    return sanitize(input)
  }

  /**
   * Validate and sanitize object recursively
   *
   * @param obj - Object to sanitize
   * @returns Sanitized object
   */
  sanitizeObject<T extends Record<string, any>>(obj: T): T {
    return sanitizeObject(obj)
  }
}
