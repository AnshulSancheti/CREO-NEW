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
 */

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validationResult = GeneratePathRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
            suggestedFix: getSuggestedFix(ErrorCode.VALIDATION_ERROR)
          }
        },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // TODO: Get userId from auth middleware
    // For now, use a test user or create one
    const userId = 'test-user-' + randomUUID();

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
          jobId: existing.jobId,
          traceId: existing.job?.traceId || 'unknown',
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

    // Create job
    const traceId = `trace_${randomUUID()}`;
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
        jobId: job.id,
        traceId: job.traceId,
        message: 'Course generation started'
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('POST /api/path/generate error', error);
    return NextResponse.json(
      {
        success: false,
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
