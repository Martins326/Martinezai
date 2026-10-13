import React from 'react';
import { AssistantMode } from '../types';
import { MODES } from './ModeSelector';
import {
  Sparkles,
  ArrowRight,
  Code2,
  GraduationCap,
  PenLine,
  Search,
  Lightbulb,
} from 'lucide-react';

interface EmptyStateProps {
  currentMode: AssistantMode;
  onSelectPrompt: (prompt: string) => void;
  onSelectMode: (mode: AssistantMode) => void;
}

const MODE_PROMPTS: Record<AssistantMode, { title: string; prompt: string }[]> = {
  general: [
    {
      title: 'Analyze & Plan',
      prompt: 'Help me draft a comprehensive 4-week study and preparation schedule for an upcoming systems exam.',
    },
    {
      title: 'Explain Concepts',
      prompt: 'Explain the core differences between event-driven architecture and polling systems in simple terms.',
    },
    {
      title: 'Creative Writing',
      prompt: 'Write a compelling introductory email pitching an innovative sustainability initiative to leadership.',
    },
    {
      title: 'Problem Solving',
      prompt: 'What are five high-leverage frameworks for making high-stakes decisions under uncertainty?',
    },
  ],
  study: [
    {
      title: 'Step-by-step Tutor',
      prompt: 'Teach me how Bayes theorem works step by step using a clear, intuitive diagnostic test example.',
    },
    {
      title: 'Concept Check',
      prompt: 'I want to understand recursion vs iteration. Give me an analogy and quiz my understanding.',
    },
    {
      title: 'Exam Review',
      prompt: 'Help me understand the mechanics of cellular respiration and mitochondria step-by-step.',
    },
    {
      title: 'Practice Problem',
      prompt: 'Give me a calculus optimization challenge problem and walk me through the solution strategy.',
    },
  ],
  coding: [
    {
      title: 'Code Review & Refactor',
      prompt: 'How do I implement a robust concurrency-safe debounce hook with cancellation in React TypeScript?',
    },
    {
      title: 'Architecture & Design',
      prompt: 'Design a scalable rate-limiter using token bucket algorithm with Node.js and Redis semantics.',
    },
    {
      title: 'Bug Diagnosis',
      prompt: 'Why would an SSE connection repeatedly disconnect after 60 seconds in an Express Node server?',
    },
    {
      title: 'Algorithm Analysis',
      prompt: 'Compare time and space trade-offs between QuickSort, MergeSort, and TimSort with edge cases.',
    },
  ],
  writing: [
    {
      title: 'Editorial Polish',
      prompt: 'Polish this draft paragraph to make it punchy, rhythmic, and eliminate passive voice: ',
    },
    {
      title: 'Executive Brief',
      prompt: 'Draft an executive briefing memo summarizing quarterly strategic objectives and key risks.',
    },
    {
      title: 'Storytelling Hook',
      prompt: 'Write three distinct opening hooks for an article about the quiet evolution of open-source software.',
    },
    {
      title: 'Speech Drafting',
      prompt: 'Write an inspiring 3-minute keynote address welcoming incoming engineering fellows.',
    },
  ],
  research: [
    {
      title: 'Search & Grounding',
      prompt: 'What are the most recent verified discoveries from the James Webb Space Telescope regarding early galaxies?',
    },
    {
      title: 'Comparative Analysis',
      prompt: 'Compare empirical evidence for sodium-ion batteries versus solid-state lithium cells for grid storage.',
    },
    {
      title: 'Literature Synthesis',
      prompt: 'Summarize the primary consensus and open debates regarding sleep deprivation and cognitive plasticity.',
    },
    {
      title: 'Fact Verification',
      prompt: 'Investigate the historical timeline and verified origins of the Unix operating system at Bell Labs.',
    },
  ],
  brainstorming: [
    {
      title: 'Lateral Innovation',
      prompt: 'Brainstorm 8 non-obvious product concepts combining personal local AI models with physical desk hardware.',
    },
    {
      title: 'Game & App Mechanics',
      prompt: 'Ideate engaging, non-punitive gamification mechanisms for a daily language habit tracker.',
    },
    {
      title: 'Strategic Workshop',
      prompt: 'Generate 5 contrarian business models for independent documentary filmmakers in 2026.',
    },
    {
      title: 'Event Theme Ideation',
      prompt: 'Suggest 4 cohesive, memorable conceptual themes for an international tech & design summit.',
    },
  ],
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  currentMode,
  onSelectPrompt,
  onSelectMode,
}) => {
  const activeModeConfig = MODES.find((m) => m.id === currentMode) || MODES[0];
  const IconComponent = activeModeConfig.icon;
  const prompts = MODE_PROMPTS[currentMode] || MODE_PROMPTS.general;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-2xl mx-auto text-center">
      {/* Brand Icon & Welcome */}
      <div className="w-12 h-12 rounded-2xl bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
        <Sparkles size={24} />
      </div>

      <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1.5">
        Martins AI
      </h1>

      <p className="text-xs md:text-sm text-neutral-400 mb-6 font-medium">
        Your AI. Your Ideas. Your Possibilities.
      </p>

      {/* Active mode indicator */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 mb-8">
        <IconComponent size={14} className={activeModeConfig.accentColor} />
        <span>{activeModeConfig.name}</span>
        <span className="text-neutral-500">·</span>
        <span className="text-neutral-400">{activeModeConfig.tagline}</span>
      </div>

      {/* Suggested prompts grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
        {prompts.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="group p-3.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800/80 hover:border-neutral-700 transition-all text-xs flex flex-col justify-between shadow-xs"
          >
            <div className="font-semibold text-neutral-200 group-hover:text-white mb-1 flex items-center justify-between">
              <span>{item.title}</span>
              <ArrowRight
                size={13}
                className="text-neutral-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all"
              />
            </div>
            <p className="text-neutral-400 text-[11.5px] line-clamp-2 leading-relaxed">
              {item.prompt}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
