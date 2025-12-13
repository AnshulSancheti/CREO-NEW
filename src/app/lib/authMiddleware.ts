import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export interface AuthRequest extends NextRequest {
  userId?: string;
}

export function authMiddleware(handler: (req: AuthRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Attach userId to request
    (req as AuthRequest).userId = decoded.userId;

    return handler(req as AuthRequest);
  };
}

