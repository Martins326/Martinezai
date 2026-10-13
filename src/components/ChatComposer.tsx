import React, { useState, useRef, useEffect } from 'react';
import { Attachment } from '../types';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  MicOff,
  Globe,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface ChatComposerProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onStopGeneration?: () => void;
  isStreaming: boolean;
  enableSearch: boolean;
  onToggleSearch: () => void;
  placeholder?: string;
}

const SUPPORTED_MIME_TYPES: Record<string, string> = {
  'image/png': 'PNG Image',
  'image/jpeg': 'JPEG Image',
  'image/webp': 'WebP Image',
  'application/pdf': 'PDF Document',
  'text/plain': 'Text File',
  'text/markdown': 'Markdown File',
  'text/csv': 'CSV File',
  'application/json': 'JSON File',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  enableSearch,
  onToggleSearch,
  placeholder = 'Ask Martins AI anything...',
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Input hook
  const { isListening, isSupported, error: voiceError, toggleListening } = useVoiceInput({
    onTranscriptChange: (text) => {
      setInputText((prev) => {
        // Append voice text cleanly
        return prev ? `${prev} ${text}` : text;
      });
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // Handle Send
  const handleSend = () => {
    if ((!inputText.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage(inputText.trim(), attachments);
    setInputText('');
    setAttachments([]);
    setFileError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File "${file.name}" exceeds the 20MB limit.`);
        return;
      }

      // Check mime type or extension
      let mime = file.type;
      if (!mime) {
        if (file.name.endsWith('.md')) mime = 'text/markdown';
        else if (file.name.endsWith('.csv')) mime = 'text/csv';
        else if (file.name.endsWith('.json')) mime = 'application/json';
        else if (file.name.endsWith('.txt')) mime = 'text/plain';
      }

      if (!mime || (!SUPPORTED_MIME_TYPES[mime] && !mime.startsWith('image/'))) {
        setFileError(`Unsupported format for "${file.name}". Supported: PNG, JPEG, WebP, PDF, TXT, MD, CSV, JSON.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1] || '';

        const newAtt: Attachment = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          name: file.name,
          mimeType: mime,
          size: file.size,
          data: base64Data,
        };

        setAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const canSubmit = (inputText.trim().length > 0 || attachments.length > 0) && !isStreaming;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 md:px-4 pb-3">
      {/* File error notification */}
      {(fileError || voiceError) && (
        <div className="mb-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0 text-rose-400" />
            <span>{fileError || voiceError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setFileError(null);
            }}
            className="p-1 hover:text-white"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Attachment Preview Chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
          {attachments.map((att) => {
            const isImage = att.mimeType.startsWith('image/');
            return (
              <div
                key={att.id}
                className="relative flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-neutral-200"
              >
                {isImage ? (
                  <img
                    src={`data:${att.mimeType};base64,${att.data}`}
                    alt={att.name}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded object-cover"
                  />
                ) : (
                  <FileText size={14} className="text-indigo-400 shrink-0" />
                )}
                <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                  title="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-2xl bg-neutral-900/95 border border-neutral-800 focus-within:border-neutral-700 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-lg backdrop-blur-md">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening... Speak now...' : placeholder}
          rows={1}
          className="w-full pt-3.5 pb-2 px-4 bg-transparent text-neutral-100 placeholder-neutral-500 text-[14.5px] focus:outline-none resize-none min-h-[44px] max-h-[200px] leading-relaxed"
        />

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1">
            {/* File upload hidden input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,text/markdown,text/csv,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              title="Attach files (Images, PDF, TXT, CSV, JSON)"
            >
              <Paperclip size={17} />
            </button>

            {/* Voice Dictation */}
            {isSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'text-rose-400 bg-rose-500/10 animate-pulse'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
                title={isListening ? 'Stop voice dictation' : 'Start voice dictation'}
              >
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
            )}

            {/* Google Search Grounding Toggle */}
            <button
              type="button"
              onClick={onToggleSearch}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                enableSearch
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
              title="Toggle Google Search grounding"
            >
              <Globe size={14} className={enableSearch ? 'text-indigo-400' : ''} />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Send or Stop Button */}
          <div>
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors shadow-xs"
                title="Stop response generation"
              >
                <Square size={14} className="fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSubmit}
                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all shadow-xs ${
                  canSubmit
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95 shadow-indigo-600/20'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                }`}
                title="Send message (Enter)"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-center text-neutral-400 mt-2 select-none">
        Martins AI may make mistakes. Verify important factual and coding details.
      </div>
    </div>
  );
};
