import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { updateUserPreferences, getOrCreateUserPreferences, LearningPace } from '@/lib/db';

/**
 * PUT /api/me/preferences
 * 
 * Update current authenticated user's preferences
 * 
 * Authentication: Required
 * Headers: Authorization: Bearer {userId} OR x-user-id: {userId}
 */

type UpdatePreferencesRequest = {
  dailyTimeBudget?: number;
  learningPace?: LearningPace;
  remindersEnabled?: boolean;
  timezone?: string;
};

type PreferencesResponse = {
  success: boolean;
  data?: {
    preferences: {
      id: string;
      userId: string;
      dailyTimeBudget: number;
      learningPace: string;
      remindersEnabled: boolean;
      timezone: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
};

export async function PUT(request: NextRequest) {
  // Require authentication
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  try {
    const body: UpdatePreferencesRequest = await request.json();

    // Validation
    const errors: string[] = [];

    if (body.dailyTimeBudget !== undefined) {
      if (typeof body.dailyTimeBudget !== 'number' || body.dailyTimeBudget < 5 || body.dailyTimeBudget > 480) {
        errors.push('dailyTimeBudget must be between 5 and 480 minutes');
      }
    }

    if (body.learningPace !== undefined) {
      if (!['slow', 'balanced', 'fast'].includes(body.learningPace)) {
        errors.push('learningPace must be one of: slow, balanced, fast');
      }
    }

    if (body.remindersEnabled !== undefined) {
      if (typeof body.remindersEnabled !== 'boolean') {
        errors.push('remindersEnabled must be a boolean');
      }
    }

    if (body.timezone !== undefined) {
      if (typeof body.timezone !== 'string' || body.timezone.length === 0) {
        errors.push('timezone must be a non-empty string');
      }
      // Basic timezone validation (you can use a library like moment-timezone for better validation)
      if (body.timezone && !/^[A-Za-z_\/]+$/.test(body.timezone)) {
        errors.push('timezone format is invalid (e.g., America/New_York, UTC)');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: errors.join('; ')
          }
        } as PreferencesResponse,
        { status: 400 }
      );
    }

    // Ensure preferences exist
    getOrCreateUserPreferences(userId);

    // Update preferences
    const updated = updateUserPreferences(userId, body);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update preferences'
          }
        } as PreferencesResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          preferences: updated
        }
      } as PreferencesResponse,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('PUT /api/me/preferences error', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update preferences'
        }
      } as PreferencesResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/me/preferences
 * 
 * Get current user's preferences only
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  try {
    const preferences = getOrCreateUserPreferences(userId);

    return NextResponse.json(
      {
        success: true,
        data: {
          preferences
        }
      } as PreferencesResponse,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('GET /api/me/preferences error', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch preferences'
        }
      } as PreferencesResponse,
      { status: 500 }
    );
  }
}

/**
 * Example PUT request:
 * 
 * PUT /api/me/preferences
 * Authorization: Bearer user-uuid-here
 * Content-Type: application/json
 * 
 * {
 *   "dailyTimeBudget": 60,
 *   "learningPace": "fast",
 *   "remindersEnabled": false,
 *   "timezone": "America/New_York"
 * }
 * 
 * Example response (200):
 * 
 * {
 *   "success": true,
 *   "data": {
 *     "preferences": {
 *       "id": "pref-uuid",
 *       "userId": "user-uuid",
 *       "dailyTimeBudget": 60,
 *       "learningPace": "fast",
 *       "remindersEnabled": false,
 *       "timezone": "America/New_York",
 *       "createdAt": "2025-01-01T00:00:00.000Z",
 *       "updatedAt": "2025-01-02T00:00:00.000Z"
 *     }
 *   }
 * }
 * 
 * Example validation error (400):
 * 
 * {
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "dailyTimeBudget must be between 5 and 480 minutes; learningPace must be one of: slow, balanced, fast"
 *   }
 * }
 * 
 * Example GET request:
 * 
 * GET /api/me/preferences
 * Authorization: Bearer user-uuid-here
 * 
 * Returns same structure as PUT response
 */
