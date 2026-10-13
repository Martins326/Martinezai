import React from 'react';
import {
  PanelLeft,
  Sparkles,
  Sliders,
  Code2,
  ImageIcon,
  Share2,
} from 'lucide-react';
import { AssistantMode } from '../types';
import { ModeSelector } from './ModeSelector';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeMode: AssistantMode;
  onSelectMode: (mode: AssistantMode) => void;
  onOpenWorkspace: () => void;
  isWorkspaceOpen: boolean;
  onOpenImageGen: () => void;
  onOpenSettings: () => void;
  chatTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  activeMode,
  onSelectMode,
  onOpenWorkspace,
  isWorkspaceOpen,
  onOpenImageGen,
  onOpenSettings,
  chatTitle,
}) => {
  return (
    <header className="h-14 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-3 md:px-5 flex items-center justify-between gap-4 shrink-0 z-30">
      {/* Zone 1: Sidebar Toggle + Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-white whitespace-nowrap">
            Martins AI
          </span>
        </div>
      </div>

      {/* Zone 2: Mode Selector & Chat Title */}
      <div className="flex items-center gap-3 overflow-hidden max-w-md">
        <ModeSelector currentMode={activeMode} onSelectMode={onSelectMode} />
        {chatTitle && (
          <span className="text-xs text-neutral-400 font-medium truncate hidden lg:inline max-w-[200px]">
            {chatTitle}
          </span>
        )}
      </div>

      {/* Zone 3: Tools and Settings */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Image Generation */}
        <button
          type="button"
          onClick={onOpenImageGen}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Generate Images with Gemini"
        >
          <ImageIcon size={17} />
        </button>

        {/* Workspace Canvas Toggle */}
        <button
          type="button"
          onClick={onOpenWorkspace}
          className={`p-2 rounded-lg transition-colors ${
            isWorkspaceOpen
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Toggle Artifact Workspace Canvas"
        >
          <Code2 size={17} />
        </button>

        {/* Settings Dialog */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Settings & Memory"
        >
          <Sliders size={17} />
        </button>
      </div>
    </header>
  );
};
