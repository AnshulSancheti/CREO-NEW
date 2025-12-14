import { CourseSkeleton, ModuleLessons, ModuleQuiz, CourseSkeletonSchema, ModuleLessonsSchema, ModuleQuizSchema } from '../schemas';
import OpenAI from 'openai';

// ========================================
// LLM PROVIDER INTERFACE
// ========================================

export interface LLMProvider {
  generateCourseSkeleton(input: {
    topic: string;
    level: string;
    timePerDay: number;
  }): Promise<CourseSkeleton>;

  generateLessons(input: {
    topic: string;
    module: { order: number; title: string; description: string; outcomes: string[] };
    timePerDay: number;
  }): Promise<ModuleLessons>;

  generateQuiz(input: {
    topic: string;
    module: { order: number; title: string; description: string };
  }): Promise<ModuleQuiz>;
}

// ========================================
// OPENAI PROVIDER
// ========================================

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateCourseSkeleton(input: {
    topic: string;
    level: string;
    timePerDay: number;
  }): Promise<CourseSkeleton> {
    const prompt = `Generate a structured learning path for: "${input.topic}"

Level: ${input.level}
Time available per day: ${input.timePerDay} minutes

Create EXACTLY 5 modules that progressively build knowledge.

Requirements:
- Each module should be achievable within the daily time budget
- Modules should build on each other logically
- Each module needs 2-6 specific learning outcomes
- Descriptions should be clear and motivating

Return JSON matching this schema:
{
  "topic": "${input.topic}",
  "level": "${input.level}",
  "modules": [
    {
      "order": 1,
      "title": "Module Title",
      "description": "What this module covers",
      "outcomes": ["Outcome 1", "Outcome 2", "Outcome 3"]
    }
  ]
}`;

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert curriculum designer. Generate structured learning paths in JSON format. Always return valid JSON matching the exact schema requested.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No content in LLM response');

    const parsed = JSON.parse(content);
    return CourseSkeletonSchema.parse(parsed);
  }

  async generateLessons(input: {
    topic: string;
    module: { order: number; title: string; description: string; outcomes: string[] };
    timePerDay: number;
  }): Promise<ModuleLessons> {
    const { module, topic, timePerDay } = input;

    const prompt = `Generate learning steps for Module ${module.order}: "${module.title}"

Topic: ${topic}
Description: ${module.description}
Outcomes: ${module.outcomes.join(', ')}
Time per day: ${timePerDay} minutes

Create 3-10 lesson steps that cover this module.

Step types:
- "learn": Conceptual learning, reading, watching
- "practice": Exercises, hands-on practice
- "apply": Real-world application, projects

Requirements:
- Each step should be 5-30 minutes
- Total estimated time should fit within daily budget
- Mix different step types
- Progressive difficulty

Return JSON:
{
  "moduleOrder": ${module.order},
  "steps": [
    {
      "order": 1,
      "title": "Step Title",
      "type": "learn",
      "estimatedMinutes": 15
    }
  ]
}`;

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert instructional designer. Create detailed lesson steps in JSON format.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No content in LLM response');

    const parsed = JSON.parse(content);
    return ModuleLessonsSchema.parse(parsed);
  }

  async generateQuiz(input: {
    topic: string;
    module: { order: number; title: string; description: string };
  }): Promise<ModuleQuiz> {
    const { module, topic } = input;

    const prompt = `Generate quiz questions for Module ${module.order}: "${module.title}"

Topic: ${topic}
Description: ${module.description}

Create 8-12 questions that test understanding of this module.

Question types:
- "mcq": Multiple choice (provide 4 options)
- "short": Short answer
- "code": Code completion/debugging

Requirements:
- Mix of difficulties (easy, medium, hard)
- Include detailed explanations for each answer
- For MCQ: answerKey MUST be one of the options
- Tag questions with relevant concepts

Return JSON:
{
  "moduleOrder": ${module.order},
  "questions": [
    {
      "type": "mcq",
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerKey": "Option B",
      "explanation": "Detailed explanation...",
      "difficulty": "medium",
      "tags": ["concept1", "concept2"]
    }
  ]
}`;

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert assessment designer. Create engaging quiz questions in JSON format.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No content in LLM response');

    const parsed = JSON.parse(content);
    return ModuleQuizSchema.parse(parsed);
  }
}

// ========================================
// MOCK PROVIDER (ALWAYS WORKS)
// ========================================

