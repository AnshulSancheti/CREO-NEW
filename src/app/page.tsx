'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AnimatePresence, animate, motion, useInView, useMotionValue } from 'framer-motion';
import { BookOpen, BookOpenCheck, Check, GraduationCap, Sparkles, Star, TrendingUp, Moon, Sun, XCircle, ArrowRight } from 'lucide-react';
import { Course } from '@/app/types/course';
import Waves from '@/app/components/Waves';
import LearningCoach from '@/app/components/learning-coach/LearningCoach';
import LandingChat from '@/app/components/chat/LandingChat';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });
const headlineFont = jakarta;
const bodyFont = jakarta;

const COLORS = {
  background: '#fff8f5',
  cardPink: '#ffe9e0',
  cardPeach: '#ffeeda',
  cardMint: '#e6f7ed',
  cardBase: '#ffffff',
  accent: '#c24f63',
  textPrimary: '#1f120f',
  textSecondary: '#5b4743',
  textTertiary: '#9b867f',
  borderLight: '#f2e1d8'
};

const HERO_DEFAULT = {
  eyebrow: 'TYPE IT. GET A PATH.',
  headline: 'Turn anything you want to learn into a path you can follow.',
  subheadline:
    'CREO builds a step-by-step plan from the best resources, then pairs you with a small study group so you never learn alone.',
  primaryCta: {
    text: 'Start a learning path',
    action: '/learn',
    enabled: true
  },
  secondaryCta: {
    text: 'See how it works',
    action: 'scroll-to-features',
    enabled: true
  },
  socialProof: 'Trusted by 18,000+ learners'
};

const FEATURES_FALLBACK = [
  {
    id: 'describe',
    title: 'Describe what you want',
    description: 'Type any topic or goal. Tell us how fast you want to go.',
    icon: '✨',
    backgroundColor: '#FFE8E8',
    metadata: ['Natural language', 'Any subject']
  },
  {
    id: 'simple-path',
    title: 'Get a simple path',
    description: 'We lay out steps with a few trusted videos, reads, and projects. No endless tab hopping.',
    icon: '🎯',
    backgroundColor: '#FFF0E0',
    metadata: ['Curated resources', 'Step-by-step']
  },
  {
    id: 'stick-with-it',
    title: 'Stick with it',
    description: 'Gentle reminders, streaks, and small study groups keep you moving.',
    icon: '🚀',
    backgroundColor: '#E0F7F4',
    metadata: ['Study groups', 'Progress tracking']
  }
];


const FLOW_STEPS = [
  {
    stage: 'Describe your goal',
    title: 'Tell us what to learn',
    copy: 'Write the skill, exam, or project on your mind. Add how many days you can study.'
  },
  {
    stage: 'See your path',
    title: 'We map the steps',
    copy: 'Modules show up in order with just a handful of strong resources per stop.'
  },
  {
    stage: 'Meet your crew',
    title: 'Join a study group',
    copy: 'We connect you with a few people on the same lesson so you can ask, share, and stay motivated.'
  },
  {
    stage: 'Stay in the loop',
    title: 'Track streaks and wins',
    copy: 'Daily nudges, progress checkpoints, and quick recaps show what to do today and what\'s next.'
  }
];

type JourneyPreview = {
  courseId: string;
  title: string;
  modules: Array<{
    id: number;
    moduleKey?: string;
    title: string;
    time?: string;
    status: 'completed' | 'pending' | 'current';
    resources: { name: string }[];
  }>;
};

const buildJourneyFromCourse = (
  course: Course,
  statusMap: Record<string, 'completed' | 'pending' | 'current'> = {}
): JourneyPreview => ({
  courseId: course.id,
  title: course.title,
  modules: course.modules.map((module, index) => ({
    id: module.moduleNumber || index + 1,
    moduleKey: module.id,
    title: module.title,
    time: module.estimatedDuration,
    status: statusMap[module.id] || (index === 0 ? 'current' : 'pending'),
    resources: module.topics.slice(0, 3).map((topic) => ({
      name: topic.title || 'Module topic'
    }))
  }))
});

const FALLBACK_JOURNEY: JourneyPreview = {
  courseId: 'demo',
  title: 'Build an AI agent that plans your week',
  modules: [
    { id: 1, title: 'Set the agent’s voice', time: '8 min', status: 'completed', resources: [{ name: 'Tone + persona guide' }] },
    { id: 2, title: 'Schedule-aware prompting', time: '15 min', status: 'current', resources: [{ name: 'Calendar context prompt' }] },
    { id: 3, title: 'Integrate tasks & focus blocks', time: '14 min', status: 'pending', resources: [{ name: 'Todo + focus API stub' }] },
    { id: 4, title: 'Test a full planning loop', time: '12 min', status: 'pending', resources: [{ name: 'Dry-run with sample week' }] }
  ]
};

type StatsData = {
  pathsCreated: number;
  resourcesCurated: number;
  activeGroups: number;
  lastUpdated?: string;
};

