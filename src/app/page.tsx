'use client';

import { startTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import { Playfair_Display, Space_Grotesk } from 'next/font/google';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpenCheck } from 'lucide-react';
import CourseProgress from '@/app/components/CourseProgress';
import { Course } from '@/app/types/course';

const headlineFont = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'] });
const bodyFont = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'] });

const AuthDialogue = ({ onClose }: { onClose: () => void }) => (
  <div className="absolute right-0 top-12 z-30 w-80 rounded-3xl border border-[#f2e1d8] bg-white p-6 shadow-xl">
    <div className="space-y-3">
      <p className="text-[0.65rem] uppercase tracking-[0.4em] text-[#b37871]">Quick access</p>
      <h4 className={`${headlineFont.className} text-xl text-[#1f120f]`}>Sign into your cockpit</h4>
      <div className="space-y-2">
        <label className="text-xs text-[#5b4743]">
          Email
          <input
            type="email"
            placeholder="you@example.com"
            className="mt-1 w-full rounded-2xl border border-[#eaded0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c24f63]/30"
          />
        </label>
        <label className="text-xs text-[#5b4743]">
          Password
          <input
            type="password"
            placeholder="••••••••"
            className="mt-1 w-full rounded-2xl border border-[#eaded0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c24f63]/30"
          />
        </label>
      </div>
      <button
        type="button"
        className="w-full rounded-full bg-[#1f120f] py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-full border border-[#1f120f]/10 py-2 text-sm font-semibold text-[#1f120f]"
      >
        Close
      </button>
    </div>
  </div>
);

const HERO_STATS = [
  { label: 'Learning paths created', value: '18,240' },
  { label: 'Resources curated', value: '72,110' },
  { label: 'Active study groups', value: '342' }
];

const FEATURE_STACK = [
  {
    title: 'Describe what you want',
    body: 'Type any topic or goal. Tell us how fast you want to go.',
    accent: 'from-[#fde6e0] to-[#f9c5d1]'
  },
  {
    title: 'Get a simple path',
    body: 'We lay out steps with a few trusted videos, reads, and projects. No endless tab hopping.',
    accent: 'from-[#fff4d8] to-[#ffd6a5]'
  },
  {
    title: 'Stick with it',
    body: 'Gentle reminders, streaks, and small study groups keep you moving.',
    accent: 'from-[#e3f7f2] to-[#c0f0e4]'
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
    copy: 'Daily nudges, progress checkpoints, and quick recaps show what to do today and what’s next.'
  }
];

