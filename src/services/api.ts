import { Message, AssistantMode, GroundingSource, Attachment } from '../types';

export interface StreamChatOptions {
  messages: Message[];
  message: string;
  attachments?: Attachment[];
  mode: AssistantMode;
  customInstructions?: string;
  enableSearch?: boolean;
  onChunk: (chunk: string) => void;
  onGrounding?: (sources: GroundingSource[]) => void;
  signal?: AbortSignal;
}

export const ApiService = {
  async checkHealth(): Promise<{ configured: boolean; model: string; appName: string }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check returned non-200');
      return await res.json();
    } catch (e) {
      console.warn('Backend health check error:', e);
      return { configured: false, model: 'gemini-3.8-flash', appName: 'Martins AI' };
    }
  },

  async streamChat({
    messages,
    message,
    attachments = [],
    mode,
    customInstructions = '',
    enableSearch = false,
    onChunk,
    onGrounding,
    signal,
  }: StreamChatOptions): Promise<string> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        message,
        attachments,
        mode,
        customInstructions,
        enableSearch,
      }),
      signal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Network request failed' }));
      throw new Error(errData.error || `Server responded with ${response.status}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by browser/transport.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const payloadStr = trimmed.slice(6);
        try {
          const data = JSON.parse(payloadStr);
          if (data.type === 'chunk' && data.text) {
            accumulatedText += data.text;
            onChunk(data.text);
          } else if (data.type === 'grounding' && data.sources) {
            if (onGrounding) onGrounding(data.sources);
          } else if (data.type === 'done') {
            if (data.fullText && !accumulatedText) {
              accumulatedText = data.fullText;
              onChunk(data.fullText);
            }
          } else if (data.type === 'error') {
            throw new Error(data.error || 'Generation error');
          }
        } catch (e: any) {
          if (e.message && e.message !== 'Generation error') {
            // Not a JSON parse error we threw
            console.debug('SSE parse notice:', e);
          } else {
            throw e;
          }
        }
      }
    }

    return accumulatedText;
  },

  async generateImage(prompt: string, aspectRatio = '1:1'): Promise<{ imageUrl: string }> {
    const res = await fetch('/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspectRatio }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Image request failed' }));
      throw new Error(err.error || 'Failed to generate image.');
    }

    return await res.json();
  },

  async generateTitle(message: string): Promise<string> {
    try {
      const res = await fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.title || 'New Conversation';
      }
    } catch {
      // Fallback
    }
    return message.slice(0, 30).trim() || 'New Conversation';
  },

  async generateTTS(text: string, voice = 'Kore'): Promise<string> {
    const res = await fetch('/api/speech/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'TTS request failed' }));
      throw new Error(err.error || 'Speech synthesis failed.');
    }

    const data = await res.json();
    return data.audioUrl;
  },
};
