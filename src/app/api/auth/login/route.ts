import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/db';

/**
 * POST /api/auth/login
 * 
 * Stub authentication endpoint
 * 
 * TODO: Implement real authentication with:
 * - Password validation
 * - OAuth provider integration
 * - JWT token generation
 * - Refresh token handling
 * - Session creation
 * 
 * For now, this creates or retrieves a user and returns their ID
 */

type LoginRequest = {
  email?: string;
  password?: string;
  name?: string;
  // OAuth fields (for future)
  provider?: 'google' | 'github' | 'email';
  token?: string;
};

type LoginResponse = {
  success: boolean;
  data?: {
    userId: string;
    token: string; // Placeholder - will be JWT in future
    profile: {
      id: string;
      name: string;
      email?: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // Basic validation
    if (!body.name && !body.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name or email is required'
          }
        } as LoginResponse,
        { status: 400 }
      );
    }

    // TODO: Implement actual authentication logic
    // For now, create or get user by email/name
    const user = getOrCreateUser({
      name: body.name || body.email || 'Learner',
      subjects: ['algorithms'], // Default
      goals: 'Learn and grow',
      learningStyle: 'default',
      attentionSpan: 'medium',
      pastStruggles: []
    });

    // TODO: Generate actual JWT token
    // For now, return userId as token (INSECURE - for development only)
    const token = user.id;

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: user.id,
          token,
          profile: {
            id: user.id,
            name: user.name,
            email: body.email
          }
        }
      } as LoginResponse,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/auth/login error', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process login request'
        }
      } as LoginResponse,
      { status: 500 }
    );
  }
}

/**
 * Example request:
 * 
 * POST /api/auth/login
 * Content-Type: application/json
 * 
 * {
 *   "email": "user@example.com",
 *   "name": "John Doe",
 *   "password": "placeholder"
 * }
 * 
 * Example response (200):
 * 
 * {
 *   "success": true,
 *   "data": {
 *     "userId": "uuid-here",
 *     "token": "jwt-token-here",
 *     "profile": {
 *       "id": "uuid-here",
 *       "name": "John Doe",
 *       "email": "user@example.com"
 *     }
 *   }
 * }
 * 
 * Example error (400):
 * 
 * {
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Name or email is required"
 *   }
 * }
 */
