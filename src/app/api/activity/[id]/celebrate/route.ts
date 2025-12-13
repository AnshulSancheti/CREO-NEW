import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/app/api/auth/helpers';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  const activity = await prisma.activity.findUnique({ where: { id: params.id } });
  if (!activity) {
    return NextResponse.json({ success: false, error: 'Activity not found' }, { status: 404 });
  }

  await prisma.activity.update({
    where: { id: params.id },
    data: {
      metadata: {
        ...(activity.metadata as Record<string, unknown>),
        celebratedBy: [
          ...((activity.metadata as any)?.celebratedBy ?? []),
          user.id
        ]
      }
    }
  });

  return NextResponse.json({ success: true });
}
