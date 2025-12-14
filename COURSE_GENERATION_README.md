# CREO Course Generation System - MVP Complete

## Overview

The MVP "heart" of CREO: An end-to-end course generation system that creates structured learning paths with exactly 5 modules, lessons, quizzes, and YouTube resources.

## Features ✅

- **Course Generation**: Create complete learning paths from topic + time budget
- **5 Modules**: Exactly 5 progressive modules per course
- **Lessons**: 3-10 lessons per module with estimated time
- **Quizzes**: 5-15 questions per module (MCQ, short answer, code)
- **YouTube Resources**: 3-5 videos per module (real or mock)
- **Idempotency**: Same request doesn't duplicate courses
- **Observability**: Full tracing with jobEvents and progress tracking
- **Error Handling**: Clear error codes and suggested fixes
- **Fallbacks**: System works even without API keys

---

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Add API keys (optional)
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=AIza...
```

**Without keys**: System uses mock providers (deterministic fallbacks).

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 3. Start Server

```bash
yarn dev
```

### 4. Run Tests

```bash
bash /app/scripts/test-course-generation.sh
```

---

## API Endpoints

### POST /api/path/generate

Start course generation job.

**Request:**
```json
{
  "topic": "JavaScript Fundamentals",
  "level": "beginner",
  "timePerDay": 30,
  "timePerWeek": 210,
  "deadline": "2025-12-31T00:00:00Z",
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (202):**
```json
{
  "success": true,
  "jobId": "job_abc123",
  "traceId": "trace_xyz789",
  "message": "Course generation started"
}
```

---

### GET /api/jobs/:jobId

Poll job status and progress.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc123",
    "type": "GENERATE_COURSE",
    "status": "running",
    "progressPercent": 45,
    "currentStage": "Stage 2: Module 3 lessons",
    "traceId": "trace_xyz789",
    "events": [
      {
        "stage": "Stage 2",
        "level": "info",
        "message": "Module 2 lessons created",
        "data": { "count": 5 },
        "timestamp": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

**When succeeded:**
```json
{
  "success": true,
  "data": {
    "status": "succeeded",
    "progressPercent": 100,
    "courseId": "course_123"
  }
}
```

**When failed:**
```json
{
  "success": true,
  "data": {
    "status": "failed",
    "error": {
      "code": "LLM_SCHEMA_INVALID",
      "message": "LLM returned invalid JSON",
      "suggestedFix": "Check prompt structure and retry. System will use fallback generator."
    }
  }
}
```

---

### GET /api/courses/:courseId

Fetch complete course with all modules, lessons, quizzes, and resources.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "course_123",
      "topic": "JavaScript Fundamentals",
      "level": "beginner",
      "timePerDay": 30,
      "status": "active",
      "modules": [
        {
          "id": "mod_1",
          "order": 1,
          "title": "Introduction to JavaScript",
          "description": "Get started with...",
          "outcomes": ["Understand what JS is", "Set up environment"],
          "lessons": [
            {
              "id": "lesson_1",
              "order": 1,
              "title": "What is JavaScript?",
              "type": "learn",
              "estimatedMinutes": 10
            }
          ],
          "quizzes": [
            {
              "id": "quiz_1",
              "totalQuestions": 8,
              "questions": [
                {
                  "type": "mcq",
                  "question": "What is...",
                  "options": ["A", "B", "C", "D"],
                  "answerKey": "B",
                  "explanation": "...",
                  "difficulty": "easy",
                  "tags": ["basics"]
                }
              ]
            }
          ],
          "resources": [
            {
              "provider": "youtube",
              "title": "JS Tutorial Part 1",
              "url": "https://youtube.com/watch?v=...",
              "channel": "Code Academy",
              "durationSeconds": 720,
              "thumbnailUrl": "https://...",
              "reason": "Recommended based on search for..."
            }
          ]
        }
        // ... 4 more modules
      ]
    }
  }
}
```

---

## Job Pipeline Stages

The system executes 5 stages in order:

### Stage 1: Generate Course Skeleton (5 modules)
- Calls LLM or uses fallback
- Creates exactly 5 modules
- Validates with Zod schema
- Retry logic if invalid

### Stage 2: Generate Lessons per Module
- 3-10 lessons per module
- Types: learn, practice, apply
- Respects daily time budget

### Stage 3: Generate Quizzes per Module
- 5-15 questions per module
- Types: MCQ, short answer, code
- Includes explanations

### Stage 4: YouTube Resources per Module
- Searches YouTube API or uses mock
- 3-5 videos per module
- Non-fatal if fails

### Stage 5: Finalize
- Marks course as active
- Updates job to succeeded

---

## Error Codes

| Code | Description | Suggested Fix |
|------|-------------|---------------|
| `VALIDATION_ERROR` | Invalid input | Check topic length, timePerDay range (5-480) |
| `LLM_SCHEMA_INVALID` | LLM returned invalid JSON | System uses fallback generator |
| `LLM_PROVIDER_FAILURE` | LLM API failed | Check OPENAI_API_KEY and rate limits |
| `YOUTUBE_PROVIDER_FAILURE` | YouTube API failed (non-fatal) | Check YOUTUBE_API_KEY |
| `DB_WRITE_FAILURE` | Database write failed | Check database connection |
| `JOB_RUNNER_FAILURE` | Unexpected error | Check logs for stack trace |
| `JOB_NOT_FOUND` | Job ID doesn't exist | Verify job ID |
| `COURSE_NOT_FOUND` | Course ID doesn't exist | Verify course ID |

---

## Provider Abstractions

### LLM Provider

**Interface:**
- `generateCourseSkeleton()`
- `generateLessons()`
- `generateQuiz()`

**Implementations:**
- `OpenAIProvider`: Uses gpt-4o-mini
- `MockLLMProvider`: Deterministic fallback

**Factory:**
```typescript
const llm = createLLMProvider(); // Auto-selects based on env
```

### YouTube Provider

**Interface:**
- `searchVideos(query, maxResults)`

**Implementations:**
- `YouTubeDataApiProvider`: Real YouTube API
- `MockYouTubeProvider`: Placeholder videos

**Factory:**
```typescript
const youtube = createYouTubeProvider(); // Auto-selects based on env
```

---

## Testing

### Manual Testing

```bash
# 1. Start generation
curl -X POST http://localhost:3000/api/path/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "React Hooks",
    "level": "intermediate",
    "timePerDay": 45,
    "idempotencyKey": "'$(uuidgen)'"
  }'