export class MockLLMProvider implements LLMProvider {
  async generateCourseSkeleton(input: {
    topic: string;
    level: string;
    timePerDay: number;
  }): Promise<CourseSkeleton> {
    // Deterministic mock data
    const modules = [
      {
        order: 1,
        title: `Introduction to ${input.topic}`,
        description: `Get started with the fundamentals of ${input.topic}. Build a strong foundation for your learning journey.`,
        outcomes: [
          `Understand what ${input.topic} is and why it matters`,
          'Set up your learning environment',
          'Complete your first practical exercise'
        ]
      },
      {
        order: 2,
        title: `Core Concepts of ${input.topic}`,
        description: `Dive deep into the essential concepts that power ${input.topic}. Master the building blocks.`,
        outcomes: [
          'Identify and explain key terminology',
          'Apply core concepts to simple problems',
          'Recognize common patterns'
        ]
      },
      {
        order: 3,
        title: `Practical Applications`,
        description: `Put your knowledge into practice with real-world scenarios and hands-on projects.`,
        outcomes: [
          'Build working examples from scratch',
          'Debug and troubleshoot issues',
          'Apply best practices'
        ]
      },
      {
        order: 4,
        title: `Advanced Techniques`,
        description: `Level up your skills with advanced patterns, optimization strategies, and professional workflows.`,
        outcomes: [
          'Implement advanced solutions',
          'Optimize for performance',
          'Understand trade-offs and design decisions'
        ]
      },
      {
        order: 5,
        title: `Mastery & Real Projects`,
        description: `Bring it all together with comprehensive projects and prepare for real-world challenges.`,
        outcomes: [
          'Complete end-to-end projects',
          'Integrate multiple concepts',
          'Deploy and share your work',
          'Know where to learn more'
        ]
      }
    ];

    return {
      topic: input.topic,
      level: input.level,
      modules
    };
  }

  async generateLessons(input: {
    topic: string;
    module: { order: number; title: string; description: string; outcomes: string[] };
    timePerDay: number;
  }): Promise<ModuleLessons> {
    const { module, timePerDay } = input;
    const stepsPerModule = Math.max(3, Math.floor(timePerDay / 10));

    const steps = [];
    for (let i = 1; i <= Math.min(stepsPerModule, 8); i++) {
      steps.push({
        order: i,
        title: `Step ${i}: ${module.title} - Part ${i}`,
        type: (i % 3 === 0 ? 'apply' : i % 2 === 0 ? 'practice' : 'learn') as 'learn' | 'practice' | 'apply',
        estimatedMinutes: Math.min(timePerDay, 15)
      });
    }

    return {
      moduleOrder: module.order,
      steps
    };
  }

  async generateQuiz(input: {
    topic: string;
    module: { order: number; title: string; description: string };
  }): Promise<ModuleQuiz> {
    const { module } = input;

    const questions = [
      {
        type: 'mcq' as const,
        question: `What is the main focus of ${module.title}?`,
        options: [
          module.description.substring(0, 50),
          'Understanding basic syntax',
          'Building complex applications',
          'Learning best practices'
        ],
        answerKey: module.description.substring(0, 50),
        explanation: `The module focuses on: ${module.description}`,
        difficulty: 'easy' as const,
        tags: ['overview', 'fundamentals']
      },
      {
        type: 'short' as const,
        question: `Explain one key concept from ${module.title}.`,
        options: undefined,
        answerKey: 'Key concepts include understanding the fundamentals and applying them practically.',
        explanation: 'This question tests your understanding of the module\'s core ideas.',
        difficulty: 'medium' as const,
        tags: ['concepts', 'understanding']
      },
      {
        type: 'mcq' as const,
        question: `Which approach is recommended in ${module.title}?`,
        options: [
          'Start with theory, then practice',
          'Skip the basics',
          'Memorize everything',
          'Only watch videos'
        ],
        answerKey: 'Start with theory, then practice',
        explanation: 'A balanced approach of learning concepts and practicing them is most effective.',
        difficulty: 'easy' as const,
        tags: ['methodology', 'learning']
      }
    ];

    return {
      moduleOrder: module.order,
      questions
    };
  }
}

// ========================================
// PROVIDER FACTORY
// ========================================

export function createLLMProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (apiKey && apiKey.length > 0) {
    console.log('[LLM Provider] Using OpenAI');
    return new OpenAIProvider(apiKey, model);
  } else {
    console.warn('[LLM Provider] No API key found, using Mock Provider');
    return new MockLLMProvider();
  }
}
