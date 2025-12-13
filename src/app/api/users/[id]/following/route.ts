import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/app/api/auth/helpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  const following = await prisma.follow.findMany({
    where: { followerId: params.id },
    include: {
      following: {
        include: { stats: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({
    success: true,
    data: following.map((f) => ({
      id: f.following.id,
      username: f.following.username,
      fullName: f.following.fullName,
      xp: f.following.stats?.xp ?? 0,
      joined: f.following.createdAt
    }))
  });
}