# Save jobId from response

# 2. Poll status
curl http://localhost:3000/api/jobs/JOB_ID

# 3. Fetch course (when succeeded)
curl http://localhost:3000/api/courses/COURSE_ID
```

### Automated Testing

```bash
bash /app/scripts/test-course-generation.sh
```

**Tests:**
1. Start course generation
2. Verify idempotency
3. Poll until completion
4. Verify job events (observability)
5. Verify course structure (5 modules, quizzes, resources)
6. Test validation errors

---

## Observability

Every stage logs events to `JobEvent` table:

```sql
SELECT stage, level, message, data, ts
FROM job_events
WHERE job_id = 'job_123'
ORDER BY ts DESC;
```

**Event Levels:**
- `info`: Normal operation
- `warn`: Non-fatal issues (fallback used)
- `error`: Fatal errors

**Stage Tracking:**
- `Job.currentStage`: Current pipeline stage
- `Job.progressPercent`: 0-100%
- `Job.status`: queued | running | succeeded | failed

---

## Database Schema

See `/app/prisma/schema.prisma` for complete schema.

**Key Models:**
- `Course`: Learning path definition
- `Module`: One of 5 modules per course
- `Lesson`: Steps within a module
- `Quiz` & `QuizQuestion`: Assessment questions
- `Resource`: YouTube videos and other materials
- `Job`: Background job tracking
- `JobEvent`: Detailed stage logs
- `IdempotencyKey`: Prevent duplicate requests

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite database path |
| `OPENAI_API_KEY` | No | OpenAI API key (uses mock if missing) |
| `OPENAI_MODEL` | No | Model name (default: gpt-4o-mini) |
| `YOUTUBE_API_KEY` | No | YouTube Data API key (uses mock if missing) |
| `NODE_ENV` | No | development | production |

---

## Idempotency

Duplicate requests with the same `idempotencyKey` return the existing job:

```bash
# First request
curl -X POST /api/path/generate -d '{"idempotencyKey": "abc123", ...}'
# Returns: { "jobId": "job_1" }

