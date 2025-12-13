import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/api/auth/helpers';
import { prisma } from '@/lib/prisma';
import { bootstrapUserProfile } from '@/lib/profileDefaults';

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  let stats = await prisma.profileStats.findUnique({ where: { userId: user.id } });
  if (!stats) {
    await bootstrapUserProfile(user.id);
    stats = await prisma.profileStats.findUnique({ where: { userId: user.id } });
  }

  const [followerCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } })
  ]);

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        createdAt: user.createdAt
      },
      stats,
      followers: followerCount,
      following: followingCount
    }
  });
}
