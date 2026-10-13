import React, { useState } from 'react';
import { UserSettings, UserMemory } from '../types';
import {
  X,
  Sliders,
  Brain,
  ShieldCheck,
  Moon,
  Sun,
  Trash2,
  Plus,
  Info,
  Check,
  Sparkles,
  HardDrive,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  memories: UserMemory[];
  onAddMemory: (text: string) => void;
  onDeleteMemory: (id: string) => void;
  onClearMemories: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearMemories,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'memory' | 'privacy'>('general');
  const [currentSettings, setCurrentSettings] = useState<UserSettings>(settings);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(currentSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1800);
  };

  const handleAddMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemoryText.trim()) {
      onAddMemory(newMemoryText.trim());
      setNewMemoryText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Sliders size={18} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Settings & Preferences</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 px-5 bg-neutral-950/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'general'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders size={14} />
            <span>General</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'memory'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Brain size={14} />
            <span>Memory ({memories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Privacy & Storage</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs text-neutral-300">
          {activeTab === 'general' && (
            <>
              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="font-semibold text-neutral-200 block">Appearance Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSettings({ ...currentSettings, theme: 'dark' })
                    }
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                      currentSettings.theme === 'dark'
                        ? 'border-indigo-500 bg-neutral-800/80 text-white'
                        : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-800/40 text-neutral-400'
                    }`}
                  >
                    <Moon size={16} className="text-indigo-400" />
                    <div className="text-left">
                      <div className="font-medium text-xs">Dark Theme</div>
                      <div className="text-[11px] text-neutral-400">Default high contrast</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSettings({ ...currentSettings, theme: 'light' })
                    }
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                      currentSettings.theme === 'light'
                        ? 'border-indigo-500 bg-neutral-800/80 text-white'
                        : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-800/40 text-neutral-400'
                    }`}
                  >
                    <Sun size={16} className="text-amber-400" />
                    <div className="text-left">
                      <div className="font-medium text-xs">Light Theme</div>
                      <div className="text-[11px] text-neutral-400">Crisp daytime clarity</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Response Length */}
              <div className="space-y-2">
                <label className="font-semibold text-neutral-200 block">Preferred Response Length</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['concise', 'balanced', 'detailed'] as const).map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() =>
                        setCurrentSettings({ ...currentSettings, responseLength: len })
                      }
                      className={`p-2.5 rounded-lg border text-center capitalize transition-colors ${
                        currentSettings.responseLength === len
                          ? 'border-indigo-500 bg-indigo-500/10 text-white font-semibold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Custom Instructions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-200">Personal Custom Instructions</label>
                  <span className="text-[11px] text-neutral-400">Guides every conversation</span>
                </div>
                <textarea
                  value={currentSettings.customInstructions}
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      customInstructions: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="e.g., I am a computer science student. Explain algorithms with Python examples and avoid excessive jargon."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-500 text-xs focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>
            </>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-4">
              {/* Enable Memory Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">Assistant Memory</div>
                  <div className="text-[11px] text-neutral-400">
                    Allows Martins AI to reference user-defined facts across sessions
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSettings({
                      ...currentSettings,
                      enableMemory: !currentSettings.enableMemory,
                    })
                  }
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors ${
                    currentSettings.enableMemory ? 'bg-indigo-600' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-0.5 ml-0.5 ${
                      currentSettings.enableMemory ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Add Memory Form */}
              <form onSubmit={handleAddMemorySubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="Add a new memory (e.g., 'Prefers TypeScript over plain JS')..."
                  className="flex-1 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newMemoryText.trim()}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </form>

              {/* Memory List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-300">Active Memories</span>
                  {memories.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearMemories}
                      className="text-rose-400 hover:text-rose-300 text-[11px]"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {memories.length === 0 ? (
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center text-neutral-400 text-xs">
                    No memories saved. Add your preferences above.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {memories.map((mem) => (
                      <div
                        key={mem.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800"
                      >
                        <span className="text-neutral-200">{mem.text}</span>
                        <button
                          type="button"
                          onClick={() => onDeleteMemory(mem.id)}
                          className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                          title="Delete memory"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              {/* Storage Mode info */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                  <HardDrive size={16} />
                  <span>Active Storage: Guest Mode (Local Storage)</span>
                </div>
                <p className="text-neutral-400 leading-relaxed text-[11.5px]">
                  Your conversations and memories are stored exclusively inside your browser's local storage. They do not leave your device and remain accessible across browser refreshes on this computer.
                </p>
              </div>

              {/* Security info */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <ShieldCheck size={16} />
                  <span>Security & API Protection</span>
                </div>
                <ul className="space-y-1 text-neutral-400 text-[11.5px] list-disc pl-4 leading-relaxed">
                  <li>AI prompts are proxied securely through the Node.js backend.</li>
                  <li>API credentials are never exposed to browser bundles or network inspection.</li>
                  <li>Uploaded attachments are held only in memory during processing.</li>
                </ul>
              </div>

              {/* AI Processing */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <div className="font-semibold text-neutral-200">AI Service Provider</div>
                <p className="text-neutral-400 text-[11.5px] leading-relaxed">
                  Inference is conducted by Google GenAI using modern Gemini models (e.g. Gemini 3.8 Flash) configured via server environment variables.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer save bar */}
        <div className="px-5 py-3 border-t border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="text-[11px] text-neutral-400">
            {saveSuccess && (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <Check size={13} /> Saved successfully
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
