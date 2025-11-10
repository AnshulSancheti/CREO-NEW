'use client';

import { useMemo, useState } from 'react';
import { CourseModule } from '@/app/types/course';

interface CourseNotesSidebarProps {
  modules: CourseModule[];
}

interface CourseNote {
  id: string;
  moduleId: string;
  topicId: string;
  text: string;
  createdAt: string;
}

export default function CourseNotesSidebar({ modules }: CourseNotesSidebarProps) {
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || '');
  const [selectedTopicId, setSelectedTopicId] = useState(modules[0]?.topics[0]?.id || '');
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<CourseNote[]>([]);

  const moduleOptions = useMemo(() => modules.map((mod) => ({ value: mod.id, label: mod.title })), [modules]);
  const topicOptions = useMemo(() => {
    return modules
      .find((mod) => mod.id === selectedModuleId)?.topics
      .map((topic) => ({ value: topic.id, label: topic.title })) || [];
  }, [modules, selectedModuleId]);

  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    const firstTopic = modules.find((mod) => mod.id === moduleId)?.topics[0];
    setSelectedTopicId(firstTopic?.id || '');
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedModuleId || !selectedTopicId) return;
    const newNote: CourseNote = {
      id: `${selectedTopicId}-${Date.now()}`,
      moduleId: selectedModuleId,
      topicId: selectedTopicId,
      text: noteText.trim(),
      createdAt: new Date().toISOString()
    };
    setNotes((prev) => [newNote, ...prev]);
    setNoteText('');
  };

  const notesByModule = useMemo(() => {
    const map = new Map<string, CourseNote[]>();
    notes.forEach((note) => {
      const current = map.get(note.moduleId) || [];
      current.push(note);
      map.set(note.moduleId, current);
    });
    return map;
  }, [notes]);

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside className="bg-white rounded-3xl border border-[#f2e7d9] shadow-lg p-5 space-y-5 sticky top-6 max-h-[80vh] overflow-y-auto">
      <div>
        <p className="text-xs tracking-[0.4em] uppercase text-[#c1b6a4]">Notes</p>
        <h3 className="text-xl font-semibold text-[#111]">Study stream</h3>
        <p className="text-sm text-[#4a4a4a]">Capture insights per topic while you explore the modules.</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-[#6f6f6f] uppercase tracking-[0.2em]">Module</label>
          <select
            value={selectedModuleId}
            onChange={(e) => handleModuleChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#eaded0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#262626]/15"
          >
            {moduleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#6f6f6f] uppercase tracking-[0.2em]">Topic</label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#eaded0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#262626]/15"
          >
            {topicOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Capture what clicked or a link to revisit..."
            className="w-full h-28 rounded-2xl border border-[#eaded0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#262626]/15"
          />
        </div>
        <button
          type="button"
          onClick={handleAddNote}
          disabled={!noteText.trim() || !selectedModuleId || !selectedTopicId}
          className="w-full rounded-full bg-[#111] text-white text-sm font-semibold tracking-wide py-2 disabled:opacity-40"
        >
          Drop note into stream
        </button>
      </div>

      <div className="space-y-4">
        {modules.map((module) => {
          const moduleNotes = notesByModule.get(module.id) || [];
          if (moduleNotes.length === 0) return null;
          return (
            <div key={module.id} className="space-y-2">
              <p className="text-xs tracking-[0.4em] uppercase text-[#c1b6a4]">{module.title}</p>
              <div className="space-y-2">
                {moduleNotes.map((note) => {
                  const topic = module.topics.find((t) => t.id === note.topicId);
                  return (
                    <div key={note.id} className="rounded-2xl border border-[#f2e7d9] p-3 bg-white">
                      <p className="text-xs text-[#6f6f6f] flex justify-between">
                        <span>{topic?.title || 'Topic'}</span>
                        <span>{formatTimestamp(note.createdAt)}</span>
                      </p>
                      <p className="text-sm text-[#111] mt-1">
                        {note.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {notes.length === 0 && (
          <p className="text-sm text-[#6f6f6f]">No notes yet. Start typing to build your personal stream.</p>
        )}
      </div>
    </aside>
  );
}
