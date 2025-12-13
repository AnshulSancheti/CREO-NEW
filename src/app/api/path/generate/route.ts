import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GeneratePathRequestSchema, ErrorCode, getSuggestedFix } from '@/lib/schemas';
import { getJobRunner } from '@/lib/job-runner';
import { randomUUID } from 'crypto';

/**
 * POST /api/path/generate
 * 
 * Start course generation job
 * Idempotent via idempotencyKey
 * 
 * ALWAYS returns JSON (never empty body)
 */

export async function POST(request: NextRequest) {
  const traceId = `trace_${randomUUID()}`;
  
  try {
    // Parse and validate request
    const body = await request.json().catch(() => ({}));
    const validationResult = GeneratePathRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        ? validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
        : validationResult.error.message || 'Validation failed';
        
      return NextResponse.json(
        {
          success: false,
          traceId,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: errorMessages,
            suggestedFix: getSuggestedFix(ErrorCode.VALIDATION_ERROR)
          }
        },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // TODO: Get userId from auth middleware
    // For now, create a test user
    const testUser = await prisma.user.upsert({
      where: { id: 'test-user-system' },
      update: {},
      create: {
        id: 'test-user-system',
        name: 'Test User',
        subjects: '[]',
        goals: '',
        learningStyle: 'default',
        attentionSpan: 'medium',
        pastStruggles: '[]',
        progressNotes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    const userId = testUser.id;

    // Check idempotency
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key: input.idempotencyKey },
      include: {
        job: true
      }
    });

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          traceId: existing.job?.traceId || traceId,
          jobId: existing.jobId,
          message: 'Job already exists for this idempotency key'
        },
        { status: 200 }
      );
    }

    // Create course (draft status)
    const course = await prisma.course.create({
      data: {
        userId,
        topic: input.topic,
        level: input.level,
        timePerDay: input.timePerDay,
        timePerWeek: input.timePerWeek,
        deadline: input.deadline ? new Date(input.deadline) : null,
        status: 'draft'
      }
    });

    // Create job (traceId already generated at function start)
    const job = await prisma.job.create({
      data: {
        userId,
        courseId: course.id,
        type: 'GENERATE_COURSE',
        status: 'queued',
        traceId,
        progressPercent: 0
      }
    });

    // Store idempotency key
    await prisma.idempotencyKey.create({
      data: {
        userId,
        key: input.idempotencyKey,
        jobId: job.id
      }
    });

    // Log initial event
    await prisma.jobEvent.create({
      data: {
        jobId: job.id,
        stage: 'Initialized',
        level: 'info',
        message: 'Course generation job created',
        data: JSON.stringify({
          topic: input.topic,
          level: input.level,
          timePerDay: input.timePerDay
        })
      }
    });

    // Ensure job runner is running
    getJobRunner();

    return NextResponse.json(
      {
        success: true,
        traceId: job.traceId,
        jobId: job.id,
        message: 'Course generation started'
      },
      { status: 202 }
    );
  } catch (error: any) {
    // ALWAYS return JSON, even on unexpected errors
    console.error('[POST /api/path/generate] Error:', {
      traceId,
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      {
        success: false,
        traceId,
        error: {
          code: ErrorCode.JOB_RUNNER_FAILURE,
          message: error.message || 'Failed to start course generation',
          suggestedFix: getSuggestedFix(ErrorCode.JOB_RUNNER_FAILURE)
        }
      },
      { status: 500 }
    );
  }
}
