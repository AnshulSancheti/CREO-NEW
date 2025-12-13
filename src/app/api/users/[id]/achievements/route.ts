import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/app/api/auth/helpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  const achievements = await prisma.userAchievement.findMany({
    where: { userId: params.id },
    include: { achievement: true }
  });

  return NextResponse.json({
    success: true,
    data: achievements.map((ua) => ({
      id: ua.id,
      progress: ua.progress,
      completed: ua.completed,
      updatedAt: ua.updatedAt,
      achievement: ua.achievement
    }))
  });
}
