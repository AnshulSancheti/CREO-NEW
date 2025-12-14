import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export type LearningStyle =
  | 'examples'
  | 'visual-metaphors'
  | 'formulas'
  | 'intuition-first'
  | 'default';

export type AttentionSpan = 'short' | 'medium' | 'long';

export type LearningPace = 'slow' | 'balanced' | 'fast';

export type UserProfile = {
  id: string;
  name: string;
  subjects: string[];
  goals: string;
  learningStyle: LearningStyle;
  attentionSpan: AttentionSpan;
  pastStruggles: string[];
  progressNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserPreferences = {
  id: string;
  userId: string;
  dailyTimeBudget: number; // minutes
  learningPace: LearningPace;
  remindersEnabled: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageRecord = {
  id: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  topic?: string | null;
  learningMode: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  frustrationScore: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type TopicProgress = {
  id: string;
  userId: string;
  topic: string;
  confidence: number;
  lastStatus: 'struggling' | 'steady' | 'improving';
  struggleCount: number;
  successCount: number;
  lastLearningMode: boolean;
  updatedAt: string;
  createdAt: string;
};

export type UserStats = {
  userId: string;
  xp: number;
  level: number;
  streakCount: number;
  lastActive: string | null;
  lastEarnedAt: string | null;
  hearts: number;
  maxHearts: number;
  createdAt: string;
};

export type Skill = {
  id: string;
  title: string;
  description: string;
  difficulty: 'intro' | 'intermediate' | 'advanced';
  displayOrder: number;
  parentId?: string | null;
  icon?: string | null;
  xpReward: number;
  lockedAtLevel: number;
};

export type LessonStep = {
  key: string;
  kind: 'reading' | 'choice' | 'code';
  prompt: string;
  options?: string[];
  answer?: string;
  hint?: string;
};

export type Lesson = {
  id: string;
  skillId: string;
  title: string;
  summary: string;
  steps: LessonStep[];
  estimatedTime: number;
};

export type LessonProgress = {
  lessonId: string;
  attempts: number;
  correct: number;
  incorrect: number;
  lastAttempt: string | null;
};

export type Quest = {
  id: string;
  title: string;
  type: 'daily' | 'weekly';
  metric: 'attempts' | 'xp';
  target: number;
  rewardXp: number;
  description?: string;
};

export type UserQuestProgress = {
  questId: string;
  progress: number;
  completedAt: string | null;
  claimed: boolean;
  updatedAt: string | null;
};

const DB_PATH = path.join(process.cwd(), 'data', 'learning.db');

let db: Database | null = null;

const XP_GROWTH = 1.12;
const XP_BASE = 60;
const XP_SCALE = 75;
const MAX_LEVEL = 60;
const DEFAULT_HEARTS = 5;

const ensureDatabase = (): Database => {
  if (db) return db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subjects TEXT DEFAULT '[]',
      goals TEXT DEFAULT '',
      learning_style TEXT DEFAULT 'default',
      attention_span TEXT DEFAULT 'medium',
      past_struggles TEXT DEFAULT '[]',
      progress_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      topic TEXT,
      learning_mode INTEGER DEFAULT 0,
      sentiment TEXT DEFAULT 'neutral',
      frustration_score REAL DEFAULT 0,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS topic_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      confidence REAL DEFAULT 0.35,
      last_status TEXT DEFAULT 'steady',
      struggle_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      last_learning_mode INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, topic),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT PRIMARY KEY,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak_count INTEGER DEFAULT 0,
      last_active TEXT,
      last_earned_at TEXT,
      hearts INTEGER DEFAULT 5,
      max_hearts INTEGER DEFAULT 5,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      daily_time_budget INTEGER DEFAULT 30,
      learning_pace TEXT DEFAULT 'balanced',
      reminders_enabled INTEGER DEFAULT 1,
      timezone TEXT DEFAULT 'UTC',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT DEFAULT 'intro',
      display_order INTEGER DEFAULT 0,
      parent_id TEXT,
      icon TEXT,
      xp_reward INTEGER DEFAULT 30,
      locked_at_level INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      skill_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT DEFAULT '',
      steps TEXT NOT NULL,
      estimated_time INTEGER DEFAULT 6,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      step_key TEXT,
      correct INTEGER DEFAULT 0,
      delta_xp INTEGER DEFAULT 0,
      heart_delta INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      UNIQUE(user_id, badge_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT NOT NULL,
      metric TEXT NOT NULL,
      target INTEGER NOT NULL,
      reward_xp INTEGER DEFAULT 20
    );

    CREATE TABLE IF NOT EXISTS user_quests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      quest_id TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      completed_at TEXT,
      claimed INTEGER DEFAULT 0,
      updated_at TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, quest_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
    );
  `);

  seedGameContent(db);

  return db;
};

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const xpForLevel = (level: number) => {
  if (level <= 1) return XP_BASE;
  return Math.round(XP_BASE + XP_SCALE * Math.pow(XP_GROWTH, level - 1));
};

const levelFromXp = (xp: number) => {
  let level = 1;
  let remainingXp = xp;

  while (level < MAX_LEVEL) {
    const needed = xpForLevel(level);
    if (remainingXp < needed) break;
    remainingXp -= needed;
    level += 1;
  }

  return level;
};

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

const seedGameContent = (database: Database) => {
  const skillCount = database.prepare(`SELECT COUNT(*) as count FROM skills`).get() as { count: number };
  if (skillCount.count === 0) {
    const skills: Skill[] = [
      {
        id: 'skill-algo-foundations',
        title: 'Algorithms Warmup',
        description: 'Master loops, conditionals, and thinking in steps before diving deep.',
        difficulty: 'intro',
        displayOrder: 1,
        icon: '⏩',
        xpReward: 30,
        lockedAtLevel: 1,
        parentId: null
      },
      {
        id: 'skill-data-structures',
        title: 'Data Structures',
        description: 'Build intuition for arrays, stacks, queues, and hash maps with visuals.',
        difficulty: 'intermediate',
        displayOrder: 2,
        icon: '🧩',
        xpReward: 45,
        lockedAtLevel: 3,
        parentId: 'skill-algo-foundations'
      },
      {
        id: 'skill-systems',
        title: 'Systems Thinking',
        description: 'Threads, queues, and backpressure — learn the mental models for scaling.',
        difficulty: 'advanced',
        displayOrder: 3,
        icon: '🚀',
        xpReward: 70,
        lockedAtLevel: 6,
        parentId: 'skill-data-structures'
      }
    ];

    const lessons: Array<Lesson & { steps: LessonStep[] }> = [
      {
        id: 'lesson-loops',
        skillId: 'skill-algo-foundations',
        title: 'Loops Without Getting Lost',
        summary: 'Practice for/while loops and when to stop iterating.',
        estimatedTime: 6,
        steps: [
          { key: 'intro', kind: 'reading', prompt: 'A loop is a repeatable story. Each line is a beat.' },
          { key: 'choice-1', kind: 'choice', prompt: 'Which loop lets you exit early with break?', options: ['for', 'while', 'both'], answer: 'both', hint: 'Both loops respect break.' },
          { key: 'code-1', kind: 'code', prompt: 'Write a for..of loop over numbers = [1,2,3] that logs only even values.', hint: 'Use if (num % 2 === 0) continue;' }
        ]
      },
      {
        id: 'lesson-arrays',
        skillId: 'skill-data-structures',
        title: 'Arrays vs Hash Maps',
        summary: 'Index vs lookup — how to pick the right container.',
        estimatedTime: 7,
        steps: [
          { key: 'intro', kind: 'reading', prompt: 'Arrays shine with order; hash maps shine with labels.' },
          { key: 'choice-1', kind: 'choice', prompt: 'Best structure for counting word frequency?', options: ['array', 'hash map', 'stack'], answer: 'hash map', hint: 'You want label → count.' },
          { key: 'choice-2', kind: 'choice', prompt: 'Best structure for ordered leaderboard where you only append?', options: ['array', 'queue', 'hash map'], answer: 'array' }
        ]
      },
      {
        id: 'lesson-queues',
        skillId: 'skill-systems',
        title: 'Queues and Backpressure',
        summary: 'Balance producers and consumers without dropping work.',
        estimatedTime: 8,
        steps: [
          { key: 'intro', kind: 'reading', prompt: 'Queues keep pressure contained. Slow consumers? Grow the buffer or shed load.' },
          { key: 'choice-1', kind: 'choice', prompt: 'Signal that tells producers to slow down?', options: ['backpressure', 'cache', 'mutex'], answer: 'backpressure' },
          { key: 'choice-2', kind: 'choice', prompt: 'What helps avoid queue explosion?', options: ['batching', 'more logs', 'longer timeouts'], answer: 'batching', hint: 'Batching amortizes overhead.' }
        ]
      }
    ];

    const quests: Quest[] = [
      {
        id: 'quest-daily-steps',
        title: 'Complete 3 lesson steps',
        description: 'Stay warm: knock out three steps today.',
        type: 'daily',
        metric: 'attempts',
        target: 3,
        rewardXp: 30
      },
      {
        id: 'quest-daily-xp',
        title: 'Earn 60 XP',
        description: 'Push the meter and unlock the glow.',
        type: 'daily',
        metric: 'xp',
        target: 60,
        rewardXp: 40
      },
      {
        id: 'quest-weekly-learner',
        title: 'Earn 300 XP this week',
        description: 'Consistency beats sprints. Steady climb.',
        type: 'weekly',
        metric: 'xp',
        target: 300,
        rewardXp: 120
      }
    ];

    const badges = [
      { id: 'badge-streak-3', name: 'Heat Check', description: 'Keep a 3-day streak', icon: '🔥' },
      { id: 'badge-streak-7', name: 'Weekly Blaze', description: 'Maintain a 7-day streak', icon: '🌟' }
    ];

    const insertSkill = database.prepare(`
      INSERT OR REPLACE INTO skills (id, title, description, difficulty, display_order, parent_id, icon, xp_reward, locked_at_level)
      VALUES (@id, @title, @description, @difficulty, @displayOrder, @parentId, @icon, @xpReward, @lockedAtLevel)
    `);
    const insertLesson = database.prepare(`
      INSERT OR REPLACE INTO lessons (id, skill_id, title, summary, steps, estimated_time)
      VALUES (@id, @skillId, @title, @summary, @steps, @estimatedTime)
    `);
    const insertQuest = database.prepare(`
      INSERT OR REPLACE INTO quests (id, title, description, type, metric, target, reward_xp)
      VALUES (@id, @title, @description, @type, @metric, @target, @rewardXp)
    `);
    const insertBadge = database.prepare(`
      INSERT OR REPLACE INTO badges (id, name, description, icon)
      VALUES (@id, @name, @description, @icon)
    `);

    const transaction = database.transaction(() => {
      skills.forEach((skill) => insertSkill.run(skill));
      lessons.forEach((lesson) => {
        insertLesson.run({ ...lesson, steps: JSON.stringify(lesson.steps) });
      });
      quests.forEach((quest) => insertQuest.run(quest));
      badges.forEach((badge) => insertBadge.run(badge));
    });

    transaction();
  }
};

const ensureUserStats = (userId: string): UserStats => {
  const database = ensureDatabase();
  const existing = database
    .prepare(
      `
        SELECT user_id as userId, xp, level, streak_count as streakCount, last_active as lastActive,
               last_earned_at as lastEarnedAt, hearts, max_hearts as maxHearts, created_at as createdAt
        FROM user_stats WHERE user_id = ?
      `
    )
    .get(userId) as UserStats | undefined;

  if (existing) return existing;

  const now = new Date().toISOString();
  database
    .prepare(
      `
        INSERT INTO user_stats (user_id, xp, level, streak_count, last_active, last_earned_at, hearts, max_hearts, created_at)
        VALUES (?, 0, 1, 0, ?, null, ?, ?, ?)
      `
    )
    .run(userId, now, DEFAULT_HEARTS, DEFAULT_HEARTS, now);

  return {
    userId,
    xp: 0,
    level: 1,
    streakCount: 0,
    lastActive: now,
    lastEarnedAt: null,
    hearts: DEFAULT_HEARTS,
    maxHearts: DEFAULT_HEARTS,
    createdAt: now
  };
};

const updateStreak = (stats: UserStats, activityDate: Date) => {
  const todayKey = dayKey(activityDate);
  const lastActiveKey = stats.lastActive ? stats.lastActive.slice(0, 10) : null;
  let streakCount = stats.streakCount;

  if (!lastActiveKey) {
    streakCount = 1;
  } else {
    const yesterday = new Date(activityDate);
    yesterday.setDate(activityDate.getDate() - 1);
    const yesterdayKey = dayKey(yesterday);
    if (lastActiveKey === todayKey) {
      streakCount = stats.streakCount || 1;
    } else if (lastActiveKey === yesterdayKey) {
      streakCount = stats.streakCount + 1;
    } else {
      streakCount = 1;
    }
  }

  return streakCount;
};

const upsertUserQuestProgress = (userId: string, quest: Quest, delta: { xp?: number; attempts?: number }) => {
  const database = ensureDatabase();
  const now = new Date().toISOString();
  const existing = database
    .prepare(
      `
        SELECT id, progress, completed_at as completedAt, claimed, updated_at as updatedAt, created_at as createdAt
        FROM user_quests WHERE user_id = ? AND quest_id = ?
      `
    )
    .get(userId, quest.id) as
    | { id: string; progress: number; completedAt: string | null; claimed: number; updatedAt: string | null; createdAt: string }
    | undefined;

  const deltaValue = quest.metric === 'xp' ? delta.xp ?? 0 : delta.attempts ?? 0;
  const nextProgress = Math.min(quest.target, (existing?.progress ?? 0) + deltaValue);
  const completedAt = nextProgress >= quest.target ? now : existing?.completedAt ?? null;
  const claimed = existing?.claimed ?? 0;

  const id = existing?.id ?? randomUUID();
  database
    .prepare(
      `
        INSERT INTO user_quests (id, user_id, quest_id, progress, completed_at, claimed, updated_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, quest_id) DO UPDATE SET
          progress = excluded.progress,
          completed_at = excluded.completed_at,
          updated_at = excluded.updated_at
      `
    )
    .run(id, userId, quest.id, nextProgress, completedAt, claimed, now, existing?.createdAt ?? now);

  return { questId: quest.id, progress: nextProgress, completedAt, claimed: Boolean(claimed), updatedAt: now };
};

export const listQuestsForUser = (userId: string): Array<Quest & { progress: UserQuestProgress }> => {
  const database = ensureDatabase();
  const quests = database
    .prepare(`SELECT id, title, description, type, metric, target, reward_xp as rewardXp FROM quests`)
    .all() as Quest[];

  return quests.map((quest) => {
    const progress = database
      .prepare(
        `
          SELECT quest_id as questId, progress, completed_at as completedAt, claimed, updated_at as updatedAt
          FROM user_quests WHERE user_id = ? AND quest_id = ?
        `
      )
      .get(userId, quest.id) as (UserQuestProgress & { claimed: number }) | undefined;

    return {
      ...quest,
      progress: progress
        ? { ...progress, claimed: Boolean(progress.claimed) }
        : {
            questId: quest.id,
            progress: 0,
            completedAt: null,
            claimed: false,
            updatedAt: null
          }
    };
  });
};

export const listSkillsWithProgress = (userId: string): Array<Skill & { locked: boolean; completion: number }> => {
  const database = ensureDatabase();
  const rows = database
    .prepare(
      `
        SELECT id, title, description, difficulty, display_order as displayOrder, parent_id as parentId,
               icon, xp_reward as xpReward, locked_at_level as lockedAtLevel
        FROM skills
        ORDER BY display_order ASC
      `
    )
    .all() as Skill[];

  const stats = ensureUserStats(userId);
  const attempts = database
    .prepare(
      `
        SELECT lesson_id as lessonId, COUNT(*) as total, SUM(correct) as correct
        FROM attempts WHERE user_id = ?
        GROUP BY lesson_id
      `
    )
    .all(userId) as Array<{ lessonId: string; total: number; correct: number | null }>;

  const lessonCounts = database
    .prepare(`SELECT skill_id as skillId, COUNT(*) as lessonCount FROM lessons GROUP BY skill_id`)
    .all() as Array<{ skillId: string; lessonCount: number }>;

  return rows.map((skill) => {
    const relevantLessons = lessonCounts.find((row) => row.skillId === skill.id)?.lessonCount ?? 0;
    const attemptsForSkill = attempts.filter((attempt) => {
      const lesson = database
        .prepare(`SELECT skill_id as skillId FROM lessons WHERE id = ?`)
        .get(attempt.lessonId) as { skillId: string } | undefined;
      return lesson?.skillId === skill.id;
    });

    const correctAttempts = attemptsForSkill.reduce((sum, entry) => sum + (entry.correct ?? 0), 0);
    const completion = relevantLessons ? Math.min(1, correctAttempts / relevantLessons) : 0;

    return {
      ...skill,
      locked: stats.level < skill.lockedAtLevel,
      completion
    };
  });
};

export const createUserProfile = (data: Partial<UserProfile>): UserProfile => {
  const database = ensureDatabase();
  const id = data.id ?? randomUUID();
  const now = new Date().toISOString();

  const subjects = data.subjects ?? [];
  const pastStruggles = data.pastStruggles ?? [];

  database
    .prepare(
      `
        INSERT INTO users (id, name, subjects, goals, learning_style, attention_span, past_struggles, progress_notes, created_at, updated_at)
        VALUES (@id, @name, @subjects, @goals, @learningStyle, @attentionSpan, @pastStruggles, @progressNotes, @createdAt, @updatedAt)
      `
    )
    .run({
      id,
      name: data.name ?? 'Learner',
      subjects: JSON.stringify(subjects),
      goals: data.goals ?? '',
      learningStyle: data.learningStyle ?? 'default',
      attentionSpan: data.attentionSpan ?? 'medium',
      pastStruggles: JSON.stringify(pastStruggles),
      progressNotes: data.progressNotes ?? '',
      createdAt: now,
      updatedAt: now
    });

  const profile = getUserProfile(id)!;
  ensureUserStats(id);
  return profile;
};

export const updateUserProfile = (id: string, data: Partial<UserProfile>): UserProfile | null => {
  const database = ensureDatabase();
  const existing = getUserProfile(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const merged: UserProfile = {
    ...existing,
    ...data,
    subjects: data.subjects ?? existing.subjects,
    pastStruggles: data.pastStruggles ?? existing.pastStruggles,
    learningStyle: data.learningStyle ?? existing.learningStyle,
    attentionSpan: data.attentionSpan ?? existing.attentionSpan,
    updatedAt: now
  };

  database
    .prepare(
      `
        UPDATE users
        SET name = @name,
            subjects = @subjects,
            goals = @goals,
            learning_style = @learningStyle,
            attention_span = @attentionSpan,
            past_struggles = @pastStruggles,
            progress_notes = @progressNotes,
            updated_at = @updatedAt
        WHERE id = @id
      `
    )
    .run({
      id,
      name: merged.name,
      subjects: JSON.stringify(merged.subjects),
      goals: merged.goals ?? '',
      learningStyle: merged.learningStyle,
      attentionSpan: merged.attentionSpan,
      pastStruggles: JSON.stringify(merged.pastStruggles),
      progressNotes: merged.progressNotes ?? '',
      updatedAt: now
    });

  const profile = getUserProfile(id);
  if (profile) ensureUserStats(id);
  return profile;
};

export const getOrCreateUser = (data?: Partial<UserProfile>): UserProfile => {
  if (data?.id) {
    const existing = getUserProfile(data.id);
    if (existing) {
      ensureUserStats(existing.id);
      return existing;
    }
  }

  return createUserProfile({
    id: data?.id,
    name: data?.name ?? 'Explorer',
    subjects: data?.subjects ?? ['algorithms'],
    goals: data?.goals ?? 'Grow my intuition and keep a streak',
    learningStyle: data?.learningStyle ?? 'intuition-first',
    attentionSpan: data?.attentionSpan ?? 'medium',
    pastStruggles: data?.pastStruggles ?? ['loops', 'debugging'],
    progressNotes: data?.progressNotes ?? ''
  });
};

export const getUserProfile = (id: string): UserProfile | null => {
  const database = ensureDatabase();
  const row = database
    .prepare(
      `
        SELECT id, name, subjects, goals, learning_style as learningStyle, attention_span as attentionSpan,
               past_struggles as pastStruggles, progress_notes as progressNotes, created_at as createdAt, updated_at as updatedAt
        FROM users WHERE id = ?
      `
    )
    .get(id);

  if (!row) return null;

  return {
    ...row,
    subjects: parseJson<string[]>(row.subjects, []),
    pastStruggles: parseJson<string[]>(row.pastStruggles, [])
  };
};

export const listTopicProgress = (userId: string): TopicProgress[] => {
  const database = ensureDatabase();
  const rows = database
    .prepare(
      `
        SELECT id, user_id as userId, topic, confidence, last_status as lastStatus,
               struggle_count as struggleCount, success_count as successCount,
               last_learning_mode as lastLearningMode, updated_at as updatedAt, created_at as createdAt
        FROM topic_progress WHERE user_id = ? ORDER BY updated_at DESC
      `
    )
    .all(userId);

  return rows.map((row) => ({
    ...row,
    lastLearningMode: Boolean(row.lastLearningMode)
  }));
};

export const upsertTopicProgress = (params: {
  userId: string;
  topic: string;
  learningMode: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  frustrationScore?: number;
}) => {
  const database = ensureDatabase();
  const now = new Date().toISOString();
  const existing = database
    .prepare(
      `
        SELECT id, confidence, struggle_count as struggleCount, success_count as successCount
        FROM topic_progress WHERE user_id = ? AND topic = ?
      `
    )
    .get(params.userId, params.topic) as
    | { id: string; confidence: number; struggleCount: number; successCount: number }
    | undefined;

  let confidence = existing?.confidence ?? 0.35;
  let struggleCount = existing?.struggleCount ?? 0;
  let successCount = existing?.successCount ?? 0;

  if (params.sentiment === 'positive') {
    confidence = Math.min(0.95, confidence + 0.08);
    successCount += 1;
  } else if (params.sentiment === 'negative') {
    confidence = Math.max(0.05, confidence - 0.05);
    struggleCount += 1;
  } else if (params.learningMode) {
    confidence = Math.max(0.1, confidence - 0.02);
    struggleCount += 1;
  } else {
    confidence = Math.min(0.9, confidence + 0.01);
  }

  const lastStatus: TopicProgress['lastStatus'] =
    struggleCount > successCount + 1 ? 'struggling' : confidence > 0.6 ? 'improving' : 'steady';

  if (existing) {
    database
      .prepare(
        `
          UPDATE topic_progress
          SET confidence = ?, last_status = ?, struggle_count = ?, success_count = ?,
              last_learning_mode = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(confidence, lastStatus, struggleCount, successCount, params.learningMode ? 1 : 0, now, existing.id);
    return listTopicProgress(params.userId).find((item) => item.topic === params.topic);
  }

  const id = randomUUID();
  database
    .prepare(
      `
        INSERT INTO topic_progress
          (id, user_id, topic, confidence, last_status, struggle_count, success_count, last_learning_mode, updated_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(id, params.userId, params.topic, confidence, lastStatus, struggleCount, successCount, params.learningMode ? 1 : 0, now, now);

  return listTopicProgress(params.userId).find((item) => item.topic === params.topic);
};

export const recordMessage = (message: Omit<MessageRecord, 'createdAt' | 'id'> & { id?: string }) => {
  const database = ensureDatabase();
  const now = new Date().toISOString();
  const id = message.id ?? randomUUID();

  database
    .prepare(
      `
        INSERT INTO messages (id, user_id, role, content, topic, learning_mode, sentiment, frustration_score, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      id,
      message.userId,
      message.role,
      message.content,
      message.topic ?? null,
      message.learningMode ? 1 : 0,
      message.sentiment,
      message.frustrationScore ?? 0,
      message.metadata ? JSON.stringify(message.metadata) : null,
      now
    );

  return { ...message, id, createdAt: now };
};

export const getRecentMessages = (userId: string, limit = 15): MessageRecord[] => {
  const database = ensureDatabase();
  const rows = database
    .prepare(
      `
        SELECT id, user_id as userId, role, content, topic,
               learning_mode as learningMode, sentiment, frustration_score as frustrationScore,
               metadata, created_at as createdAt
        FROM messages
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC
        LIMIT ?
      `
    )
    .all(userId, limit)
    .reverse();

  return rows.map((row) => ({
    ...row,
    learningMode: Boolean(row.learningMode),
    metadata: parseJson<Record<string, unknown>>(row.metadata, {})
  }));
};

export const listUsers = (): UserProfile[] => {
  const database = ensureDatabase();
  const rows = database
    .prepare(
      `
        SELECT id, name, subjects, goals, learning_style as learningStyle, attention_span as attentionSpan,
               past_struggles as pastStruggles, progress_notes as progressNotes, created_at as createdAt, updated_at as updatedAt
        FROM users ORDER BY datetime(created_at) DESC
      `
    )
    .all();

  return rows.map((row) => ({
    ...row,
    subjects: parseJson<string[]>(row.subjects, []),
    pastStruggles: parseJson<string[]>(row.pastStruggles, [])
  }));
};

export const getUserStats = (userId: string): UserStats => ensureUserStats(userId);

export const getLessonById = (lessonId: string): Lesson | null => {
  const database = ensureDatabase();
  const row = database
    .prepare(
      `
        SELECT id, skill_id as skillId, title, summary, steps, estimated_time as estimatedTime
        FROM lessons WHERE id = ?
      `
    )
    .get(lessonId) as
    | {
        id: string;
        skillId: string;
        title: string;
        summary: string;
        steps: string;
        estimatedTime: number;
      }
    | undefined;

  if (!row) return null;
  return { ...row, steps: parseJson<LessonStep[]>(row.steps, []) };
};

export const listLessonsForSkill = (skillId: string): Lesson[] => {
  const database = ensureDatabase();
  const rows = database
    .prepare(
      `
        SELECT id, skill_id as skillId, title, summary, steps, estimated_time as estimatedTime
        FROM lessons WHERE skill_id = ?
        ORDER BY title ASC
      `
    )
    .all(skillId) as Array<{
      id: string;
      skillId: string;
      title: string;
      summary: string;
      steps: string;
      estimatedTime: number;
    }>;

  return rows.map((row) => ({ ...row, steps: parseJson<LessonStep[]>(row.steps, []) }));
};

export const recordAttempt = (params: { userId: string; lessonId: string; stepKey?: string | null; correct: boolean }) => {
  const database = ensureDatabase();
  const now = new Date();
  const nowIso = now.toISOString();
  const stats = ensureUserStats(params.userId);

  const deltaXp = params.correct ? 20 : 8;
  const heartDelta = params.correct ? 0 : stats.hearts > 0 ? -1 : 0;
  const hearts = Math.max(0, Math.min(stats.maxHearts, stats.hearts + heartDelta));
  const xpTotal = Math.max(0, stats.xp + deltaXp);
  const level = levelFromXp(xpTotal);
  const streakCount = updateStreak(stats, now);

  database
    .prepare(
      `
        UPDATE user_stats
        SET xp = ?, level = ?, streak_count = ?, last_active = ?, last_earned_at = ?, hearts = ?
        WHERE user_id = ?
      `
    )
    .run(xpTotal, level, streakCount, nowIso, nowIso, hearts, params.userId);

  const attemptId = randomUUID();
  database
    .prepare(
      `
        INSERT INTO attempts (id, user_id, lesson_id, step_key, correct, delta_xp, heart_delta, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      attemptId,
      params.userId,
      params.lessonId,
      params.stepKey ?? null,
      params.correct ? 1 : 0,
      deltaXp,
      heartDelta,
      nowIso
    );

  const quests = listQuestsForUser(params.userId);
  quests.forEach((quest) =>
    upsertUserQuestProgress(params.userId, quest, { xp: deltaXp, attempts: 1 })
  );

  const updatedStats = getUserStats(params.userId);
  const lesson = getLessonById(params.lessonId);

  return {
    attempt: {
      id: attemptId,
      createdAt: nowIso,
      correct: params.correct,
      deltaXp,
      heartDelta,
      lessonId: params.lessonId,
      stepKey: params.stepKey ?? null
    },
    stats: updatedStats,
    lesson
  };
};

export const claimQuestReward = (userId: string, questId: string) => {
  const database = ensureDatabase();
  const quest = database
    .prepare(`SELECT id, title, description, type, metric, target, reward_xp as rewardXp FROM quests WHERE id = ?`)
    .get(questId) as Quest | undefined;
  if (!quest) return null;

  const progress = database
    .prepare(
      `
        SELECT quest_id as questId, progress, completed_at as completedAt, claimed
        FROM user_quests WHERE user_id = ? AND quest_id = ?
      `
    )
    .get(userId, questId) as UserQuestProgress | undefined;

  if (!progress || !progress.completedAt || progress.claimed) return null;

  const stats = ensureUserStats(userId);
  const newXp = stats.xp + quest.rewardXp;
  const newLevel = levelFromXp(newXp);
  const now = new Date().toISOString();

  database
    .prepare(`UPDATE user_stats SET xp = ?, level = ?, last_earned_at = ? WHERE user_id = ?`)
    .run(newXp, newLevel, now, userId);

  database
    .prepare(`UPDATE user_quests SET claimed = 1, updated_at = ? WHERE user_id = ? AND quest_id = ?`)
    .run(now, userId, questId);

  return { questId, rewardXp: quest.rewardXp, stats: getUserStats(userId) };
};

export const getGameState = (userId: string) => {
  const profile = getUserProfile(userId);
  if (!profile) return null;

  const stats = getUserStats(userId);
  const skills = listSkillsWithProgress(userId);
  const quests = listQuestsForUser(userId);

  return { profile, stats, skills, quests };
};


// ========================================
// USER PREFERENCES
// ========================================

export const getUserPreferences = (userId: string): UserPreferences | null => {
  const database = ensureDatabase();
  const row = database
    .prepare(
      `
      SELECT * FROM user_preferences WHERE user_id = ?
    `
    )
    .get(userId) as any;

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    dailyTimeBudget: row.daily_time_budget,
    learningPace: row.learning_pace as LearningPace,
    remindersEnabled: Boolean(row.reminders_enabled),
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const createUserPreferences = (
  userId: string,
  data?: Partial<UserPreferences>
): UserPreferences => {
  const database = ensureDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  database
    .prepare(
      `
      INSERT INTO user_preferences (id, user_id, daily_time_budget, learning_pace, reminders_enabled, timezone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      id,
      userId,
      data?.dailyTimeBudget ?? 30,
      data?.learningPace ?? 'balanced',
      data?.remindersEnabled !== false ? 1 : 0,
      data?.timezone ?? 'UTC',
      now,
      now
    );

  return getUserPreferences(userId)!;
};

export const getOrCreateUserPreferences = (userId: string): UserPreferences => {
  const existing = getUserPreferences(userId);
  if (existing) return existing;
  return createUserPreferences(userId);
};

export const updateUserPreferences = (
  userId: string,
  data: Partial<Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): UserPreferences | null => {
  const database = ensureDatabase();
  const existing = getUserPreferences(userId);
  if (!existing) return null;

  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: any[] = [];

  if (data.dailyTimeBudget !== undefined) {
    updates.push('daily_time_budget = ?');
    values.push(data.dailyTimeBudget);
  }
  if (data.learningPace !== undefined) {
    updates.push('learning_pace = ?');
    values.push(data.learningPace);
  }
  if (data.remindersEnabled !== undefined) {
    updates.push('reminders_enabled = ?');
    values.push(data.remindersEnabled ? 1 : 0);
  }
  if (data.timezone !== undefined) {
    updates.push('timezone = ?');
    values.push(data.timezone);
  }

  if (updates.length === 0) return existing;

  updates.push('updated_at = ?');
  values.push(now);
  values.push(userId);

  database
    .prepare(`UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`)
    .run(...values);

  return getUserPreferences(userId);
};

