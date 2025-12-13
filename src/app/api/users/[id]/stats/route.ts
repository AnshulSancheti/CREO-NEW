import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/app/api/auth/helpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  const stats = await prisma.profileStats.findUnique({ where: { userId: params.id } });
  if (!stats) {
    return NextResponse.json({ success: false, error: 'Stats not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: stats });
}
