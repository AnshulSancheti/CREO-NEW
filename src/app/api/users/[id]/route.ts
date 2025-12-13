import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/app/api/auth/helpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  const userId = params.id;

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      stats: true
    }
  });

  if (!profile) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  const [followers, following, isFollowing] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: userId } }
    })
  ]);

  return NextResponse.json({
    success: true,
    data: {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      fullName: profile.fullName,
      bio: profile.bio,
      createdAt: profile.createdAt,
      stats: profile.stats,
      followers,
      following,
      isFollowing: Boolean(isFollowing)
    }
  });
}
