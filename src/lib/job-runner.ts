import { prisma } from './prisma';
import { createLLMProvider } from './providers/llm';
import { createYouTubeProvider } from './providers/youtube';
import { ErrorCode, getSuggestedFix } from './schemas';
import { z } from 'zod';

// ========================================
// JOB RUNNER
// ========================================

export class JobRunner {
  private isRunning = false;
  private pollInterval = 2000; // 2 seconds

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.poll();
    console.log('[Job Runner] Started');
  }

  stop() {
    this.isRunning = false;
    console.log('[Job Runner] Stopped');
  }

  private async poll() {
    while (this.isRunning) {
      try {
        await this.processNextJob();
      } catch (error) {
        console.error('[Job Runner] Poll error:', error);
      }

      await new Promise((resolve) => setTimeout(resolve, this.pollInterval));
    }
  }

  private async processNextJob() {
    // Get next queued job
    const job = await prisma.job.findFirst({
      where: { status: 'queued' },
      orderBy: { createdAt: 'asc' }
    });

    if (!job) return;

    console.log(`[Job Runner] Processing job ${job.id} (${job.type})`);

    // Update to running
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'running',
        currentStage: 'Starting',
        progressPercent: 0
      }
    });

    try {
      if (job.type === 'GENERATE_COURSE') {
        await this.executeGenerateCourse(job.id);
      }

      // Mark succeeded
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'succeeded',
          progressPercent: 100,
          currentStage: 'Completed',
          updatedAt: new Date()
        }
      });

      await this.logEvent(job.id, 'Completed', 'info', 'Job completed successfully');
    } catch (error: any) {
      console.error(`[Job Runner] Job ${job.id} failed:`, error);

      const errorCode = error.code || ErrorCode.JOB_RUNNER_FAILURE;
      const errorMessage = error.message || 'Unknown error';

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errorCode,
          errorMessage,
          updatedAt: new Date()
        }
      });

      await this.logEvent(job.id, 'Failed', 'error', errorMessage, {
        errorCode,
        stack: error.stack
      });
    }
  }

  // ========================================
  // EXECUTE GENERATE COURSE PIPELINE
  // ========================================

  private async executeGenerateCourse(jobId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { course: true }
    });

    if (!job || !job.course) {
      throw new Error('Job or course not found');
    }

    const { course } = job;
    const llmProvider = createLLMProvider();
    const youtubeProvider = createYouTubeProvider();

    // ========================================
    // STAGE 1: Generate Course Skeleton (5 modules)
    // ========================================
    await this.updateProgress(jobId, 10, 'Stage 1: Generating course skeleton');
    await this.logEvent(jobId, 'Stage 1', 'info', 'Starting course skeleton generation');

    let skeleton;
    try {
      skeleton = await llmProvider.generateCourseSkeleton({
        topic: course.topic,
        level: course.level,
        timePerDay: course.timePerDay
      });

      await this.logEvent(jobId, 'Stage 1', 'info', 'Course skeleton generated', {
        modules: skeleton.modules.length
      });
    } catch (error: any) {
      await this.logEvent(jobId, 'Stage 1', 'warn', 'LLM failed, attempting repair', {
        error: error.message
      });

      // Retry once with repair prompt
      try {
        await this.updateProgress(jobId, 12, 'Stage 1: Retrying with repair');
        skeleton = await llmProvider.generateCourseSkeleton({
          topic: course.topic,
          level: course.level,
          timePerDay: course.timePerDay
        });

        await this.logEvent(jobId, 'Stage 1', 'info', 'Repair succeeded');
      } catch (retryError: any) {
        // Fallback: use mock provider
        await this.logEvent(jobId, 'Stage 1', 'warn', 'Using fallback generator');
        const mockProvider = createLLMProvider(); // Will use mock if no key
        skeleton = await mockProvider.generateCourseSkeleton({
          topic: course.topic,
          level: course.level,
          timePerDay: course.timePerDay
        });
      }
    }

    // Save modules to DB
    for (const moduleData of skeleton.modules) {
      await prisma.module.create({
        data: {
          courseId: course.id,
          order: moduleData.order,
          title: moduleData.title,
          description: moduleData.description,
          outcomes: JSON.stringify(moduleData.outcomes)
        }
      });
    }

    await this.updateProgress(jobId, 20, 'Stage 1: Complete');

    // Fetch modules for next stages
    const modules = await prisma.module.findMany({
      where: { courseId: course.id },
      orderBy: { order: 'asc' }
    });

    // ========================================
    // STAGE 2: Generate Lessons per Module
    // ========================================
    await this.updateProgress(jobId, 25, 'Stage 2: Generating lessons');
    await this.logEvent(jobId, 'Stage 2', 'info', 'Starting lesson generation for all modules');

    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const progress = 25 + ((i + 1) / modules.length) * 15;

      await this.updateProgress(jobId, Math.floor(progress), `Stage 2: Module ${module.order} lessons`);

      try {
        const lessons = await llmProvider.generateLessons({
          topic: course.topic,
          module: {
            order: module.order,
            title: module.title,
            description: module.description,
            outcomes: JSON.parse(module.outcomes)
          },
          timePerDay: course.timePerDay
        });

        for (const lesson of lessons.steps) {
          await prisma.lesson.create({
            data: {
              moduleId: module.id,
              order: lesson.order,
              title: lesson.title,
              type: lesson.type,
              estimatedMinutes: lesson.estimatedMinutes,
              content: lesson.content || ''
            }
          });
        }

        await this.logEvent(jobId, 'Stage 2', 'info', `Module ${module.order} lessons created`, {
          count: lessons.steps.length
        });
      } catch (error: any) {
        await this.logEvent(jobId, 'Stage 2', 'warn', `Module ${module.order} lessons failed, using fallback`, {
          error: error.message
        });

        // Fallback: create basic lessons
        for (let j = 1; j <= 4; j++) {
          await prisma.lesson.create({
            data: {
              moduleId: module.id,
              order: j,
              title: `${module.title} - Part ${j}`,
              type: j === 4 ? 'apply' : j % 2 === 0 ? 'practice' : 'learn',
              estimatedMinutes: Math.floor(course.timePerDay / 4)
            }
          });
        }
      }
    }

    await this.updateProgress(jobId, 40, 'Stage 2: Complete');

    // ========================================
    // STAGE 3: Generate Quizzes per Module
    // ========================================
    await this.updateProgress(jobId, 45, 'Stage 3: Generating quizzes');
    await this.logEvent(jobId, 'Stage 3', 'info', 'Starting quiz generation for all modules');

    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const progress = 45 + ((i + 1) / modules.length) * 25;

      await this.updateProgress(jobId, Math.floor(progress), `Stage 3: Module ${module.order} quiz`);

      try {
        const quizData = await llmProvider.generateQuiz({
          topic: course.topic,
          module: {
            order: module.order,
            title: module.title,
            description: module.description
          }
        });

        // Create quiz
        const quiz = await prisma.quiz.create({
          data: {
            moduleId: module.id,
            totalQuestions: quizData.questions.length
          }
        });

        // Create questions
        for (let j = 0; j < quizData.questions.length; j++) {
          const q = quizData.questions[j];
          await prisma.quizQuestion.create({
            data: {
              quizId: quiz.id,
              type: q.type,
              question: q.question,
              options: q.options ? JSON.stringify(q.options) : null,
              answerKey: q.answerKey,
              explanation: q.explanation,
              difficulty: q.difficulty,
              tags: JSON.stringify(q.tags),
              order: j + 1
            }
          });
        }

        await this.logEvent(jobId, 'Stage 3', 'info', `Module ${module.order} quiz created`, {
          questions: quizData.questions.length
        });
      } catch (error: any) {
        await this.logEvent(jobId, 'Stage 3', 'warn', `Module ${module.order} quiz failed, using fallback`, {
          error: error.message
        });

        // Fallback: create basic quiz
        const quiz = await prisma.quiz.create({
          data: {
            moduleId: module.id,
            totalQuestions: 3
          }
        });

        for (let j = 1; j <= 3; j++) {
          await prisma.quizQuestion.create({
            data: {
              quizId: quiz.id,
              type: 'mcq',
              question: `Question ${j} about ${module.title}?`,
              options: JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']),
              answerKey: 'Option A',
              explanation: 'Explanation for this question.',
              difficulty: 'medium',
              tags: JSON.stringify([]),
              order: j
            }
          });
        }
      }
    }

    await this.updateProgress(jobId, 70, 'Stage 3: Complete');

    // ========================================
    // STAGE 4: YouTube Resources per Module
    // ========================================
    await this.updateProgress(jobId, 75, 'Stage 4: Finding video resources');
    await this.logEvent(jobId, 'Stage 4', 'info', 'Starting YouTube resource search');

    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const progress = 75 + ((i + 1) / modules.length) * 20;

      await this.updateProgress(jobId, Math.floor(progress), `Stage 4: Module ${module.order} resources`);

      try {
        const query = `${course.topic} ${module.title} tutorial`;
        const videos = await youtubeProvider.searchVideos(query, 3);

        for (let j = 0; j < videos.length; j++) {
          const video = videos[j];
          await prisma.resource.create({
            data: {
              moduleId: module.id,
              provider: 'youtube',
              title: video.title,
              url: video.url,
              channel: video.channel,
              durationSeconds: video.durationSeconds,
              thumbnailUrl: video.thumbnailUrl,
              reason: video.reason,
              order: j + 1
            }
          });
        }

        await this.logEvent(jobId, 'Stage 4', 'info', `Module ${module.order} resources added`, {
          count: videos.length
        });
      } catch (error: any) {
        // Non-fatal error
        await this.logEvent(jobId, 'Stage 4', 'warn', `Module ${module.order} resources failed (non-fatal)`, {
          error: error.message,
          errorCode: ErrorCode.YOUTUBE_PROVIDER_FAILURE
        });
      }
    }

    await this.updateProgress(jobId, 95, 'Stage 4: Complete');

    // ========================================
    // STAGE 5: Finalize
    // ========================================
    await this.updateProgress(jobId, 98, 'Stage 5: Finalizing');
    await this.logEvent(jobId, 'Stage 5', 'info', 'Finalizing course');

    await prisma.course.update({
      where: { id: course.id },
      data: { status: 'active' }
    });

    await this.updateProgress(jobId, 100, 'Stage 5: Complete');
    await this.logEvent(jobId, 'Stage 5', 'info', 'Course activated', {
      courseId: course.id
    });
  }

  // ========================================
  // HELPERS
  // ========================================

  private async updateProgress(jobId: string, percent: number, stage: string) {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        progressPercent: percent,
        currentStage: stage,
        updatedAt: new Date()
      }
    });
  }

  private async logEvent(jobId: string, stage: string, level: 'info' | 'warn' | 'error', message: string, data?: any) {
    await prisma.jobEvent.create({
      data: {
        jobId,
        stage,
        level,
        message,
        data: data ? JSON.stringify(data) : null
      }
    });
  }
}

// Singleton instance
let jobRunnerInstance: JobRunner | null = null;

export function getJobRunner(): JobRunner {
  if (!jobRunnerInstance) {
    jobRunnerInstance = new JobRunner();
    jobRunnerInstance.start();
  }
  return jobRunnerInstance;
}
