import { z } from 'zod';

// ========================================
// REQUEST VALIDATION SCHEMAS
// ========================================

export const GeneratePathRequestSchema = z.object({
  topic: z.string().min(3).max(200),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  timePerDay: z.number().int().min(5).max(480).default(30),
  timePerWeek: z.number().int().min(10).max(3360).optional(),
  deadline: z.string().datetime().optional().nullable(),
  idempotencyKey: z.string().uuid()
});

export type GeneratePathRequest = z.infer<typeof GeneratePathRequestSchema>;

// ========================================
// LLM OUTPUT SCHEMAS (STRICT)
// ========================================

export const ModuleOutcomeSchema = z.object({
  title: z.string(),
  description: z.string()
});

export const ModuleSchema = z.object({
  order: z.number().int().min(1).max(5),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(500),
  outcomes: z.array(z.string()).min(2).max(6)
});

export const CourseSkeletonSchema = z.object({
  topic: z.string(),
  level: z.string(),
  modules: z.array(ModuleSchema).length(5) // EXACTLY 5 modules
});

export type CourseSkeleton = z.infer<typeof CourseSkeletonSchema>;

// ========================================
// LESSON SCHEMAS
// ========================================

export const LessonStepSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(5).max(150),
  type: z.enum(['learn', 'practice', 'apply']),
  estimatedMinutes: z.number().int().min(1).max(60),
  content: z.string().optional()
});

export const ModuleLessonsSchema = z.object({
  moduleOrder: z.number().int().min(1).max(5),
  steps: z.array(LessonStepSchema).min(3).max(10)
});

export type ModuleLessons = z.infer<typeof ModuleLessonsSchema>;

// ========================================
// QUIZ SCHEMAS
// ========================================

export const QuizQuestionSchema = z.object({
  type: z.enum(['mcq', 'short', 'code']),
  question: z.string().min(10),
  options: z.array(z.string()).optional(), // Required for MCQ
  answerKey: z.string(),
  explanation: z.string().min(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  tags: z.array(z.string()).default([])
}).refine(
  (data) => {
    // If MCQ, must have options and answerKey must be in options
    if (data.type === 'mcq') {
      if (!data.options || data.options.length < 2) {
        return false;
      }
      if (!data.options.includes(data.answerKey)) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'MCQ questions must have at least 2 options and answerKey must be one of the options'
  }
);

export const ModuleQuizSchema = z.object({
  moduleOrder: z.number().int().min(1).max(5),
  questions: z.array(QuizQuestionSchema).min(5).max(15)
});

export type ModuleQuiz = z.infer<typeof ModuleQuizSchema>;

// ========================================
// YOUTUBE RESOURCE SCHEMAS
// ========================================

export const YouTubeResourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  channel: z.string().optional(),
  durationSeconds: z.number().int().optional(),
  thumbnailUrl: z.string().url().optional(),
  reason: z.string().optional()
});

export const ModuleResourcesSchema = z.object({
  moduleOrder: z.number().int().min(1).max(5),
  resources: z.array(YouTubeResourceSchema).min(0).max(5)
});

export type ModuleResources = z.infer<typeof ModuleResourcesSchema>;

// ========================================
// ERROR CODES
// ========================================

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  LLM_SCHEMA_INVALID: 'LLM_SCHEMA_INVALID',
  LLM_PROVIDER_FAILURE: 'LLM_PROVIDER_FAILURE',
  YOUTUBE_PROVIDER_FAILURE: 'YOUTUBE_PROVIDER_FAILURE',
  DB_WRITE_FAILURE: 'DB_WRITE_FAILURE',
  JOB_RUNNER_FAILURE: 'JOB_RUNNER_FAILURE',
  IDEMPOTENCY_KEY_CONFLICT: 'IDEMPOTENCY_KEY_CONFLICT',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND'
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// ========================================
// SUGGESTED FIXES
// ========================================

export function getSuggestedFix(errorCode: string): string {
  const fixes: Record<string, string> = {
    [ErrorCode.VALIDATION_ERROR]: 'Check input parameters: topic length, timePerDay range (5-480), valid level',
    [ErrorCode.LLM_SCHEMA_INVALID]: 'LLM returned invalid JSON. Check prompt structure and retry. System will use fallback generator.',
    [ErrorCode.LLM_PROVIDER_FAILURE]: 'Check OPENAI_API_KEY environment variable and API rate limits. Verify account has credits.',
    [ErrorCode.YOUTUBE_PROVIDER_FAILURE]: 'Check YOUTUBE_API_KEY environment variable. This error is non-fatal; mock resources used instead.',
    [ErrorCode.DB_WRITE_FAILURE]: 'Database write failed. Check database connection and disk space.',
    [ErrorCode.JOB_RUNNER_FAILURE]: 'Job runner encountered an unexpected error. Check logs for stack trace.',
    [ErrorCode.IDEMPOTENCY_KEY_CONFLICT]: 'Duplicate request with same idempotencyKey. Return existing job.',
    [ErrorCode.JOB_NOT_FOUND]: 'Job ID does not exist in database.',
    [ErrorCode.COURSE_NOT_FOUND]: 'Course ID does not exist or was deleted.'
  };
  
  return fixes[errorCode] || 'Unknown error code. Check job events for details.';
}
