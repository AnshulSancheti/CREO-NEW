import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErrorCode, getSuggestedFix } from '@/lib/schemas';

/**
 * GET /api/jobs/:jobId
 * 
 * Poll job status and progress
 */

type Params = {
  params: Promise<{ jobId: string }>;
};

export async function GET(request: NextRequest, context: Params) {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    const { jobId } = await context.params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        events: {
          orderBy: { ts: 'desc' },
          take: 20 // Last 20 events
        }
      }
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          traceId,
          error: {
            code: ErrorCode.JOB_NOT_FOUND,
            message: 'Job not found',
            suggestedFix: getSuggestedFix(ErrorCode.JOB_NOT_FOUND)
          }
        },
        { status: 404 }
      );
    }

    const response: any = {
      success: true,
      traceId: job.traceId || traceId,
      data: {
        jobId: job.id,
        type: job.type,
        status: job.status,
        progressPercent: job.progressPercent,
        currentStage: job.currentStage,
        traceId: job.traceId,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        events: job.events.map(e => ({
          stage: e.stage,
          level: e.level,
          message: e.message,
          data: e.data ? JSON.parse(e.data) : null,
          timestamp: e.ts
        }))
      }
    };

    if (job.status === 'failed') {
      response.data.error = {
        code: job.errorCode,
        message: job.errorMessage,
        suggestedFix: getSuggestedFix(job.errorCode || ErrorCode.JOB_RUNNER_FAILURE)
      };
    }

    if (job.status === 'succeeded') {
      response.data.courseId = job.courseId;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    // ALWAYS return JSON
    console.error('[GET /api/jobs/[jobId]] Error:', {
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
          message: 'Failed to fetch job status'
        }
      },
      { status: 500 }
    );
  }
}