# Second request (same key)
curl -X POST /api/path/generate -d '{"idempotencyKey": "abc123", ...}'
# Returns: { "jobId": "job_1", "message": "Job already exists" }
```

Stored in `IdempotencyKey` table with foreign key to `Job`.

---

## Acceptance Criteria ✅

### Without API Keys:
- ✅ POST generate returns jobId
- ✅ Job completes successfully using mock providers
- ✅ Course has exactly 5 modules
- ✅ Each module has quiz questions stored
- ✅ Resources exist (mock placeholders)

### With API Keys:
- ✅ Videos return real YouTube results
- ✅ LLM generates custom content

### Error Handling:
- ✅ If LLM returns invalid JSON: schema catches it, retry happens, fallback used
- ✅ Idempotency: same key returns same jobId, no duplicates

### Observability:
- ✅ Job.currentStage shows pipeline progress
- ✅ JobEvent logs every stage
- ✅ Error codes surface in GET /jobs/:id
- ✅ Suggested fixes returned to client

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ POST /api/path/generate
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Handler                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Validate input (Zod)                             │   │
│  │ 2. Check idempotency                                │   │
│  │ 3. Create Course (draft)                            │   │
│  │ 4. Create Job (queued)                              │   │
│  │ 5. Return jobId                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Job Runner polls
                ▼
┌─────────────────────────────────────────────────────────────┐
│                      Job Runner                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Stage 1: Generate Skeleton (LLM → 5 modules)        │   │
│  │ Stage 2: Generate Lessons (per module)              │   │
│  │ Stage 3: Generate Quizzes (per module)              │   │
│  │ Stage 4: Fetch YouTube Videos (per module)          │   │
│  │ Stage 5: Finalize (mark active)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────┬───────────────┬─────────────────────────────┘
              │               │
              │               │ Logs to JobEvent
              ▼               ▼
┌──────────────────┐  ┌─────────────────┐
│   LLM Provider   │  │ YouTube Provider│
│ ┌──────────────┐ │  │ ┌─────────────┐ │
│ │ OpenAI       │ │  │ │ YouTube API │ │
│ │ Mock         │ │  │ │ Mock        │ │
│ └──────────────┘ │  │ └─────────────┘ │
└──────────────────┘  └─────────────────┘
```

---

## Files Created

```
/app/prisma/schema.prisma                     # Prisma schema
/app/src/lib/prisma.ts                        # Prisma client singleton
/app/src/lib/schemas.ts                       # Zod validation schemas
/app/src/lib/providers/llm.ts                 # LLM provider abstraction
/app/src/lib/providers/youtube.ts             # YouTube provider abstraction
/app/src/lib/job-runner.ts                    # Background job processor
/app/src/app/api/path/generate/route.ts       # POST /api/path/generate
/app/src/app/api/jobs/[jobId]/route.ts        # GET /api/jobs/:jobId
/app/src/app/api/courses/[courseId]/route.ts  # GET /api/courses/:courseId
/app/scripts/test-course-generation.sh        # End-to-end test script
/app/.env                                     # Environment variables
/app/COURSE_GENERATION_README.md              # This file
```

---

## Next Steps

1. **Add Authentication**: Integrate with auth system to get real userIds
2. **UI Integration**: Build frontend course viewer
3. **Progress Tracking**: User progress through lessons
4. **Content Editing**: Allow manual editing of generated content
5. **Advanced Scheduling**: More sophisticated time allocation
6. **Caching**: Cache LLM responses to save API costs
7. **Webhooks**: Notify on job completion

---

## Troubleshooting

### Job stuck in "running"
- Check `/var/log/supervisor/frontend.err.log` for job runner errors
- Verify database connection
- Check LLM/YouTube API rate limits

### Course has no quizzes
- Check JobEvent logs for "Stage 3" errors
- Verify LLM response format
- System should fallback to mock quizzes

### YouTube resources are mock
- Verify YOUTUBE_API_KEY is set in .env
- Check quota limits on YouTube API console
- Mock provider is non-fatal fallback

### Validation errors
- Check request payload matches schema
- topic: 3-200 characters
- timePerDay: 5-480 minutes
- level: beginner | intermediate | advanced
- idempotencyKey: valid UUID

---

**Status**: ✅ MVP Complete - All acceptance tests passing!
