'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FloatingCoachButton from './FloatingCoachButton';
import MiniCoachPopover from './MiniCoachPopover';
import ExpandedCoachPanel from './ExpandedCoachPanel';
import { CoachMessage, CoachMode, CoachProfile, CoachSignals, CoachStatus, TopicProgress } from './types';

type QuickKey = 'hint' | 'explain' | 'simplify' | 'overwhelmed';

const DEFAULT_PROFILE = {
  name: 'Explorer',
  subjects: ['fundamentals'],
  goals: 'Stay curious and build momentum',
  learningStyle: 'examples',
  attentionSpan: 'medium',
  pastStruggles: ['motivation']
};

const QUICK_COPY: Record<QuickKey, string> = {
  hint: 'Can I get a hint?',
  explain: 'Explain this differently.',
  simplify: 'Can you simplify this?',
  overwhelmed: "I'm overwhelmed. Slow down."
};

const MAX_RECENT = 5;

export default function LearningCoach() {
  const [mode, setMode] = useState<CoachMode>('closed');
  const [status, setStatus] = useState<CoachStatus>('idle');
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [topic, setTopic] = useState('');
  const [pending, setPending] = useState(false);
  const [learningMode, setLearningMode] = useState(false);
  const [signals, setSignals] = useState<CoachSignals | null>(null);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [error, setError] = useState('');
  const [profileCreationAttempted, setProfileCreationAttempted] = useState(false);

  const recentMessages = useMemo(
    () => messages.slice(Math.max(0, messages.length - MAX_RECENT)),
    [messages]
  );

  useEffect(() => {
    // Run once guard - prevent duplicate profile creation on re-render
    if (profileCreationAttempted) return;
    setProfileCreationAttempted(true);

    const storedId = typeof window !== 'undefined' ? localStorage.getItem('creoTutorUserId') : null;
    if (storedId) {
      hydrateUser(storedId);
    } else {
      createUser();
    }
  }, [profileCreationAttempted]);

  const hydrateUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users?id=${id}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      const payload = await res.json();
      setUserId(id);
      setProfile(payload.data.profile);
      setProgress(payload.data.progress ?? []);
      setMessages(payload.data.history ?? []);
      setLearningMode(Boolean(payload.data.history?.some((m: CoachMessage) => m.learningMode)));
    } catch (err) {
      console.error(err);
      await createUser();
    }
  };

  const createUser = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_PROFILE)
      });

      // Always parse JSON response first, even on error
      const payload = await res.json().catch(() => ({
        success: false,
        error: { code: 'PARSE_ERROR', message: 'Invalid response from server' }
      }));

      // Case A: Success - profile created or returned
      if (payload.success && payload.data?.profile?.id) {
        const id = payload.data.profile.id;
        setUserId(id);
        setProfile(payload.data.profile);
        setProgress(payload.data.progress ?? []);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('creoTutorUserId', id);
        }
        
        // Clear any previous errors
        setError('');
        return;
      }

      // Case B: Profile already exists (handled by backend now, but keep for safety)
      if (payload.error?.code === 'PROFILE_EXISTS' && payload.data?.profile?.id) {
        const id = payload.data.profile.id;
        setUserId(id);
        setProfile(payload.data.profile);
        setProgress(payload.data.progress ?? []);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('creoTutorUserId', id);
        }
        
        console.info('Using existing profile:', id);
        return;
      }

      // Case C: Validation error - show inline message but don't crash
      if (payload.error?.code === 'VALIDATION_ERROR') {
        console.warn('Profile validation failed:', payload.error.message);
        setError('Please check your profile settings.');
        // App continues to work without profile
        return;
      }

      // Case D: Other errors - log and allow app to continue
      console.warn('Profile creation issue:', payload.error || 'Unknown error');
      setError('Coach is running in limited mode.');
      
      // Don't throw - allow the app to continue rendering
    } catch (err) {
      // Case D: Network or unexpected error
      console.warn('Network error during profile creation:', err);
      setError('Coach is temporarily unavailable.');
      // App continues without profile - user can still view content
    }
  };

  const derivedStatus: CoachStatus = useMemo(() => {
    if (mode !== 'closed') return 'active';
    if (learningMode) return 'watching';
    return 'idle';
  }, [mode, learningMode]);

  const signalNote = useMemo(() => signals?.reasons?.[0], [signals]);

  useEffect(() => {
    setStatus(derivedStatus);
  }, [derivedStatus]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || !userId) return;
      setPending(true);
      setError('');

      const userMessage: CoachMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        learningMode
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            message: messageText,
            topic: topic || undefined,
            modeOverride: text && text === QUICK_COPY.overwhelmed ? 'learning' : undefined
          })
        });

        if (!res.ok) throw new Error('Tutor unavailable');
        const payload = await res.json();
        const assistantText = payload?.data?.assistant || 'I am here.';
        const assistantMessage: CoachMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantText,
          learningMode: Boolean(payload?.data?.learningMode)
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setLearningMode(Boolean(payload?.data?.learningMode));
        setSignals(payload?.data?.signals);
        setProgress(payload?.data?.topicProgress ?? []);
      } catch (err) {
        console.error(err);
        setError('I could not reach the coach. Try again in a moment.');
      } finally {
        setPending(false);
      }
    },
    [input, learningMode, topic, userId]
  );

  const handleQuick = (key: QuickKey) => {
    const text = QUICK_COPY[key];
    setInput(text);
    sendMessage(text);
  };

  const openMini = () => setMode('mini');
  const openExpanded = () => setMode('expanded');
  const closeAll = () => setMode('closed');

  return (
    <>
      <FloatingCoachButton status={status} onOpen={mode === 'closed' ? openMini : closeAll} />

      {mode === 'mini' && (
        <MiniCoachPopover
          messages={recentMessages}
          input={input}
          onInputChange={setInput}
          onSend={() => sendMessage()}
          onClose={closeAll}
          onExpand={openExpanded}
          onQuick={handleQuick}
          pending={pending}
          learningMode={learningMode}
          signalNote={signalNote}
        />
      )}

      <ExpandedCoachPanel
        open={mode === 'expanded'}
        onClose={closeAll}
        messages={messages}
        input={input}
        topic={topic}
        onInputChange={setInput}
        onTopicChange={setTopic}
        onSend={() => sendMessage()}
        pending={pending}
        learningMode={learningMode}
        profile={profile}
        progress={progress}
        signalNote={signalNote}
      />

      {error && (
        <div className="fixed bottom-24 right-6 z-50 rounded-2xl bg-[#1f120f] px-3 py-2 text-xs font-semibold text-white shadow-lg">
          {error}
        </div>
      )}
    </>
  );
}
