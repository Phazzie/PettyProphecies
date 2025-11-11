import type { NextApiRequest, NextApiResponse } from "next"
import { getAuthService } from '@/src/middleware/auth.v2'
import { UserRepository } from '@/src/repositories/UserRepository'
import { sendSuccess } from '@/src/utils/apiResponse'
import { errorHandler } from '@/src/middleware/errorHandler.v2'
import { AuthenticationError } from '@/src/interfaces/seams'

const authService = getAuthService()
const userRepo = new UserRepository()

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { message: 'Method not allowed' } })
  }

  try {
    // Verify the auth cookie
    const userId = await authService.verifyToken(req)

    if (!userId) {
      throw new AuthenticationError('Not authenticated')
    }

    // Fetch user details
    const user = await userRepo.findById(userId)

    if (!user) {
      throw new AuthenticationError('User not found')
    }

    // Return user object
    return sendSuccess(res, {
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    })
  } catch (error) {
    // If not authenticated, return empty response
    return res.status(401).json({ success: false, error: { message: 'Not authenticated' } })
  }
}

export default errorHandler(handler)
