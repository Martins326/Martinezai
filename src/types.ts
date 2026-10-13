export type AssistantMode = 'general' | 'study' | 'coding' | 'writing' | 'research' | 'brainstorming';

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: string; // Base64
  previewUrl?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  groundingSources?: GroundingSource[];
  feedback?: 'like' | 'dislike' | null;
  error?: boolean;
  mode?: AssistantMode;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mode: AssistantMode;
  messages: Message[];
  isPinned?: boolean;
  isArchived?: boolean;
}

export interface UserMemory {
  id: string;
  text: string;
  createdAt: number;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  defaultMode: AssistantMode;
  responseLength: 'balanced' | 'concise' | 'detailed';
  customInstructions: string;
  enableMemory: boolean;
  enableSearchGrounding: boolean;
  ttsVoice: string;
  fontSize: 'sm' | 'md' | 'lg';
}

export interface Artifact {
  id: string;
  title: string;
  language: string; // e.g. javascript, html, markdown, python, json, text
  content: string;
  createdAt: number;
  updatedAt: number;
}
