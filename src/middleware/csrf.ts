import type { NextApiRequest, NextApiResponse } from "next"
import Csrf from "csrf"

const tokens = new Csrf()

const CSRF_SECRET = process.env.CSRF_SECRET || (() => {
  throw new Error("CSRF_SECRET environment variable is not set")
})()

const MUTATING_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"])

/**
 * CSRF middleware — verifies the X-CSRF-Token header on mutating requests.
 * Token must be fetched from GET /api/auth/csrf and included on every mutation.
 */
export function withCsrf(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (MUTATING_METHODS.has(req.method ?? "")) {
      const csrfToken = req.headers["x-csrf-token"] as string | undefined
      if (!csrfToken || !tokens.verify(CSRF_SECRET, csrfToken)) {
        return res.status(403).json({ message: "Invalid CSRF token" })
      }
    }
    return handler(req, res)
  }
}

/**
 * Generates a new CSRF token signed with CSRF_SECRET.
 * Frontend must call GET /api/auth/csrf and store the token, then send
 * it as the X-CSRF-Token header on all POST/PUT/DELETE/PATCH requests.
 */
export function generateCsrfToken(): string {
  return tokens.create(CSRF_SECRET)
}
