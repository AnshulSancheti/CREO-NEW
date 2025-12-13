import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const requireAuth = async (req: NextRequest) => {
  const token = extractBearerToken(req);
  if (!token) {
    return { user: null, response: NextResponse.json({ success: false, error: 'Missing token' }, { status: 401 }) };
  }

  const decoded = verifyToken(token);
  const userId = decoded?.userId;

  if (!userId || typeof userId !== 'string') {
    return { user: null, response: NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { stats: true } });
  if (!user) {
    return { user: null, response: NextResponse.json({ success: false, error: 'User not found' }, { status: 401 }) };
  }

  return { user, response: null };
};
