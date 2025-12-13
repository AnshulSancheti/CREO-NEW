import { NextRequest, NextResponse } from 'next/server';
import {
  AttentionSpan,
  LearningStyle,
  createUserProfile,
  getGameState,
  getOrCreateUser,
  getRecentMessages,
  getUserStats,
  getUserProfile,
  listTopicProgress,
  listUsers,
  updateUserProfile
} from '@/lib/db';

type UserPayload = {
  userId?: string;
  name?: string;
  subjects?: string[];
  goals?: string;
  learningStyle?: LearningStyle;
  attentionSpan?: AttentionSpan;
  pastStruggles?: string[];
  progressNotes?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: UserPayload = await request.json();

    const payload: UserPayload = {
      name: body.name ?? 'Learner',
      subjects: body.subjects ?? [],
      goals: body.goals ?? '',
      learningStyle: body.learningStyle ?? 'default',
      attentionSpan: body.attentionSpan ?? 'medium',
      pastStruggles: body.pastStruggles ?? [],
      progressNotes: body.progressNotes ?? ''
    };
    
    // Validate after applying defaults
    if (payload.name && payload.name.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Name cannot be empty' 
          } 
        },
        { status: 400 }
      );
    }

    let profile;
    let statusCode = 201;
    let isExisting = false;

    if (body.userId) {
      // Update existing user
      profile = updateUserProfile(body.userId, payload);
      statusCode = 200;
      
      if (!profile) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'USER_NOT_FOUND', 
              message: 'User not found for update' 
            } 
          },
          { status: 404 }
        );
      }
    } else {
      // Create new user - use getOrCreateUser for idempotency
      try {
        profile = createUserProfile(payload);
        statusCode = 201;
      } catch (error: any) {
        // Check if error is due to duplicate user (unique constraint violation)
        if (error?.message?.includes('UNIQUE constraint failed') || 
            error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          // User already exists - this should rarely happen, but handle it gracefully
          console.warn('Attempted to create duplicate user, using getOrCreateUser');
          profile = getOrCreateUser(payload);
          statusCode = 200;
          isExisting = true;
        } else {
          throw error;
        }
      }
    }

    const progress = listTopicProgress(profile.id);
    const stats = getUserStats(profile.id);

    return NextResponse.json(
      { 
        success: true, 
        data: { profile, progress, stats },
        ...(isExisting && { info: 'Profile already existed' })
      },
      { status: statusCode }
    );
  } catch (error: any) {
    console.error('POST /api/users error', error);
    
    // Return structured error
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR', 
          message: 'Failed to save user profile' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get('id');

    if (id) {
      const user = getOrCreateUser({ id });
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const progress = listTopicProgress(id);
      const history = getRecentMessages(id, 20);
      const state = getGameState(id);
      return NextResponse.json(
        { success: true, data: { profile: user, progress, history, state } },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, data: { users: listUsers() } },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/users error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