const STATS_FALLBACK: StatsData = {
  pathsCreated: 18240,
  resourcesCurated: 72110,
  activeGroups: 342
};

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [navJourney, setNavJourney] = useState<JourneyPreview | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [heroContent, setHeroContent] = useState(HERO_DEFAULT);
  const [heroLoading, setHeroLoading] = useState(true);
  const [features, setFeatures] = useState(FEATURES_FALLBACK);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatsData>(STATS_FALLBACK);
  const [statsLoading, setStatsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [featuresLogged, setFeaturesLogged] = useState(false);
  const [statsLogged, setStatsLogged] = useState(false);
  const [showComparison, setShowComparison] = useState(true);
  const [progressExpanded, setProgressExpanded] = useState(false);
  const featuresRef = useRef<HTMLDivElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.5 });
  const hoveredFeatures = useRef(new Set<string>());

  // Dark mode initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMode = localStorage.getItem('creoDarkMode');
    setIsDarkMode(savedMode === 'true');
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('creoDarkMode', String(newMode));
  };

  useEffect(() => {
    if (featuresInView && sessionId && !featuresLogged) {
      setFeaturesLogged(true);
      fetch('/api/analytics/section-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, section: 'features', location: 'home' }),
        keepalive: true
      }).catch(() => {});
    }
  }, [featuresInView, sessionId, featuresLogged]);

  useEffect(() => {
    if (statsInView && sessionId && !statsLogged) {
      setStatsLogged(true);
      fetch('/api/analytics/section-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, section: 'stats', location: 'home' }),
        keepalive: true
      }).catch(() => {});
    }
  }, [statsInView, sessionId, statsLogged]);

  const handleFeatureHover = (id: string) => {
    if (!sessionId) return;
    if (hoveredFeatures.current.has(id)) return;
    hoveredFeatures.current.add(id);
    fetch('/api/analytics/feature-hover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, featureId: id, section: 'features' }),
      keepalive: true
    }).catch(() => {});
  };

  const handleSecondaryCta = () => {
    if (sessionId) {
      fetch('/api/analytics/cta-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, button: 'secondary', location: 'hero' }),
        keepalive: true
      }).catch(() => {});
    }
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrimaryCta = () => {
    if (sessionId) {
      fetch('/api/analytics/cta-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, button: 'primary', location: 'hero' }),
        keepalive: true
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const played = localStorage.getItem('creoIntroPlayed');
    if (!played) {
      startTransition(() => setShowIntro(true));
      const timer = setTimeout(() => {
        startTransition(() => setShowIntro(false));
        localStorage.setItem('creoIntroPlayed', 'true');
      }, 4800);
      return () => clearTimeout(timer);
    }
    startTransition(() => setShowIntro(false));
  }, []);

  // Hero content fetch (for future dynamic CMS/A-B testing)
  useEffect(() => {
    let active = true;
    const loadHero = async () => {
      try {
        const res = await fetch('/api/content/hero');
        if (!res.ok) throw new Error('Failed hero content');
        const data = await res.json();
        if (active && data) {
          setHeroContent({ ...HERO_DEFAULT, ...data });
        }
      } catch (err) {
        // Fallback to defaults; avoid console noise for optional content
      } finally {
        if (active) setHeroLoading(false);
      }
    };
    loadHero();
    return () => {
      active = false;
    };
  }, []);

  // Features content fetch
  useEffect(() => {
    let active = true;
    const loadFeatures = async () => {
      try {
        const res = await fetch('/api/content/features');
        if (!res.ok) throw new Error('Failed features content');
        const data = await res.json();
        if (active && data?.features?.length) {
          setFeatures(data.features);
        }
      } catch (err) {
        // keep fallback
      } finally {
        if (active) setFeaturesLoading(false);
      }
    };
    loadFeatures();
    return () => {
      active = false;
    };
  }, []);

  // Live stats fetch
  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      try {
        const res = await fetch('/api/stats/live');
        if (!res.ok) throw new Error('Failed stats');
        const data = await res.json();
        if (active && data) {
          setStatsData({
            pathsCreated: data.pathsCreated ?? STATS_FALLBACK.pathsCreated,
            resourcesCurated: data.resourcesCurated ?? STATS_FALLBACK.resourcesCurated,
            activeGroups: data.activeGroups ?? STATS_FALLBACK.activeGroups,
            lastUpdated: data.lastUpdated
          });
        }
      } catch (err) {
        // fallback to defaults silently
      } finally {
        if (active) setStatsLoading(false);
      }
    };
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncJourney = () => {
      const storedCourse = window.localStorage.getItem('creoActiveCourse');
      if (!storedCourse) {
        setNavJourney(null);
        return;
      }
      try {
        const course: Course = JSON.parse(storedCourse);
        const statusRaw = window.localStorage.getItem('creoCourseStatus');
        const statusMap = statusRaw ? JSON.parse(statusRaw) : {};
        setNavJourney(buildJourneyFromCourse(course, statusMap));
      } catch (error) {
        console.error('Failed to hydrate journey preview:', error);
        setNavJourney(null);
      }
    };
    const storageHandler = () => syncJourney();
    syncJourney();
    window.addEventListener('storage', storageHandler);
    window.addEventListener('creo-course-updated', storageHandler as EventListener);
    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('creo-course-updated', storageHandler as EventListener);
    };
  }, []);

  const journeyPreview = navJourney ?? FALLBACK_JOURNEY;
  const mutedText = isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]';
  const primaryCtaHref =
    heroContent.primaryCta.action && !['/course', '/create-path'].includes(heroContent.primaryCta.action)
      ? heroContent.primaryCta.action
      : '/learn';

  const ensureSession = () => {
    if (typeof window === 'undefined') return null;
    const existing = localStorage.getItem('creoSessionId');
    if (existing) return existing;
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem('creoSessionId', id);
    document.cookie = `creoSessionId=${id}; max-age=86400; path=/; SameSite=Lax`;
    return id;
  };

  useEffect(() => {
    const id = ensureSession();
    setSessionId(id);
    if (!id) return;
    const payload = {
      sessionId: id,
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent,
      page: 'home'
    };
    fetch('/api/analytics/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {
      // silent failure
    });
  }, []);

