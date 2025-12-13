'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Playfair_Display, Space_Grotesk } from 'next/font/google';
import {
  BellRing,
  Calendar,
  Flame,
  Trophy,
  Zap,
  Crown,
  Activity as ActivityIcon
} from 'lucide-react';

const headlineFont = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'] });
const bodyFont = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'] });

type Stats = {
  streak: number;
  xp: number;
  tier: string;
  milestones: number;
  languages?: string[] | null;
  skills?: string[] | null;
  badges?: string[] | null;
};

type User = {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  createdAt: string;
};

type AchievementRecord = {
  id: string;
  progress: number;
  completed: boolean;
  updatedAt: string;
  achievement: {
    id: string;
    key: string;
    title: string;
    description: string;
    icon: string;
    target: number;
  };
};

type Activity = {
  id: string;
  type: string;
  message: string;
  metadata?: any;
  createdAt: string;
};

type FollowUser = {
  id: string;
  username: string | null;
  fullName: string | null;
  xp: number;
  joined: string;
};

const TOKEN_KEY = 'creoAuthToken';

const gradientAccent = 'from-orange-500 via-pink-500 to-purple-600';
const panelBg = 'bg-[#0f111a]';
const cardBg = 'bg-[#151828]';

const formatDate = (value?: string) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value)
  );
};

const GradientBadge = ({ children }: { children: React.ReactNode }) => (
  <span className={`rounded-full bg-gradient-to-r ${gradientAccent} px-3 py-1 text-xs font-semibold text-white`}>
    {children}
  </span>
);

