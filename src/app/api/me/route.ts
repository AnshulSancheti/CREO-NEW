import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { getUserProfile, getUserStats, getOrCreateUserPreferences } from '@/lib/db';

/**
 * GET /api/me
 * 
 * Get current authenticated user's profile and preferences
 * 
 * Authentication: Required
 * Headers: Authorization: Bearer {userId} OR x-user-id: {userId}
 */

type MeResponse = {
  success: boolean;
  data?: {
    profile: {
      id: string;
      name: string;
      subjects: string[];
      goals: string;
      learningStyle: string;
      attentionSpan: string;
      pastStruggles: string[];
      progressNotes?: string;
      createdAt: string;
      updatedAt: string;
    };
    preferences: {
      dailyTimeBudget: number;
      learningPace: string;
      remindersEnabled: boolean;
      timezone: string;
    };
    stats: {
      xp: number;
      level: number;
      streakCount: number;
      hearts: number;
      maxHearts: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
};

export async function GET(request: NextRequest) {
  // Require authentication
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  try {
    // Get user profile
    const profile = getUserProfile(userId);
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found'
          }
        } as MeResponse,
        { status: 404 }
      );
    }

    // Get or create preferences
    const preferences = getOrCreateUserPreferences(userId);

    // Get stats
    const stats = getUserStats(userId);

    return NextResponse.json(
      {
        success: true,
        data: {
          profile: {
            id: profile.id,
            name: profile.name,
            subjects: profile.subjects,
            goals: profile.goals,
            learningStyle: profile.learningStyle,
            attentionSpan: profile.attentionSpan,
            pastStruggles: profile.pastStruggles,
            progressNotes: profile.progressNotes,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt
          },
          preferences: {
            dailyTimeBudget: preferences.dailyTimeBudget,
            learningPace: preferences.learningPace,
            remindersEnabled: preferences.remindersEnabled,
            timezone: preferences.timezone
          },
          stats: {
            xp: stats.xp,
            level: stats.level,
            streakCount: stats.streakCount,
            hearts: stats.hearts,
            maxHearts: stats.maxHearts
          }
        }
      } as MeResponse,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('GET /api/me error', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch user data'
        }
      } as MeResponse,
      { status: 500 }
    );
  }
}

/**
 * Example request:
 * 
 * GET /api/me
 * Authorization: Bearer user-uuid-here
 * 
 * OR
 * 
 * GET /api/me
 * x-user-id: user-uuid-here
 * 
 * Example response (200):
 * 
 * {
 *   "success": true,
 *   "data": {
 *     "profile": {
 *       "id": "uuid-here",
 *       "name": "John Doe",
 *       "subjects": ["algorithms", "web dev"],
 *       "goals": "Master coding",
 *       "learningStyle": "examples",
 *       "attentionSpan": "medium",
 *       "pastStruggles": ["loops"],
 *       "progressNotes": "",
 *       "createdAt": "2025-01-01T00:00:00.000Z",
 *       "updatedAt": "2025-01-01T00:00:00.000Z"
 *     },
 *     "preferences": {
 *       "dailyTimeBudget": 30,
 *       "learningPace": "balanced",
 *       "remindersEnabled": true,
 *       "timezone": "UTC"
 *     },
 *     "stats": {
 *       "xp": 100,
 *       "level": 2,
 *       "streakCount": 5,
 *       "hearts": 5,
 *       "maxHearts": 5
 *     }
 *   }
 * }
 * 
 * Example error (401):
 * 
 * {
 *   "success": false,
 *   "error": {
 *     "code": "UNAUTHORIZED",
 *     "message": "Authentication required"
 *   }
 * }
 */
