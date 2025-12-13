import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/app/api/auth/helpers';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  const targetId = params.id;
  if (user.id === targetId) {
    return NextResponse.json({ success: false, error: 'You cannot follow yourself.' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: user.id, followingId: targetId } },
    update: {},
    create: { followerId: user.id, followingId: targetId }
  });

  await prisma.activity.create({
    data: {
      userId: targetId,
      type: 'follow',
      message: `${user.username || 'Someone'} followed you`,
      metadata: { followerId: user.id }
    }
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  await prisma.follow.deleteMany({
    where: { followerId: user.id, followingId: params.id }
  });

  return NextResponse.json({ success: true });
}