export default function ProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFollowTab, setActiveFollowTab] = useState<'followers' | 'following'>('followers');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState<string | null>(null);

  const followingIds = useMemo(() => new Set(following.map((f) => f.id)), [following]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!stored) {
      router.replace('/auth');
      return;
    }
    setToken(stored);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const meRes = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });
        if (meRes.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          router.replace('/auth');
          return;
        }
        const mePayload = await meRes.json();
        if (!meRes.ok || !mePayload?.success) throw new Error(mePayload?.error || 'Failed to load profile');
        const meUser: User = mePayload.data.user;
        setUser(meUser);
        setStats(mePayload.data.stats);
        setFollowersCount(mePayload.data.followers);
        setFollowingCount(mePayload.data.following);

        const [profileRes, achievementsRes, activityRes, followersRes, followingRes] = await Promise.all([
          fetch(`/api/users/${meUser.id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/users/${meUser.id}/achievements`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/users/${meUser.id}/activity`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/users/${meUser.id}/followers`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/users/${meUser.id}/following`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const [profileData, achData, actData, followerData, followingData] = await Promise.all([
          profileRes.json(),
          achievementsRes.json(),
          activityRes.json(),
          followersRes.json(),
          followingRes.json()
        ]);

        if (!profileRes.ok || !profileData?.success) throw new Error(profileData?.error || 'Failed to load profile');
        if (!achievementsRes.ok || !achData?.success) throw new Error(achData?.error || 'Failed to load achievements');
        if (!activityRes.ok || !actData?.success) throw new Error(actData?.error || 'Failed to load activity');
        if (!followersRes.ok || !followerData?.success) throw new Error(followerData?.error || 'Failed to load followers');
        if (!followingRes.ok || !followingData?.success) throw new Error(followingData?.error || 'Failed to load following');

        setStats(profileData.data.stats);
        setAchievements(achData.data);
        setActivities(actData.data);
        setFollowers(followerData.data);
        setFollowing(followingData.data);
        setFollowersCount(profileData.data.followers ?? followerData.data?.length ?? 0);
        setFollowingCount(profileData.data.following ?? followingData.data?.length ?? 0);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token, router]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setAvatarUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCelebrate = async (activityId: string) => {
    if (!token) return;
    setCelebrating(activityId);
    try {
      const res = await fetch(`/api/activity/${activityId}/celebrate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActivities((prev) =>
          prev.map((act) =>
            act.id === activityId
              ? { ...act, metadata: { ...(act.metadata || {}), celebrated: true } }
              : act
          )
        );
      }
    } finally {
      setCelebrating(null);
    }
  };

  const toggleFollow = async (targetId: string, currentlyFollowing: boolean, userData?: FollowUser) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/users/${targetId}/follow`, {
        method: currentlyFollowing ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to update follow');
      if (currentlyFollowing) {
        setFollowing((prev) => prev.filter((u) => u.id !== targetId));
        setFollowingCount((c) => Math.max(0, c - 1));
      } else if (userData) {
        setFollowing((prev) => [...prev, userData]);
        setFollowingCount((c) => c + 1);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to update follow state right now.');
    }
  };

  const renderStatCard = (label: string, value: string | number, icon: React.ReactNode, accent: string) => (
    <div className={`${cardBg} rounded-2xl border border-white/5 p-4 shadow-lg transition hover:-translate-y-0.5`}>
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{label}</p>
          <p className="text-xl font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0a0f] via-[#0f121c] to-[#0b0c12] text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-300">Loading your profile…</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0a0f] via-[#0f121c] to-[#0b0c12] text-slate-100 flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-300">Error: {error || 'Unable to load profile.'}</p>
        <button
          onClick={() => router.replace('/auth')}
          className="rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg"
        >
          Go to auth
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0b0a0f] via-[#0f121c] to-[#0b0c12] text-slate-100 ${bodyFont.className}`}>
      <div className="flex">
        <aside className="sticky top-0 h-screen w-64 flex-shrink-0 border-r border-white/5 bg-[#0c0e17]/90 px-6 py-8 backdrop-blur">
          <div className="flex items-center gap-2 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 text-lg font-bold text-white">
              ∞
            </div>
            <span className={`${headlineFont.className} text-xl font-semibold text-white`}>CREO</span>
          </div>
          <nav className="space-y-2 text-sm font-medium text-slate-300">
            {[
              { label: 'Learn', href: '/' },
              { label: 'Practice', href: '/course' },
              { label: 'Leaderboards', href: '/leaderboards' },
              { label: 'Quests', href: '/quests' },
              { label: 'Profile', href: '/profile', active: true }
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 transition ${
                  item.active
                    ? 'bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-600/20 text-white border border-white/10'
                    : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <span className="text-xs">•</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 px-4 py-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <section className="space-y-6">
              <div className={`${cardBg} rounded-3xl border border-white/5 p-6 shadow-2xl`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 shadow-lg ring-2 ring-white/10 overflow-hidden">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                            {(user.fullName || user.username || 'C')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-3 left-1/2 -translate-x-1/2 cursor-pointer rounded-full bg-white/10 px-3 py-1 text-xs text-white shadow">
                        Edit
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} aria-label="Upload avatar" />
                      </label>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Profile</p>
                      <h1 className={`${headlineFont.className} text-3xl text-white`}>{user.fullName || 'Learner'}</h1>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                        <span>@{user.username || 'user'}</span>
                        <span className="text-white/20">•</span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="h-4 w-4" />
                          Joined {formatDate(user.createdAt)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stats?.badges?.map((badge) => (
                          <GradientBadge key={badge}>{badge}</GradientBadge>
                        ))}
                        {stats?.languages?.map((lang) => (
                          <span key={lang} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                            {lang}
                          </span>
                        ))}
                        {stats?.skills?.map((skill) => (
                          <span key={skill} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveFollowTab('followers')}
                      className="flex flex-col rounded-2xl border border-white/10 px-4 py-3 text-left hover:border-white/20"
                    >
                      <span className="text-xs uppercase tracking-[0.35em] text-slate-400">Followers</span>
                      <span className="text-xl font-semibold text-white">{followersCount}</span>
                    </button>
                    <button
                      onClick={() => setActiveFollowTab('following')}
                      className="flex flex-col rounded-2xl border border-white/10 px-4 py-3 text-left hover:border-white/20"
                    >
                      <span className="text-xs uppercase tracking-[0.35em] text-slate-400">Following</span>
                      <span className="text-xl font-semibold text-white">{followingCount}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {renderStatCard('Streak', `${stats?.streak ?? 0} days`, <Flame className="h-5 w-5" />, 'from-orange-500 to-pink-500')}
                {renderStatCard('Total XP', stats?.xp ?? 0, <Zap className="h-5 w-5" />, 'from-purple-500 to-blue-500')}
                {renderStatCard('Tier', stats?.tier ?? 'Bronze', <Crown className="h-5 w-5" />, 'from-teal-500 to-emerald-500')}
                {renderStatCard('Milestones', stats?.milestones ?? 0, <Trophy className="h-5 w-5" />, 'from-amber-500 to-orange-500')}
              </div>

              <div className={`${cardBg} rounded-3xl border border-white/5 p-6 shadow-2xl`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Achievements</p>
                    <h2 className={`${headlineFont.className} text-2xl text-white`}>Keep the momentum</h2>
                  </div>
                  <button className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-white/20">
                    View all
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {achievements.map((item) => {
                    const pct = Math.min(100, Math.round((item.progress / item.achievement.target) * 100));
                    const icon =
                      item.achievement.icon === 'flame' ? (
                        <Flame className="h-4 w-4" />
                      ) : item.achievement.icon === 'zap' ? (
                        <Zap className="h-4 w-4" />
                      ) : (
                        <Trophy className="h-4 w-4" />
                      );
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg transition hover:-translate-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-orange-200">{icon}</div>
                          {item.completed ? (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[0.7rem] font-semibold text-emerald-200">
                              Completed
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">{pct}%</span>
                          )}
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-white">{item.achievement.title}</h3>
                        <p className="text-xs text-slate-400">{item.achievement.description}</p>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[0.75rem] text-slate-400">
                          {item.progress} / {item.achievement.target}
                        </p>
                      </div>
                    );
                  })}
                  {achievements.length === 0 && <p className="text-sm text-slate-400">No achievements yet.</p>}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className={`${cardBg} rounded-3xl border border-white/5 p-5 shadow-xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Activity</p>
                    <h3 className={`${headlineFont.className} text-xl text-white`}>Live feed</h3>
                  </div>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 flex items-center gap-1">
                    <BellRing className="h-4 w-4" /> Live
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {activities.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 text-white">
                            <ActivityIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm text-white">{event.message}</p>
                            <p className="text-[0.75rem] text-slate-400">{formatDate(event.createdAt)}</p>
                          </div>
                        </div>
                        {!event.metadata?.celebrated && (
                          <button
                            onClick={() => handleCelebrate(event.id)}
                            disabled={celebrating === event.id}
                            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50"
                          >
                            {celebrating === event.id ? 'Sending…' : 'Celebrate'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && <p className="text-sm text-slate-400">No recent activity yet.</p>}
                </div>
              </div>

              <div className={`${cardBg} rounded-3xl border border-white/5 p-5 shadow-xl`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Community</p>
                    <h3 className={`${headlineFont.className} text-xl text-white`}>Followers</h3>
                  </div>
                  <div className="rounded-full bg-white/5 p-1 text-xs text-slate-300">
                    <button
                      onClick={() => setActiveFollowTab('followers')}
                      className={`rounded-full px-3 py-1 ${activeFollowTab === 'followers' ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white' : ''}`}
                    >
                      Followers
                    </button>
                    <button
                      onClick={() => setActiveFollowTab('following')}
                      className={`rounded-full px-3 py-1 ${activeFollowTab === 'following' ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white' : ''}`}
                    >
                      Following
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {(activeFollowTab === 'followers' ? followers : following).map((person) => {
                    const isFollowing = followingIds.has(person.id);
                    return (
                      <div
                        key={person.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 text-white">
                            {(person.fullName || person.username || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm text-white">{person.fullName || person.username}</p>
                            <p className="text-xs text-slate-400">{person.xp} XP • Joined {formatDate(person.joined)}</p>
                          </div>
                        </div>
                        {activeFollowTab === 'followers' ? (
                          <button
                            onClick={() => toggleFollow(person.id, isFollowing, person)}
                            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white hover:border-white/20"
                          >
                            {isFollowing ? 'Following' : 'Follow back'}
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleFollow(person.id, true)}
                            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white hover:border-white/20"
                          >
                            Unfollow
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {(activeFollowTab === 'followers' ? followers : following).length === 0 && (
                    <p className="text-sm text-slate-400">No users yet.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