function StatNumber({ value, inView }: { value: number; inView: boolean }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const unsub = count.on('change', (latest) => {
      setDisplay(Math.max(0, Math.floor(latest)).toLocaleString());
    });
    return () => unsub();
  }, [count]);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, { duration: 2, ease: 'easeOut' });
    return () => controls.stop();
  }, [count, inView, value]);

  return <span className="text-5xl font-extrabold text-[#c24f63] md:text-6xl">{display}</span>;
}

function StatCard({ label, value, isLoading, isDarkMode }: { label: string; value: number; isLoading: boolean; isDarkMode: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div
      ref={ref}
      className="rounded-2xl border px-4 py-8 text-center shadow-sm"
      style={{
        backgroundColor: isDarkMode ? '#1f1410' : '#fff3ee',
        borderColor: COLORS.borderLight
      }}
    >
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="mx-auto h-8 w-24 rounded-full bg-[#f2e1d8]" />
          <div className="mx-auto h-3 w-32 rounded-full bg-[#f2e1d8]" />
        </div>
      ) : (
        <div className="space-y-2">
          <StatNumber value={value} inView={inView} />
          <p className={`text-[0.75rem] uppercase tracking-[0.25em] ${
            isDarkMode ? 'text-[#b8998a]' : 'text-[#7d5c55]'
          }`}>{label}</p>
        </div>
      )}
    </div>
  );
}

  const words = [
    { text: 'Everyone starts somewhere.', delay: 0 },
    { text: 'Type what you want to learn.', delay: 1.2 },
    { text: 'Watch your path unfold.', delay: 2.4 }
  ];

  return (
    <>
      <LearningCoach />

      <AnimatePresence>
        {showIntro && showIntro !== null && (
          <motion.div
            className={`fixed inset-0 z-40 flex items-center justify-center ${
              isDarkMode ? 'bg-[#1a120e]' : 'bg-[#fff4ec]'
            }`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ backgroundColor: isDarkMode ? '#1a120e' : '#f6e5da' }}
              animate={{ backgroundColor: isDarkMode ? '#0f0a08' : '#fffaf6' }}
              transition={{ duration: 1.4 }}
            />
            <motion.div
              className="absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
              className="absolute h-3 w-3 rounded-full"
              style={{
                background: 'radial-gradient(circle, #ff8ab6, #f9a8a8)'
              }}
              initial={{ x: '-20%', y: '10%', opacity: 0 }}
              animate={{ x: ['-20%', '40%', '110%'], y: ['10%', '50%', '80%'], opacity: [0, 1, 0] }}
              transition={{ duration: 3.5, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute h-[3px] w-[120%] rotate-6 bg-gradient-to-r from-transparent via-[#f9a8a8] to-[#ff5f9e]/0 blur-[2px]"
              initial={{ x: '-40%', y: '15%', opacity: 0 }}
              animate={{ x: ['-40%', '60%', '130%'], y: ['15%', '60%', '85%'], opacity: [0, 0.7, 0] }}
              transition={{ duration: 4, ease: 'easeInOut' }}
            />
            </motion.div>
            <div className={`relative z-10 space-y-4 text-center ${isDarkMode ? 'text-[#c9a89a]' : 'text-[#4b2e2b]'}`}>
              {words.map((word) => (
                <motion.p
                  key={word.text}
                  className="text-lg font-semibold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: word.delay, duration: 0.6 }}
                >
                  {word.text}
                </motion.p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowIntro(false);
                localStorage.setItem('creoIntroPlayed', 'true');
              }}
              className={`absolute bottom-6 right-6 rounded-full border ${
                isDarkMode 
                  ? 'border-[#3a2f2a] bg-[#1f1410]/80 text-[#f5e6dc]' 
                  : 'border-[#1f120f]/20 bg-white/80 text-[#1f120f]'
              } px-4 py-2 text-xs font-semibold transition-colors duration-300`}
            >
              Skip intro
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section - Simplified */}
      <div
        id="hero"
        className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${bodyFont.className} ${
          isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
        }`}
        style={{
          background: isDarkMode
            ? '#0f0a08'
            : 'linear-gradient(180deg, #fff8f5 0%, #ffe8e8 60%, #fff8f5 100%)'
        }}
      >
        <Waves
          lineColor={isDarkMode ? 'rgba(194, 79, 99, 0.12)' : 'rgba(194, 79, 99, 0.04)'}
          backgroundColor="transparent"
          waveSpeedX={0.004}
          waveSpeedY={0.002}
          waveAmpX={16}
          waveAmpY={10}
          xGap={20}
          yGap={52}
          friction={0.97}
          tension={0.002}
          maxCursorMove={30}
          style={{ position: 'absolute', zIndex: 1, pointerEvents: 'none' }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-56 max-w-5xl rounded-[50%] bg-gradient-to-b from-[#c24f63]/12 to-transparent blur-3xl" />

        <nav className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-4 pb-4 pt-6 md:px-6">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-bold transition-colors duration-300 ${
                isDarkMode ? 'bg-[#f5e6dc] text-[#1f120f]' : 'bg-[#1f120f] text-white'
              }`}
            >
              ∞
            </div>
            <span className={`${headlineFont.className} text-xl font-bold ${isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'}`}>
              CREO
            </span>
          </div>

          <div
            className={`hidden items-center gap-1 rounded-full border px-2 py-2 shadow-sm md:flex ${
              isDarkMode ? 'border-[#3a2f2a] bg-[#1f1410]/70' : 'border-[#f2e1d8] bg-white/80'
            }`}
          >
            <Link
              href="/course"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isDarkMode ? 'text-[#f5e6dc] hover:bg-[#2a1f1a]' : 'text-[#1f120f] hover:bg-[#f2e1d8]/60'
              }`}
            >
              Course Builder
            </Link>
            <Link
              href="/tutor"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isDarkMode ? 'text-[#f5e6dc] hover:bg-[#2a1f1a]' : 'text-[#1f120f] hover:bg-[#f2e1d8]/60'
              }`}
            >
              Learning Coach
            </Link>
            <Link
              href="/api-test"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isDarkMode ? 'text-[#f5e6dc] hover:bg-[#2a1f1a]' : 'text-[#1f120f] hover:bg-[#f2e1d8]/60'
              }`}
            >
              API
            </Link>
            <button
              type="button"
              onClick={() => setShowAuth((prev) => !prev)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isDarkMode ? 'text-[#f5e6dc] hover:bg-[#2a1f1a]' : 'text-[#1f120f] hover:bg-[#f2e1d8]/60'
              }`}
            >
              Sign in
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                isDarkMode ? 'bg-[#2a1f1a] text-[#f5e6dc] hover:bg-[#3a2f2a]' : 'bg-white text-[#1f120f] shadow-sm hover:bg-[#f2e1d8]'
              }`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setShowAuth((prev) => !prev)}
              className="flex items-center gap-2 rounded-full bg-[#c24f63] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <span>Start free</span>
              <span className="text-lg">→</span>
            </button>
          </div>

          {showAuth && (
            <div className="absolute right-4 top-20">
              <AuthDialogue onClose={() => setShowAuth(false)} isDark={isDarkMode} />
            </div>
          )}
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center px-4 pb-16 pt-12 md:pt-16">
          <div className="w-full max-w-[600px] text-center space-y-6">
            <div className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c24f63]/10 px-4 py-2 text-[0.75rem] font-semibold tracking-[0.2em] text-[#a33249]">
              <Sparkles className="h-4 w-4" />
              {heroContent.eyebrow}
            </div>

            {heroLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="mx-auto h-10 w-11/12 rounded-full bg-white/60" />
                <div className="mx-auto h-4 w-10/12 rounded-full bg-white/50" />
              </div>
            ) : (
              <div className="space-y-3">
                <h1
                  className={`${headlineFont.className} text-[3rem] font-extrabold leading-[1.05] md:text-[3.4rem] lg:text-[3.7rem] ${
                    isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                  }`}
                >
                  {heroContent.headline}
                </h1>
                <p className={`mx-auto max-w-2xl text-lg leading-[1.65] ${isDarkMode ? 'text-[#c9a89a]' : 'text-[#5b4743]'}`}>
                  {heroContent.subheadline}
                </p>
              </div>
            )}

            <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:justify-center sm:gap-4">
              {heroContent.primaryCta.enabled !== false ? (
                <Link
                  href={primaryCtaHref}
                  onClick={handlePrimaryCta}
                  className="inline-flex w-full min-h-12 items-center justify-center rounded-full bg-[#c24f63] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
                >
                  {heroContent.primaryCta.text || 'Start a learning path'}
                </Link>
              ) : (
                <div className="inline-flex w-full min-h-12 items-center justify-center rounded-full bg-[#c24f63]/60 px-7 py-3.5 text-sm font-semibold text-white sm:w-auto">
                  {heroContent.primaryCta.text || 'Start a learning path'}
                </div>
              )}
              {heroContent.secondaryCta.enabled !== false && (
                <button
                  type="button"
                  onClick={handleSecondaryCta}
                  className={`inline-flex w-full min-h-12 items-center justify-center rounded-full border px-7 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 sm:w-auto ${
                    isDarkMode ? 'border-[#3a2f2a] text-[#f5e6dc]' : 'border-[#1f120f]/15 text-[#1f120f]'
                  }`}
                >
                  {heroContent.secondaryCta.text}
                </button>
              )}
            </div>

            <p className={`text-sm ${isDarkMode ? 'text-[#b8998a]' : 'text-[#7d5c55]'}`}>{heroContent.socialProof}</p>
          </div>

          <div className="mt-10 w-full max-w-4xl space-y-4">
            <div
              className={`rounded-3xl border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)] ${
                isDarkMode ? 'border-[#3a2f2a] bg-[#1f1410]' : 'border-[#f2e1d8] bg-white'
              }`}
            >
              <div className="flex flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-[0.7rem] uppercase tracking-[0.35em] ${isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'}`}>
                    Path preview
                  </p>
                  <h3 className={`${headlineFont.className} text-2xl ${isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'}`}>
                    {journeyPreview.title}
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-[#b8998a]' : 'text-[#7d5c55]'}`}>
                    {navJourney ? 'Synced from your last plan' : 'Sample path · edit anytime'}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[#c24f63]/10 px-3 py-1 text-xs font-semibold text-[#a33249]">
                  {journeyPreview.modules.length} steps
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {journeyPreview.modules.slice(0, 4).map((module) => {
                  const statusStyles =
                    module.status === 'completed'
                      ? isDarkMode
                        ? 'bg-[#2a1f1a] text-[#ff8ab6]'
                        : 'bg-[#ffe9ea] text-[#c24f63]'
                      : module.status === 'current'
                        ? 'bg-[#c24f63] text-white'
                        : isDarkMode
                          ? 'bg-[#1f1410] text-[#c9a89a]'
                          : 'bg-[#fdf1ec] text-[#5b4743]';
                  return (
                    <div
                      key={module.moduleKey || module.id}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                        isDarkMode ? 'border-[#3a2f2a] bg-[#140d0b]' : 'border-[#f2e1d8] bg-[#fffaf6]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-semibold ${statusStyles}`}>
                          {module.id}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{module.title}</p>
                          <p className={`text-[0.78rem] ${isDarkMode ? 'text-[#b8998a]' : 'text-[#7d5c55]'}`}>
                            {module.resources[0]?.name || 'Resource'} • {module.time || '10 min'}
                          </p>
                        </div>
                      </div>
                      {module.status === 'completed' && <Star className="h-4 w-4 text-[#c24f63]" />}
                      {module.status === 'current' && <TrendingUp className="h-4 w-4 text-[#c24f63]" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-left shadow-sm ring-1 ring-[#f2e1d8] backdrop-blur">
                <p className="text-sm font-semibold text-[#1f120f]">Paths under a minute</p>
                <p className="text-xs text-[#5b4743]">Type a topic, get 5 steps.</p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-left shadow-sm ring-1 ring-[#f2e1d8] backdrop-blur">
                <p className="text-sm font-semibold text-[#1f120f]">Pods of 3–5</p>
                <p className="text-xs text-[#5b4743]">Camera optional, gentle host.</p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-left shadow-sm ring-1 ring-[#f2e1d8] backdrop-blur">
                <p className="text-sm font-semibold text-[#1f120f]">Coach on tap</p>
                <p className="text-xs text-[#5b4743]">Hints when you feel stuck.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Original Homepage Content Below */}
      <div className={`${bodyFont.className} transition-colors duration-500 ${
        isDarkMode ? 'bg-[#0f0a08] text-[#f5e6dc]' : 'bg-[#fff8f5] text-[#1f120f]'
      }`}>
        <main className="container mx-auto px-4 py-14">
          <div className="grid gap-10">
            <div className="space-y-24 md:space-y-28">

          {/* Features */}
          <section id="features" className="space-y-6 scroll-mt-24">
            <div className="space-y-2 text-center">
              <p className={`text-xs uppercase tracking-[0.4em] ${mutedText}`}>How it works</p>
              <h3 className={`${headlineFont.className} text-3xl ${isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'}`}>
                Three simple steps
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'}`}>
                Like Duolingo’s feature row: three calm cards you can scan in seconds.
              </p>
            </div>

            <div ref={featuresRef} className="grid gap-4 lg:grid-cols-3">
              {featuresLoading
                ? [0, 1, 2].map((i) => (
                    <div key={i} className="rounded-[24px] border border-[#f2e1d8] bg-white/70 p-8 shadow-sm animate-pulse">
                      <div className="h-3 w-16 rounded-full bg-[#f2e1d8]" />
                      <div className="mt-3 h-6 w-32 rounded-full bg-[#f2e1d8]" />
                      <div className="mt-3 h-4 w-48 rounded-full bg-[#f2e1d8]" />
                    </div>
                  ))
                : features.map((feature, idx) => (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
                      viewport={{ once: true, amount: 0.2 }}
                      className="rounded-[24px] border p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
                      style={{
                        backgroundColor: feature.backgroundColor || COLORS.cardBase,
                        borderColor: COLORS.borderLight
                      }}
                      onMouseEnter={() => handleFeatureHover(feature.id)}
                      onFocus={() => handleFeatureHover(feature.id)}
                    >
                      <p className={`text-[0.75rem] uppercase tracking-[0.35em] ${mutedText}`}>Feature</p>
                      <div className="mt-3 flex items-center gap-2 text-2xl">
                        <span aria-hidden>{feature.icon || '✨'}</span>
                        <h4 className={`${headlineFont.className} text-xl font-semibold`}>{feature.title}</h4>
                      </div>
                      <p className={`mt-3 text-sm leading-relaxed ${mutedText}`}>{feature.description}</p>
                      {feature.metadata?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {feature.metadata.map((tag: string) => (
                            <span
                              key={tag}
                              className="rounded-full bg-white/70 px-3 py-1 text-[0.78rem] font-semibold text-[#5b4743] shadow-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </motion.div>
                  ))}
            </div>
          </section>

          {/* Social proof stats */}
          <section
            id="stats"
            ref={statsRef}
            className={`space-y-8 rounded-[32px] border px-6 py-10 md:px-10 md:py-12 shadow-sm scroll-mt-24 ${
              isDarkMode ? 'border-[#3a2f2a] bg-[#1a120e]' : 'border-[#f2e1d8] bg-[#fff8f5]'
            }`}
          >
            <div className="space-y-2 text-center">
              <p className={`text-xs uppercase tracking-[0.4em] ${mutedText}`}>Proof it works</p>
              <h3 className={`${headlineFont.className} text-3xl ${isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'}`}>
                Numbers that move in real time
              </h3>
              <p className={`text-sm ${mutedText}`}>Fresh counts from our live data—no static screenshots.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[{
                label: 'LEARNING PATHS CREATED',
                value: statsData.pathsCreated
              }, {
                label: 'RESOURCES CURATED',
                value: statsData.resourcesCurated
              }, {
                label: 'ACTIVE STUDY GROUPS',
                value: statsData.activeGroups
              }].map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  isLoading={statsLoading}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
            {statsData.lastUpdated && (
              <p className={`text-center text-xs ${mutedText}`}>Last updated {new Date(statsData.lastUpdated).toLocaleString()}</p>
            )}
          </section>

          {/* Gamified Loop */}
          <section
            id="dashboard"
            className="space-y-4 rounded-[20px] border border-[#ebe6e1] bg-[#fdfaf7] p-6 shadow-[0_35px_70px_rgba(37,23,19,0.08)] transition-colors duration-300 scroll-mt-24"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-normal text-[#5a5a5a]">
                Progress in CREO is measured by understanding and consistency — not XP.
              </p>
              <button
                type="button"
                onClick={() => setProgressExpanded((s) => !s)}
                className="inline-flex items-center gap-2 rounded-full border border-[#d6d1cc] px-4 py-2 text-xs font-semibold text-[#1f1f1f] transition hover:-translate-y-0.5 hover:bg-[#f3f1ee]"
              >
                {progressExpanded ? 'Hide' : 'Learn more'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {progressExpanded && (
              <div
                className={`space-y-2 rounded-2xl p-4 text-sm ${
                  isDarkMode ? 'bg-[#1f1f1f] text-[#f5f5f5]' : 'bg-white text-[#1f1f1f]'
                }`}
              >
                <p className="font-semibold">We keep it simple:</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#c24f63]" /> Steps completed
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#c24f63]" /> Confidence per topic
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#c24f63]" /> Focused time (tiny sessions count)
                  </li>
                </ul>
              </div>
            )}

            {showComparison ? (
              <div className="rounded-3xl border border-[#ebe6e1] bg-[#fdfaf7] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.12em] text-[#7a7a7a]">Clutter vs Direction</p>
                    <h3 className={`${headlineFont.className} text-xl font-semibold text-[#1f1f1f]`}>
                      Stop piecing learning together.
                    </h3>
                    <p className="text-sm text-[#5a5a5a]">
                      CREO replaces scattered tools and unclear goals with a single guided path.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowComparison(false)}
                    className="rounded-full border border-[#d4cec8] px-3 py-1 text-xs font-semibold text-[#2f2f2f] transition hover:-translate-y-0.5 dark:border-[#e6e1dc] dark:text-[#f5f5f5]"
                  >
                    Collapse
                  </button>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#9a3a3a]">Cluttered approach</p>
                    {[
                      'Jumping between videos, notes, and random practice sites',
                      'Not knowing what to do next after each session',
                      'Progress feels like time spent, not understanding gained',
                      'Revision happens too late and feels overwhelming',
                      'Motivation depends on willpower and long sessions',
                      'Too many tabs, too little clarity'
                    ].map((text) => (
                      <div
                        key={text}
                        className="flex items-start gap-2 rounded-2xl border border-[#edd6d6] bg-[#f7eeee] p-3 text-sm text-[#3a1f1f]"
                      >
                        <XCircle className="mt-0.5 h-4 w-4 text-[#b94a4a]" />
                        <p>{text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 lg:border-l lg:border-[#ebe6e1] lg:pl-4">
                    <p className="text-sm font-semibold text-[#1f6b4e]">CREO: Direction-first</p>
                    {[
                      'One path with clear next steps',
                      'Coach detects blockers and switches to hint-first mode',
                      'Practice is generated from weak spots automatically',
                      'Progress is based on confidence + consistency (not points)',
                      'Short sessions still count — momentum without guilt',
                      'Resources are curated and tied to the exact step'
                    ].map((text) => (
                      <div
                        key={text}
                        className="flex items-start gap-2 rounded-2xl border border-[#dbeae2] bg-[#f1f7f4] p-3 text-sm text-[#1f3a2e]"
                      >
                        <Check className="mt-0.5 h-4 w-4 text-[#3f8f6a]" />
                        <p>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowComparison(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#f2e1d8] bg-white px-4 py-2 text-xs font-semibold text-[#5b4743] shadow-sm transition hover:-translate-y-0.5 dark:border-[#3a2f2a] dark:bg-[#1f1410] dark:text-[#f5e6dc]"
              >
                Clutter → Direction ✓
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </section>

          {/* Flow */}
          <section id="flow" className={`rounded-[36px] border p-8 transition-colors duration-300 scroll-mt-24 ${
            isDarkMode 
              ? 'border-[#3a2f2a] bg-[#1f1410] shadow-[0_35px_70px_rgba(0,0,0,0.3)]' 
              : 'border-[#f2e1d8] bg-white shadow-[0_35px_70px_rgba(37,23,19,0.08)]'
          }`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-xs uppercase tracking-[0.4em] ${
                  isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                }`}>Flow</p>
                <h3 className={`${headlineFont.className} text-3xl ${
                  isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                }`}>How your path comes together</h3>
              </div>
              <p className={`text-sm max-w-xl ${
                isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
              }`}>
                Hover each step to see what happens after you type your goal. It stays simple from idea to study session.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {FLOW_STEPS.map((step, index) => {
                const isActive = index === activeStep;
                return (
                  <button
                    key={step.stage}
                    type="button"
                    onMouseEnter={() => setActiveStep(index)}
                    className={`h-full rounded-3xl border p-5 text-left transition-all duration-300 ${
                      isActive 
                        ? isDarkMode 
                          ? 'border-[#c24f63] bg-gradient-to-br from-[#2a1820] to-[#2a1820] shadow-lg' 
                          : 'border-[#c24f63] bg-gradient-to-br from-[#fff0eb] to-[#ffe3f1] shadow-lg'
                        : isDarkMode 
                          ? 'border-[#3a2f2a] bg-[#1f1410]' 
                          : 'border-[#f2e1d8] bg-white'
                    }`}
                  >
                    <p className={`text-xs uppercase tracking-[0.3em] ${
                      isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                    }`}>{step.stage}</p>
                    <h4 className={`mt-2 text-lg font-semibold ${
                      isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                    }`}>{step.title}</h4>
                    <p className={`mt-2 text-sm ${
                      isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
                    }`}>{step.copy}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Pods */}
          <section id="pods" className={`rounded-[36px] border p-8 transition-colors duration-300 scroll-mt-24 ${
            isDarkMode 
              ? 'border-[#3a2f2a] bg-[#1a120e] shadow-[0_30px_60px_rgba(194,79,99,0.15)]' 
              : 'border-[#f2e1d8] bg-[#fff8f5] shadow-[0_30px_60px_rgba(230,191,182,0.5)]'
          }`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-xs uppercase tracking-[0.4em] ${
                  isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                }`}>Study groups</p>
                <h3 className={`${headlineFont.className} text-3xl ${
                  isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                }`}>Pick the vibe that fits</h3>
              </div>
              <p className={`text-sm max-w-xl ${
                isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
              }`}>
                Groups stay small, camera-optional, and matched by pace. Drop in when you need a boost.
              </p>
            </div>

            <div className="mt-8">
              <div className={`rounded-3xl border px-5 py-6 shadow-sm transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-[#3a2f2a] bg-[#1f1410]' 
                  : 'border-[#f2d9cf] bg-white'
              }`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className={`text-xs uppercase tracking-[0.3em] ${
                      isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                    }`}>Study pod</p>
                    <p className={`text-lg font-semibold ${
                      isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                    }`}>One calm room, a gentle host</p>
                    <p className={`mt-2 text-sm ${
                      isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
                    }`}>
                      Join a handful of peers on the same module. You get a prompt, 15 minutes of focus, and a quick share-out.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full px-3 py-1 ${
                      isDarkMode ? 'bg-[#2a1f1a] text-[#ff8ab6]' : 'bg-[#ffe9ea] text-[#c24f63]'
                    }`}>Under 30s wait</span>
                    <span className={`rounded-full px-3 py-1 ${
                      isDarkMode ? 'bg-[#2a1f1a] text-[#f5e6dc]' : 'bg-[#fff4ef] text-[#c24f63]'
                    }`}>Camera optional</span>
                    <span className={`rounded-full px-3 py-1 ${
                      isDarkMode ? 'bg-[#2a1f1a] text-[#f5e6dc]' : 'bg-[#fff4ef] text-[#c24f63]'
                    }`}>Pace + timezone matched</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className={`rounded-2xl border px-4 py-3 ${
                    isDarkMode ? 'border-[#3a2f2a] bg-[#1f1410]' : 'border-[#f2d9cf] bg-[#fff4ef]'
                  }`}>
                    <p className={`text-xs uppercase tracking-[0.2em] ${
                      isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                    }`}>Warm-up</p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                    }`}>One simple prompt to get talking.</p>
                  </div>
                  <div className={`rounded-2xl border px-4 py-3 ${
                    isDarkMode ? 'border-[#3a2f2a] bg-[#1f1410]' : 'border-[#f2d9cf] bg-[#fff4ef]'
                  }`}>
                    <p className={`text-xs uppercase tracking-[0.2em] ${
                      isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                    }`}>Focus</p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                    }`}>15-minute quiet block with a timer.</p>
                  </div>
                  <div className={`rounded-2xl border px-4 py-3 ${
                    isDarkMode ? 'border-[#3a2f2a] bg-[#1f1410]' : 'border-[#f2d9cf] bg-[#fff4ef]'
                  }`}>
                    <p className={`text-xs uppercase tracking-[0.2em] ${
                      isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
                    }`}>Share</p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
                    }`}>Show one win or question before you leave.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Inline Tutor */}
          <section id="coach" className={`grid gap-6 lg:grid-cols-2 items-start rounded-[36px] border p-8 transition-colors duration-300 scroll-mt-24 ${
            isDarkMode
              ? 'border-[#3a2f2a] bg-[#1f1410]'
              : 'border-[#f2e1d8] bg-white'
          }`}>
            <div className="space-y-3">
              <p className={`text-xs uppercase tracking-[0.5em] ${
                isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
              }`}>Stuck? Try Learning Mode</p>
              <h3 className={`${headlineFont.className} text-3xl ${
                isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
              }`}>Talk to the coach right here</h3>
              <p className={`text-sm max-w-xl ${
                isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
              }`}>
                Type your blocker. The coach detects frustration or repetition and switches to a slower, hint-first mode.
              </p>
              <ul className={`grid gap-2 text-sm ${
                isDarkMode ? 'text-[#c9a89a]' : 'text-[#5b4743]'
              }`}>
                <li>• Quick controls: ask for a hint or simpler explanation.</li>
                <li>• Tracks topic confidence and repeats weak spots.</li>
                <li>• Uses your profile to adapt tone and pacing.</li>
              </ul>
            </div>
            <LandingChat isDarkMode={isDarkMode} />
          </section>

          {/* CTA */}
          <section id="cta" className={`rounded-[36px] border p-8 text-center transition-colors duration-300 scroll-mt-24 ${
            isDarkMode 
              ? 'border-[#3a2f2a] bg-[#1f1410] shadow-[0_30px_70px_rgba(0,0,0,0.3)]' 
              : 'border-[#f2e1d8] bg-white shadow-[0_30px_70px_rgba(37,23,19,0.08)]'
          }`}>
            <p className={`text-xs uppercase tracking-[0.5em] ${
              isDarkMode ? 'text-[#c9a89a]' : 'text-[#b37871]'
            }`}>Ready?</p>
            <h3 className={`${headlineFont.className} mt-2 text-3xl ${
              isDarkMode ? 'text-[#f5e6dc]' : 'text-[#1f120f]'
            }`}>Start a path. Learn with your crew.</h3>
            <p className={`mt-3 text-sm max-w-2xl mx-auto ${
              isDarkMode ? 'text-[#b8998a]' : 'text-[#5b4743]'
            }`}>
              Type what you want to learn and get a plan in under a minute. We keep the steps, streak, and study group in one calm place.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/learn"
                className={`rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                  isDarkMode ? 'bg-[#f5e6dc] text-[#1f120f]' : 'bg-[#1f120f] text-white'
                }`}
              >
                Generate my path
              </Link>
              <Link
                href="/api-test"
                className={`rounded-full border px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                  isDarkMode 
                    ? 'border-[#3a2f2a] text-[#f5e6dc]' 
                    : 'border-[#1f120f]/15 text-[#1f120f]'
                }`}
              >
                View API example
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
    </>
  );
}