const SIGNALS = [
  { title: 'Linear Algebra for ML', learners: 213, vibe: 'Deep focus · EU afternoon' },
  { title: 'Quant UX Research', learners: 94, vibe: 'Async thread · AMER evening' },
  { title: 'React + Supabase', learners: 178, vibe: 'Live build · APAC morning' },
  { title: 'Writing for AI tutors', learners: 66, vibe: 'Calm studio · Global hybrid' }
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

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [navJourney, setNavJourney] = useState<JourneyPreview | null>(null);

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

  const words = [
    { text: 'Everyone starts somewhere.', delay: 0 },
    { text: 'Type what you want to learn.', delay: 1.2 },
    { text: 'Watch your path unfold.', delay: 2.4 }
  ];

  return (
    <div className={`${bodyFont.className} min-h-screen bg-[#fdf8f2] text-[#1f120f]`}>
      <AnimatePresence>
        {showIntro && showIntro !== null && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-[#fff4ec]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ backgroundColor: '#f6e5da' }}
              animate={{ backgroundColor: '#fffaf6' }}
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
            <div className="relative z-10 space-y-4 text-center text-[#4b2e2b]">
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
              className="absolute bottom-6 right-6 rounded-full border border-[#1f120f]/20 bg-white/80 px-4 py-2 text-xs font-semibold text-[#1f120f]"
            >
              Skip intro
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-20 border-b border-[#f2e1d8] bg-[#fdf8f2]/90 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f120f] text-lg font-semibold text-white">
              ∞
            </div>
            <div>
              <div className="relative inline-flex items-center overflow-hidden rounded-full border border-[#f2d6c4] bg-white/80 px-5 py-1.5 text-sm font-bold uppercase tracking-[0.35em] text-[#1f120f]">
                <motion.span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(120deg, rgba(255,218,193,0.85), rgba(255,173,196,0.95), rgba(255,218,193,0.85))'
                  }}
                  animate={{ x: ['-30%', '30%', '-10%'], opacity: [0.6, 0.9, 0.6] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.span
                  aria-hidden
                  className="absolute inset-0 bg-[#ffb9c5]/40 blur-2xl"
                  animate={{ opacity: [0.15, 0.4, 0.15] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
                />
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1/2 bg-white/20"
                  animate={{ x: ['-30%', '110%'] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="relative z-10 tracking-[0.35em] text-[#381c15]">CREO</span>
              </div>
            </div>
          </div>
          <nav className="relative flex items-center gap-4 text-sm text-[#5b4743]">
            <Link href="/course" className="rounded-full bg-white/70 px-4 py-2 font-semibold text-[#1f120f] shadow-sm">
              Launch Builder
            </Link>
            <Link href="/api-test" className="rounded-full border border-[#1f120f]/10 px-4 py-2 font-semibold text-[#1f120f]">
              API Console
            </Link>
            <button
              type="button"
              aria-label="Show learning journey"
              onClick={() => {
                setShowJourney((prev) => {
                  const next = !prev;
                  if (next) {
                    setShowAuth(false);
                  }
                  return next;
                });
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-[#1f120f]/15 transition ${
                showJourney ? 'bg-[#1f120f] text-white' : 'bg-white/80 text-[#1f120f]'
              }`}
            >
              <BookOpenCheck className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowJourney(false);
                setShowAuth((prev) => !prev);
              }}
              className="rounded-full border border-[#1f120f]/15 bg-white/80 px-4 py-2 font-semibold text-[#1f120f] shadow-sm"
            >
              Sign in
            </button>
            {showJourney && (
              <div className="absolute right-0 top-14 z-30 w-[30rem] max-h-[85vh] overflow-visible rounded-3xl border border-[#f2e1d8] bg-white/95 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.15)]">
                <CourseProgress journey={navJourney} />
              </div>
            )}
            {showAuth && <AuthDialogue onClose={() => setShowAuth(false)} />}
          </nav>
        </div>
      </header>

      <main className="container mx-auto space-y-16 px-4 py-12">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[40px] border border-[#f2e1d8] bg-gradient-to-br from-[#fff2ea] via-[#ffe8f0] to-[#fce3d8] p-8 shadow-[0_40px_120px_rgba(244,206,185,0.6)]">
          <div className="grid gap-10 lg:grid-cols-[3fr,2fr]">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.6em] text-[#b37871]">Type it. Get a path.</p>
              <h1 className={`${headlineFont.className} text-4xl md:text-5xl text-[#1f120f]`}>
                Turn anything you want to learn into a path you can follow
              </h1>
              <p className="text-base text-[#5b4743] max-w-2xl">
                CREO builds a step-by-step plan from the best resources, then pairs you with a small study group so you
                never learn alone.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/course"
                  className="rounded-full bg-[#1f120f] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Start a learning path
                </Link>
                <Link
                  href="/course"
                  className="rounded-full border border-[#1f120f]/20 px-6 py-3 text-sm font-semibold text-[#1f120f] transition hover:-translate-y-0.5"
                >
                  See how it works
                </Link>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.4em] text-[#b37871]">Live study groups</p>
              <div className="mt-4 space-y-3">
                {SIGNALS.map((signal) => (
                  <div
                    key={signal.title}
                    className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border border-[#f3dcd1] bg-white/80 px-4 py-3 shadow-[0_10px_30px_rgba(233,182,167,0.3)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fee1d8] to-[#ffd5eb] text-sm font-semibold text-[#9c4c4c]">
                      {signal.learners}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1f120f]">{signal.title}</p>
                      <p className="text-xs text-[#7d5c55]">{signal.vibe}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-inner">
            <div className="grid gap-4 sm:grid-cols-3">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white p-4 text-center shadow-sm">
                  <p className="text-2xl font-semibold text-[#c24f63]">{stat.value}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9b867f]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-6 lg:grid-cols-3">
          {FEATURE_STACK.map((feature) => (
            <div
              key={feature.title}
              className={`rounded-[28px] border border-[#f2e1d8] bg-gradient-to-br ${feature.accent} p-6 shadow-[0_30px_60px_rgba(246,203,193,0.4)]`}
            >
              <p className="text-xs uppercase tracking-[0.4em] text-[#b37871]">Feature</p>
              <h3 className={`${headlineFont.className} mt-2 text-xl text-[#1f120f]`}>{feature.title}</h3>
              <p className="mt-3 text-sm text-[#5b4743]">{feature.body}</p>
            </div>
          ))}
        </section>

        {/* Flow */}
        <section className="rounded-[36px] border border-[#f2e1d8] bg-white p-8 shadow-[0_35px_70px_rgba(37,23,19,0.08)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#b37871]">Flow</p>
              <h3 className={`${headlineFont.className} text-3xl text-[#1f120f]`}>How your path comes together</h3>
            </div>
            <p className="text-sm text-[#5b4743] max-w-xl">
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
                  className={`h-full rounded-3xl border p-5 text-left transition ${
                    isActive ? 'border-[#c24f63] bg-gradient-to-br from-[#fff0eb] to-[#ffe3f1] shadow-lg' : 'border-[#f2e1d8] bg-white'
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-[#b37871]">{step.stage}</p>
                  <h4 className="mt-2 text-lg font-semibold text-[#1f120f]">{step.title}</h4>
                  <p className="mt-2 text-sm text-[#5b4743]">{step.copy}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Pods */}
        <section className="rounded-[36px] border border-[#f2e1d8] bg-[#fff8f5] p-8 shadow-[0_30px_60px_rgba(230,191,182,0.5)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#b37871]">Study groups</p>
              <h3 className={`${headlineFont.className} text-3xl text-[#1f120f]`}>Pick the vibe that fits</h3>
            </div>
            <p className="text-sm text-[#5b4743] max-w-xl">
              Groups stay small, camera-optional, and matched by pace. Drop in when you need a boost.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {SIGNALS.map((signal) => (
              <div key={signal.title} className="rounded-3xl border border-[#f2d9cf] bg-white px-5 py-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#b37871]">Study group</p>
                    <p className="text-lg font-semibold text-[#1f120f]">{signal.title}</p>
                  </div>
                  <span className="rounded-full bg-[#ffe9ea] px-3 py-1 text-xs font-semibold text-[#c24f63]">
                    {signal.learners} live
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#5b4743]">{signal.vibe}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-[#a37d75]">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[#fff4ef] text-[#c24f63] font-semibold">
                    {signal.title
                      .split(' ')
                      .map((word) => word.charAt(0))
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </span>
                  <span>Join learners on this lesson · <strong>Under 30s</strong> wait</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-[36px] border border-[#f2e1d8] bg-white p-8 text-center shadow-[0_30px_70px_rgba(37,23,19,0.08)]">
          <p className="text-xs uppercase tracking-[0.5em] text-[#b37871]">Ready?</p>
          <h3 className={`${headlineFont.className} mt-2 text-3xl text-[#1f120f]`}>Start a path. Learn with your crew.</h3>
          <p className="mt-3 text-sm text-[#5b4743] max-w-2xl mx-auto">
            Type what you want to learn and get a plan in under a minute. We keep the steps, streak, and study group in one calm place.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/course"
              className="rounded-full bg-[#1f120f] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Generate my path
            </Link>
            <Link
              href="/api-test"
              className="rounded-full border border-[#1f120f]/15 px-6 py-3 text-sm font-semibold text-[#1f120f] transition hover:-translate-y-0.5"
            >
              View API example
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
