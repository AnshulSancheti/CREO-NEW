import { NextRequest, NextResponse } from 'next/server';
import { getLessonById } from '@/lib/db';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: Params) {
  try {
    // Next.js 16+ requires awaiting params
    const { id } = await context.params;
    const lesson = getLessonById(id);
    if (!lesson) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { lesson } }, { status: 200 });
  } catch (error) {
    console.error('GET /api/lessons/[id] error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch lesson' }, { status: 500 });
  }
}
