import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/app/api/auth/helpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  const followers = await prisma.follow.findMany({
    where: { followingId: params.id },
    include: {
      follower: {
        include: { stats: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({
    success: true,
    data: followers.map((f) => ({
      id: f.follower.id,
      username: f.follower.username,
      fullName: f.follower.fullName,
      xp: f.follower.stats?.xp ?? 0,
      joined: f.follower.createdAt
    }))
  });
}
