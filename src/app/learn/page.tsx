'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  MessageCircle,
  PlayCircle,
  Settings,
  Sparkles,
  XCircle,
  Users
} from 'lucide-react';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

type Mode = 'learn' | 'practice' | 'apply';

const DEFAULT_NEXT_STEP = {
  title: 'Understand arrays and iteration basics',
  summary: 'Grasp arrays, loops, and simple iteration patterns in JavaScript.',
  time: '12–15 min'
};

const FEATURE_COLORS = ['#ffe8e8', '#fff0e0', '#e0f7f4'];

export default function LearnWorkspace() {
  const [topic, setTopic] = useState('JavaScript arrays for beginners');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [timePerDay, setTimePerDay] = useState('20 minutes');
  const [deadline, setDeadline] = useState('');
  const [experience, setExperience] = useState('Beginner');
  const [generated, setGenerated] = useState(false);
  const [mode, setMode] = useState<Mode>('learn');
  const [showComparison, setShowComparison] = useState(true);
  const [progressExpanded, setProgressExpanded] = useState(false);

  const nextStep = useMemo(() => DEFAULT_NEXT_STEP, []);

  return (
    <div className={`${jakarta.className} min-h-screen bg-[#fff8f5] text-[#1f120f]`}>
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 lg:gap-8">
        {/* Left sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-6 rounded-3xl border border-[#f2e1d8] bg-white/80 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold tracking-[0.3em] text-[#7d5c55]">Navigation</p>
            <nav className="mt-3 space-y-1 text-sm font-semibold text-[#5b4743]">
              {[
                { label: 'Overview', icon: Compass },
                { label: 'Learning path', icon: BookOpen },
                { label: 'Practice', icon: PlayCircle },
                { label: 'Coach', icon: MessageCircle },
                { label: 'Crew', icon: Users },
                { label: 'Resources', icon: FileText },
                { label: 'Settings', icon: Settings }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 transition hover:bg-[#ffe9e0] ${
                    item.label === 'Learning path' ? 'bg-[#ffe9e0] text-[#1f120f]' : ''
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.label === 'Practice' && (
                    <span className="ml-auto rounded-full bg-[#fff3ee] px-2 py-0.5 text-[10px] font-semibold text-[#c24f63]">
                      Recommended
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Center workspace */}
        <main className="flex-1 space-y-6">
          {/* Momentum + progress explainer */}
          <div className="flex flex-col gap-3 rounded-3xl border border-[#f2e1d8] bg-white/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-[#ffe9e0] px-3 py-1 font-semibold text-[#a33249]">Momentum: steady</span>
              <span className="rounded-full bg-[#fff3ee] px-3 py-1 text-[#5b4743]">Focused today: 8 min</span>
            </div>
            <details className="w-full rounded-2xl bg-[#fff3ee] px-4 py-3 text-sm text-[#5b4743] sm:w-auto">
              <summary className="cursor-pointer list-none font-semibold text-[#1f120f]">
                Progress is based on understanding, not points.
              </summary>
              <div className="mt-2 space-y-1 text-sm">
                <p>We track completion of steps, confidence per topic, and focus consistency.</p>
                <p className="text-xs text-[#7d5c55]">
                  This adapts what you see next, practice difficulty, and coach responses.
                </p>
              </div>
            </details>
          </div>

          {/* Course generation / Next step */}
          {!generated ? (
            <section className="space-y-4 rounded-3xl border border-[#f2e1d8] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
              <p className="text-xs uppercase tracking-[0.4em] text-[#7d5c55]">Let’s build your learning path</p>
              <h1 className="text-3xl font-extrabold text-[#1f120f]">What do you want to learn?</h1>
              <div className="space-y-3">
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-[#f2e1d8] bg-[#fffaf6] px-4 py-3 text-base text-[#1f120f] shadow-inner focus:border-[#c24f63] focus:outline-none"
                  placeholder="Type a topic, goal, or outcome..."
                />
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((s) => !s)}
                  className="text-sm font-semibold text-[#c24f63] underline-offset-4 hover:underline"
                >
                  {advancedOpen ? 'Hide optional details' : 'Add time, deadline, or experience'}
                </button>
                {advancedOpen && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#7d5c55]">Time per day</label>
                      <input
                        value={timePerDay}
                        onChange={(e) => setTimePerDay(e.target.value)}
                        className="w-full rounded-2xl border border-[#f2e1d8] bg-[#fffaf6] px-3 py-2 text-sm focus:border-[#c24f63] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#7d5c55]">Deadline (optional)</label>
                      <input
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full rounded-2xl border border-[#f2e1d8] bg-[#fffaf6] px-3 py-2 text-sm focus:border-[#c24f63] focus:outline-none"
                        placeholder="e.g., June 30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#7d5c55]">Experience level</label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full rounded-2xl border border-[#f2e1d8] bg-[#fffaf6] px-3 py-2 text-sm focus:border-[#c24f63] focus:outline-none"
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#5b4743]">CREO will break this into clear steps using trusted resources.</p>
                <button
                  type="button"
                  onClick={() => setGenerated(true)}
                  className="inline-flex items-center justify-center rounded-full bg-[#c24f63] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Generate my path
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <div className="rounded-3xl border border-[#f2e1d8] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
                <p className="text-xs uppercase tracking-[0.4em] text-[#7d5c55]">Your next step</p>
                <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1f120f]">{nextStep.title}</h2>
                    <p className="text-sm text-[#5b4743]">{nextStep.summary}</p>
                    <p className="text-sm font-semibold text-[#a33249]">Estimated time: {nextStep.time}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="rounded-full bg-[#c24f63] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5">
                      Continue
                    </button>
                    <button className="rounded-full border border-[#f2e1d8] px-4 py-2.5 text-sm font-semibold text-[#1f120f] transition hover:-translate-y-0.5">
                      Change pace
                    </button>
                    <button className="rounded-full border border-[#f2e1d8] px-4 py-2.5 text-sm font-semibold text-[#1f120f] transition hover:-translate-y-0.5">
                      Make this easier
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { id: 'learn', title: 'Learn', desc: 'Follow the structured lesson with notes and examples.' },
                  { id: 'practice', title: 'Practice', desc: 'Auto-generated questions from weak areas.', badge: 'Recommended' },
                  { id: 'apply', title: 'Apply', desc: 'Mini task to use what you just learned.' }
                ].map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id as Mode)}
                    className={`flex h-full flex-col items-start gap-2 rounded-2xl border p-4 text-left transition ${
                      mode === item.id ? 'border-[#c24f63] shadow-[0_10px_30px_rgba(194,79,99,0.15)]' : 'border-[#f2e1d8]'
                    }`}
                    style={{ backgroundColor: FEATURE_COLORS[idx] || '#fff3ee' }}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${mode === item.id ? 'text-[#a33249]' : 'text-[#7d5c55]'}`} />
                      <p className="text-sm font-semibold text-[#1f120f]">{item.title}</p>
                      {item.badge && (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#c24f63]">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#5b4743]">{item.desc}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Progress explainer mini */}
          <div className="rounded-2xl border border-[#f2e1d8] bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-[#1f120f]">
                Progress in CREO is measured by understanding and consistency — not XP.
              </p>
              <button
                type="button"
                onClick={() => setProgressExpanded((s) => !s)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#c24f63] underline-offset-4 hover:underline"
              >
                {progressExpanded ? 'Hide' : 'Learn more'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {progressExpanded && (
              <div className="mt-3 space-y-2 rounded-xl bg-[#fff3ee] p-3 text-sm text-[#5b4743]">
                <p>We keep it simple:</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#a33249]" /> Steps completed
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#a33249]" /> Confidence per topic
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#a33249]" /> Focused time (tiny sessions count)
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Clutter vs Direction comparison */}
          {showComparison ? (
            <section className="rounded-3xl border border-[#f2e1d8] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#7d5c55]">Clutter vs Direction</p>
                  <h3 className="text-2xl font-bold text-[#1f120f]">Stop piecing learning together.</h3>
                  <p className="text-sm text-[#5b4743]">
                    CREO replaces scattered tools and unclear goals with a single guided path.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComparison(false)}
                  className="rounded-full border border-[#f2e1d8] px-3 py-1 text-xs font-semibold text-[#5b4743] transition hover:-translate-y-0.5"
                >
                  Collapse
                </button>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#a33249]">Cluttered approach</p>
                  <div className="space-y-2">
                    {[
                      'Jumping between videos, notes, and random practice sites',
                      'Not knowing what to do next after each session',
                      'Progress feels like time spent, not understanding gained',
                      'Revision happens too late and feels overwhelming',
                      'Motivation depends on willpower and long sessions',
                      'Too many tabs, too little clarity'
                    ].map((text) => (
                      <div key={text} className="flex items-start gap-2 rounded-2xl bg-[#fff1ef] p-3 text-sm text-[#5b4743]">
                        <XCircle className="mt-0.5 h-4 w-4 text-[#c24f63]" />
                        <p>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 lg:border-l lg:border-[#f2e1d8] lg:pl-6">
                  <p className="text-sm font-semibold text-[#1f7a4c]">CREO: Direction-first</p>
                  <div className="space-y-2">
                    {[
                      'One path with clear next steps',
                      'Coach detects blockers and switches to hint-first mode',
                      'Practice is generated from weak spots automatically',
                      'Progress is based on confidence + consistency (not points)',
                      'Short sessions still count — momentum without guilt',
                      'Resources are curated and tied to the exact step'
                    ].map((text) => (
                      <div key={text} className="flex items-start gap-2 rounded-2xl bg-[#e8f7f0] p-3 text-sm text-[#1f120f]">
                        <Check className="mt-0.5 h-4 w-4 text-[#1f7a4c]" />
                        <p>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <button
              type="button"
              onClick={() => setShowComparison(true)}
              className="flex items-center gap-2 rounded-full border border-[#f2e1d8] bg-white px-4 py-2 text-xs font-semibold text-[#5b4743] shadow-sm transition hover:-translate-y-0.5"
            >
              Clutter → Direction ✓
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </main>

        {/* Right panel */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-3xl border border-[#f2e1d8] bg-white/80 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c24f63] text-white">CR</div>
                <div>
                  <p className="text-sm font-semibold text-[#1f120f]">Alex Rivers</p>
                  <p className="text-xs text-[#7d5c55]">Focus: {topic || 'Your topic'}</p>
                </div>
              </div>
              <Link href="/settings" className="mt-3 inline-block text-sm font-semibold text-[#c24f63] underline-offset-4 hover:underline">
                Edit preferences
              </Link>
            </div>

            <div className="rounded-3xl border border-[#f2e1d8] bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-[#7d5c55]">Coach</p>
              <p className="mt-2 text-sm text-[#1f120f]">Stuck? Ask the coach.</p>
              <p className="text-xs text-[#5b4743]">Last blocker: “Loop keeps breaking at index.”</p>
              <button className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#c24f63] px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5">
                Ask a question <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-3xl border border-[#f2e1d8] bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-[#7d5c55]">Crew</p>
              <p className="mt-2 text-sm text-[#1f120f]">3 learners are on the same module.</p>
              <p className="text-xs text-[#5b4743]">Next focus session in 2h.</p>
              <button className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#f2e1d8] px-4 py-2 text-sm font-semibold text-[#1f120f] transition hover:-translate-y-0.5">
                Join a session
              </button>
            </div>

            <div className="rounded-3xl border border-[#f2e1d8] bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-[#1f120f]">Short session today keeps momentum.</p>
              <p className="text-xs text-[#5b4743]">Pick a 10-minute task if you’re low on time.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
