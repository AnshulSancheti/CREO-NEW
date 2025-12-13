import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErrorCode, getSuggestedFix } from '@/lib/schemas';

/**
 * GET /api/courses/:courseId
 * 
 * Get complete course with modules, lessons, quizzes, resources
 */

type Params = {
  params: Promise<{ courseId: string }>;
};

export async function GET(request: NextRequest, context: Params) {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    const { courseId } = await context.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            },
            quizzes: {
              include: {
                questions: {
                  orderBy: { order: 'asc' }
                }
              }
            },
            resources: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          traceId,
          error: {
            code: ErrorCode.COURSE_NOT_FOUND,
            message: 'Course not found',
            suggestedFix: getSuggestedFix(ErrorCode.COURSE_NOT_FOUND)
          }
        },
        { status: 404 }
      );
    }

    // Format response
    const formattedCourse = {
      id: course.id,
      topic: course.topic,
      level: course.level,
      timePerDay: course.timePerDay,
      timePerWeek: course.timePerWeek,
      deadline: course.deadline,
      status: course.status,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      modules: course.modules.map(module => ({
        id: module.id,
        order: module.order,
        title: module.title,
        description: module.description,
        outcomes: JSON.parse(module.outcomes),
        lessons: module.lessons.map(lesson => ({
          id: lesson.id,
          order: lesson.order,
          title: lesson.title,
          type: lesson.type,
          estimatedMinutes: lesson.estimatedMinutes,
          content: lesson.content
        })),
        quizzes: module.quizzes.map(quiz => ({
          id: quiz.id,
          totalQuestions: quiz.totalQuestions,
          questions: quiz.questions.map(q => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options ? JSON.parse(q.options) : null,
            answerKey: q.answerKey,
            explanation: q.explanation,
            difficulty: q.difficulty,
            tags: JSON.parse(q.tags)
          }))
        })),
        resources: module.resources.map(r => ({
          id: r.id,
          provider: r.provider,
          title: r.title,
          url: r.url,
          channel: r.channel,
          durationSeconds: r.durationSeconds,
          thumbnailUrl: r.thumbnailUrl,
          reason: r.reason
        }))
      }))
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          course: formattedCourse
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('GET /api/courses/[courseId] error', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DB_WRITE_FAILURE,
          message: 'Failed to fetch course'
        }
      },
      { status: 500 }
    );
  }
}
