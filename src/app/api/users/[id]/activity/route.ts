import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/app/api/auth/helpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  const events = await prisma.activity.findMany({
    where: { userId: params.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return NextResponse.json({ success: true, data: events });
}
