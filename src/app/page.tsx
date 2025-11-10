'use client';

import { startTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import { Playfair_Display, Space_Grotesk } from 'next/font/google';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, BookOpenCheck, GraduationCap, Sparkles, Star } from 'lucide-react';
import CourseProgress from '@/app/components/CourseProgress';
import { Course } from '@/app/types/course';
import Waves from '@/app/components/Waves';

const headlineFont = Playfair_Display({ subsets: ['latin'], weight: ['600', '700', '900'] });
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
    copy: 'Daily nudges, progress checkpoints, and quick recaps show what to do today and what\'s next.'
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
    <>
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

      {/* 3D Hero Section */}
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#a95757] via-[#c1b6a4] to-[#a95757]">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#b87070]/80 via-[#d4c9b8]/70 to-[#b87070]/80"
          animate={{
            opacity: [0.7, 0.9, 0.7],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Soft waves overlay */}
        <Waves
          lineColor="rgba(255, 255, 255, 0.12)"
          backgroundColor="transparent"
          waveSpeedX={0.006}
          waveSpeedY={0.002}
          waveAmpX={25}
          waveAmpY={15}
          xGap={15}
          yGap={45}
          friction={0.96}
          tension={0.003}
          maxCursorMove={60}
          style={{ position: 'absolute', zIndex: 1, pointerEvents: 'none' }}
        />

        {/* Floating sparkles */}
        <motion.div
          className="absolute top-[15%] left-[10%] text-yellow-200 z-10"
          animate={{
            y: [-10, 10, -10],
            rotate: [0, 45, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Star className="w-8 h-8 fill-current" />
        </motion.div>

        <motion.div
          className="absolute top-[25%] right-[15%] text-yellow-200 z-10"
          animate={{
            y: [10, -10, 10],
            rotate: [45, 0, 45],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
        >
          <Sparkles className="w-6 h-6" />
        </motion.div>

        <motion.div
          className="absolute bottom-[30%] right-[20%] text-yellow-200 z-10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          <Star className="w-5 h-5 fill-current" />
        </motion.div>

        <motion.div
          className="absolute bottom-[20%] left-[18%] text-yellow-200 z-10"
          animate={{
            y: [-8, 8, -8],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 4.5, repeat: Infinity, delay: 1.5 }}
        >
          <Sparkles className="w-7 h-7" />
        </motion.div>

        {/* Navigation */}
        <nav className="relative z-30 px-6 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-2xl font-bold text-white shadow-lg">
                ∞
              </div>
              <div className="relative inline-flex items-center overflow-hidden rounded-full border border-white/30 bg-white/20 backdrop-blur-md px-5 py-1.5 text-sm font-bold uppercase tracking-[0.35em] text-white">
                <motion.span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(120deg, rgba(255,218,193,0.25), rgba(255,173,196,0.35), rgba(255,218,193,0.25))'
                  }}
                  animate={{ x: ['-30%', '30%', '-10%'], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="relative z-10 tracking-[0.35em]">CREO</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/course"
                className="px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold text-sm hover:bg-white/30 transition-all"
              >
                Launch Builder
              </Link>
              <Link
                href="/api-test"
                className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-all"
              >
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
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  showJourney ? 'bg-white text-[#a95757] border-white' : 'bg-white/20 backdrop-blur-md text-white border-white/30'
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
                className="rounded-full border border-white/30 bg-white/20 backdrop-blur-md px-4 py-2 font-semibold text-white shadow-sm hover:bg-white/30 transition-all"
              >
                Sign in
              </button>
              {showJourney && (
                <div className="absolute right-0 top-14 z-30 w-[30rem] max-h-[85vh] overflow-visible rounded-3xl border border-[#f2e1d8] bg-white/95 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.15)]">
                  <CourseProgress journey={navJourney} />
                </div>
              )}
              {showAuth && <AuthDialogue onClose={() => setShowAuth(false)} />}
            </div>
          </div>
        </nav>

        {/* 3D Floating Hero Content */}
        <div className="relative z-20 flex items-center justify-center min-h-[calc(100vh-100px)] px-6">
          <div className="max-w-7xl w-full">
            {/* Floating elements */}
            
            {/* Holographic course card - left */}
            <motion.div
              className="absolute left-[5%] top-[20%] hidden lg:block"
              animate={{
                y: [-15, 15, -15],
                rotate: [-3, 3, -3]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-72 h-44 rounded-3xl bg-gradient-to-br from-purple-400/30 via-pink-300/30 to-yellow-300/30 backdrop-blur-xl border border-white/40 shadow-2xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">Active Course</span>
                  </div>
                  <h3 className={`${headlineFont.className} text-white text-xl mb-2`}>React Fundamentals</h3>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-gradient-to-r from-yellow-300 to-pink-300 h-2 rounded-full w-2/3" />
                    </div>
                    <span>67%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mascot - right top */}
            <motion.div
              className="absolute right-[8%] top-[15%] hidden lg:block"
              animate={{
                y: [-20, 20, -20],
                rotate: [5, -5, 5]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border-4 border-white/50 shadow-2xl flex items-center justify-center">
                <GraduationCap className="w-24 h-24 text-white drop-shadow-lg" />
              </div>
            </motion.div>

            {/* Progress card - left bottom */}
            <motion.div
              className="absolute left-[8%] bottom-[15%] hidden lg:block"
              animate={{
                y: [15, -15, 15],
                rotate: [-5, 5, -5]
              }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="rounded-3xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-2xl">🎯</span>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Your Progress</p>
                    <p className={`${headlineFont.className} text-white text-2xl font-bold`}>24 Modules</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Achievement badge - bottom center */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 bottom-[20%] hidden lg:block"
              animate={{
                y: [-10, 10, -10],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-20 h-24 rounded-2xl bg-gradient-to-br from-yellow-200/40 to-orange-300/40 backdrop-blur-xl border border-white/50 shadow-2xl flex items-center justify-center">
                <div className="text-4xl">🏆</div>
              </div>
            </motion.div>

            {/* Cloud decoration - right bottom */}
            <motion.div
              className="absolute right-[12%] bottom-[12%] hidden lg:block"
              animate={{
                x: [-10, 10, -10],
                y: [-5, 5, -5]
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="text-8xl opacity-60 filter drop-shadow-2xl">
                ☁️
              </div>
            </motion.div>

            {/* Stats indicator - top right */}
            <motion.div
              className="absolute right-[15%] top-[35%] hidden lg:block"
              animate={{
                scale: [1, 1.05, 1],
                y: [-5, 5, -5]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white text-sm font-semibold">Active</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-yellow-200 text-2xl font-bold">18,240</span>
                  <span className="text-white/70 text-xs">learners</span>
                </div>
              </div>
            </motion.div>

            {/* Main headline */}
            <div className="text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className={`${headlineFont.className} text-6xl md:text-8xl lg:text-9xl font-black text-white mb-4 relative inline-block`}>
                  <span className="relative z-10 drop-shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                    Meet
                    <br />
                    Creo
                  </span>
                  <div className="absolute inset-0 bg-white/10 blur-3xl -z-10" />
                </h1>
              </motion.div>

              <motion.p
                className="text-white/90 text-xl md:text-2xl font-medium mt-6 mb-8 drop-shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                This is Smart Learning
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Link
                  href="/course"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 text-gray-900 font-bold text-lg shadow-2xl hover:shadow-yellow-400/50 hover:scale-105 transition-all"
                >
                  <span>Start Learning</span>
                  <span className="text-xl">→</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Original Homepage Content Below */}
      <div className={`${bodyFont.className} bg-[#fdf8f2] text-[#1f120f]`}>
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
    </>
  );
}
