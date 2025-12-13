import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/app/lib/authMiddleware';
import { findUserById } from '@/app/lib/auth';

async function handler(req: NextRequest & { userId?: string }) {
  try {
    const userId = req.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found' },
        { status: 401 }
      );
    }

    const user = findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}

export const GET = authMiddleware(handler);
