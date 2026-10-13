import { Conversation, UserMemory, UserSettings, Artifact } from '../types';

const CONVERSATIONS_KEY = 'martins_ai_conversations_v1';
const SETTINGS_KEY = 'martins_ai_settings_v1';
const MEMORIES_KEY = 'martins_ai_memories_v1';
const ARTIFACTS_KEY = 'martins_ai_artifacts_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  defaultMode: 'general',
  responseLength: 'balanced',
  customInstructions: '',
  enableMemory: true,
  enableSearchGrounding: false,
  ttsVoice: 'default',
  fontSize: 'md',
};

export const StorageService = {
  // Settings
  getSettings(): UserSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  },

  // Conversations
  getConversations(): Conversation[] {
    try {
      const stored = localStorage.getItem(CONVERSATIONS_KEY);
      if (stored) {
        const parsed: Conversation[] = JSON.parse(stored);
        return parsed.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      }
    } catch (e) {
      console.warn('Failed to load conversations from localStorage', e);
    }
    return [];
  },

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.warn('Failed to save conversations to localStorage', e);
    }
  },

  getConversation(id: string): Conversation | null {
    const list = this.getConversations();
    return list.find((c) => c.id === id) || null;
  },

  saveConversation(conv: Conversation): void {
    const list = this.getConversations();
    const index = list.findIndex((c) => c.id === conv.id);
    if (index >= 0) {
      list[index] = { ...conv, updatedAt: Date.now() };
    } else {
      list.unshift({ ...conv, updatedAt: Date.now() });
    }
    this.saveConversations(list);
  },

  deleteConversation(id: string): void {
    const list = this.getConversations().filter((c) => c.id !== id);
    this.saveConversations(list);
  },

  deleteAllConversations(): void {
    try {
      localStorage.removeItem(CONVERSATIONS_KEY);
    } catch (e) {
      console.warn('Failed to delete conversations', e);
    }
  },

  togglePin(id: string): void {
    const list = this.getConversations();
    const target = list.find((c) => c.id === id);
    if (target) {
      target.isPinned = !target.isPinned;
      this.saveConversations(list);
    }
  },

  toggleArchive(id: string): void {
    const list = this.getConversations();
    const target = list.find((c) => c.id === id);
    if (target) {
      target.isArchived = !target.isArchived;
      this.saveConversations(list);
    }
  },

  renameConversation(id: string, newTitle: string): void {
    const list = this.getConversations();
    const target = list.find((c) => c.id === id);
    if (target) {
      target.title = newTitle.trim() || 'Untitled Conversation';
      target.updatedAt = Date.now();
      this.saveConversations(list);
    }
  },

  // Memories
  getMemories(): UserMemory[] {
    try {
      const stored = localStorage.getItem(MEMORIES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load memories', e);
    }
    return [];
  },

  saveMemories(memories: UserMemory[]): void {
    try {
      localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories));
    } catch (e) {
      console.warn('Failed to save memories', e);
    }
  },

  addMemory(text: string): UserMemory {
    const memories = this.getMemories();
    const newMemory: UserMemory = {
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      text: text.trim(),
      createdAt: Date.now(),
    };
    memories.unshift(newMemory);
    this.saveMemories(memories);
    return newMemory;
  },

  deleteMemory(id: string): void {
    const memories = this.getMemories().filter((m) => m.id !== id);
    this.saveMemories(memories);
  },

  clearAllMemories(): void {
    try {
      localStorage.removeItem(MEMORIES_KEY);
    } catch (e) {
      console.warn('Failed to clear memories', e);
    }
  },

  // Artifacts
  getArtifacts(): Artifact[] {
    try {
      const stored = localStorage.getItem(ARTIFACTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load artifacts', e);
    }
    return [];
  },

  saveArtifact(artifact: Artifact): void {
    const artifacts = this.getArtifacts();
    const index = artifacts.findIndex((a) => a.id === artifact.id);
    if (index >= 0) {
      artifacts[index] = { ...artifact, updatedAt: Date.now() };
    } else {
      artifacts.unshift({ ...artifact, updatedAt: Date.now() });
    }
    localStorage.setItem(ARTIFACTS_KEY, JSON.stringify(artifacts));
  },

  // Export helpers
  exportConversationMarkdown(conv: Conversation): string {
    let md = `# ${conv.title}\n\n`;
    md += `*Mode: ${conv.mode} | Date: ${new Date(conv.createdAt).toLocaleString()}*\n\n---\n\n`;
    for (const msg of conv.messages) {
      const sender = msg.role === 'user' ? '**You**' : '**Martins AI**';
      md += `### ${sender} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n`;
      md += `${msg.content}\n\n`;
      if (msg.groundingSources && msg.groundingSources.length > 0) {
        md += `*Sources:*\n`;
        for (const src of msg.groundingSources) {
          md += `- [${src.title}](${src.uri})\n`;
        }
        md += '\n';
      }
    }
    return md;
  },

  exportConversationJSON(conv: Conversation): string {
    return JSON.stringify(conv, null, 2);
  },
};
