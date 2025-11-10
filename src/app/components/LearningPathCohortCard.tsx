'use client';

import { useMemo } from 'react';
import { Activity, MessageCircle, Sparkles, Users, Video } from 'lucide-react';

interface LearningPathCohortCardProps {
  topic: string;
  learnerCount?: number;
  joinUrl?: string;
}

const sampleLearners = [
  { name: 'Maya', initials: 'M', status: 'Deep work' },
  { name: 'Ravi', initials: 'R', status: 'Office hours' },
  { name: 'Jules', initials: 'J', status: 'Sketching flows' },
  { name: 'Nadia', initials: 'N', status: 'Threading Q&A' },
  { name: 'Kenzo', initials: 'K', status: 'Voice room' }
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'learning-path';

export default function LearningPathCohortCard({ topic, learnerCount, joinUrl }: LearningPathCohortCardProps) {
  const activeLearners = useMemo(() => learnerCount ?? Math.max(48, topic.length * 9 + 120), [topic, learnerCount]);
  const cohortLink = joinUrl ?? `https://discord.gg/${slugify(topic)}`;
  const studySpaces = useMemo(
    () => [
      { label: 'Chat room', icon: MessageCircle, count: 3 },
      { label: 'Voice room', icon: Video, count: 2 },
      { label: 'Focus group', icon: Activity, count: 4 }
    ],
    []
  );

  return (
    <div className="rounded-[36px] border border-[#f3e1d8] bg-gradient-to-r from-[#fff7f1] to-[#ffeef1] p-6 shadow-[0_30px_80px_rgba(244,198,198,0.3)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-[#c27c74]">Global study group</p>
          <h3 className="text-2xl font-semibold text-[#3b1f1a]">{topic || 'Learning path'}</h3>
          <p className="text-sm text-[#7d5850]">{activeLearners.toLocaleString()} learners studying this now.</p>
        </div>
        <a
          href={cohortLink}
          target="_blank"
          rel="noreferrer"
          className="rounded-full px-5 py-2 text-sm font-semibold bg-[#c85d5d] text-white shadow-[0_18px_35px_rgba(200,93,93,0.45)] transition hover:-translate-y-0.5"
        >
          Join study group
        </a>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[3fr,2fr]">
        <div className="rounded-3xl border border-[#f3deda] bg-white/80 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-[#c47a70] mb-3">Now inside</p>
          <div className="flex flex-wrap gap-4">
            {sampleLearners.map((learner) => (
              <div key={learner.name} className="flex items-center gap-3 rounded-2xl border border-[#f4e2dd] px-3 py-2">
                <div className="h-10 w-10 rounded-2xl bg-[#fde4e1] text-[#c85d5d] font-semibold flex items-center justify-center">
                  {learner.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#3b1f1a]">{learner.name}</p>
                  <p className="text-xs text-[#8c6860]">{learner.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-[#f3deda] bg-white/80 p-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[#c47a70]">Study spaces</p>
          {studySpaces.map((space) => (
            <div key={space.label} className="flex items-center justify-between rounded-2xl border border-[#f4e2dd] px-3 py-3">
              <div className="flex items-center gap-3">
                <space.icon className="h-4 w-4 text-[#c85d5d]" />
                <div>
                  <p className="text-sm font-semibold text-[#3b1f1a]">{space.label}</p>
                  <p className="text-xs text-[#8c6860]">{space.count} people active</p>
                </div>
              </div>
              <Sparkles className="h-4 w-4 text-[#d98787]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
