import { prisma } from '@/lib/prisma';

export const DEFAULT_ACHIEVEMENTS = [
  {
    key: 'streak_3',
    title: 'Spark Streak',
    description: 'Maintain a 3-day learning streak.',
    icon: 'flame',
    target: 3
  },
  {
    key: 'xp_1000',
    title: 'XP Booster',
    description: 'Earn 1,000 XP across modules.',
    icon: 'zap',
    target: 1000
  },
  {
    key: 'milestone_5',
    title: 'Milestone Collector',
    description: 'Complete 5 milestones.',
    icon: 'trophy',
    target: 5
  }
];

export const ensureBaseAchievements = async () => {
  for (const achievement of DEFAULT_ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: {},
      create: {
        key: achievement.key,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        target: achievement.target
      }
    });
  }
};

export const bootstrapUserProfile = async (userId: string) => {
  await ensureBaseAchievements();

  await prisma.profileStats.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      streak: 0,
      xp: 0,
      tier: 'Bronze',
      milestones: 0,
      languages: ['English'],
      skills: ['Learning agility'],
      badges: ['Momentum']
    }
  });

  const achievements = await prisma.achievement.findMany();
  for (const achievement of achievements) {
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
      update: {},
      create: {
        userId,
        achievementId: achievement.id,
        progress: 0,
        completed: false
      }
    });
  }

  await prisma.activity.create({
    data: {
      userId,
      type: 'welcome',
      message: 'Joined CREO and started a new journey!',
      metadata: { celebrated: false }
    }
  });
};
