import React, { useState } from 'react';
import { Message, Attachment } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Volume1,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Sparkles,
  User,
  FileText,
  ExternalLink,
  Code2,
} from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEditAndResend?: (newContent: string) => void;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
  onOpenArtifact?: (code: string, language: string, title?: string) => void;
  isSpeaking?: boolean;
  isPaused?: boolean;
  onToggleSpeech?: (messageId: string, text: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
  onEditAndResend,
  onFeedback,
  onOpenArtifact,
  isSpeaking = false,
  isPaused = false,
  onToggleSpeech,
}) => {
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEditAndResend) {
      onEditAndResend(editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`group w-full py-5 px-4 md:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-neutral-900/35 border-y border-neutral-900/60'
      }`}
    >
      <div className="max-w-3xl mx-auto flex items-start gap-3.5 md:gap-4.5">
        {/* Avatar */}
        <div
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-medium text-xs select-none shadow-xs ${
            isUser
              ? 'bg-neutral-800 text-neutral-300 border border-neutral-700/60'
              : 'bg-indigo-600/90 text-white shadow-indigo-500/20 shadow-md'
          }`}
        >
          {isUser ? <User size={16} /> : <Sparkles size={16} />}
        </div>

        {/* Message Content Body */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Header info */}
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-200">
                {isUser ? 'You' : 'Martins AI'}
              </span>
              <span className="text-[11px] text-neutral-400">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {message.mode && !isUser && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/50">
                  {message.mode}
                </span>
              )}
            </div>

            {/* User message edit button */}
            {isUser && !isEditing && onEditAndResend && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-opacity"
                title="Edit message"
              >
                <Pencil size={13} />
              </button>
            )}
          </div>

          {/* Attachments preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {message.attachments.map((att: Attachment) => {
                const isImage = att.mimeType.startsWith('image/');
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-800/80 border border-neutral-700/60 text-xs text-neutral-200"
                  >
                    {isImage ? (
                      <img
                        src={`data:${att.mimeType};base64,${att.data}`}
                        alt={att.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded object-cover border border-neutral-700"
                      />
                    ) : (
                      <FileText size={16} className="text-indigo-400" />
                    )}
                    <span className="truncate max-w-[140px] font-medium">{att.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Text/Content or Edit Box */}
          {isEditing ? (
            <div className="space-y-2 pt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans resize-y min-h-[90px]"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                >
                  Save & Resend
                </button>
              </div>
            </div>
          ) : (
            <div className="text-neutral-100 text-[14.5px] leading-relaxed">
              {isUser ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <MarkdownRenderer
                  content={message.content}
                  onOpenArtifact={onOpenArtifact}
                />
              )}

              {/* Streaming Indicator */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Research grounding citations */}
          {message.groundingSources && message.groundingSources.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-neutral-800/80">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <ExternalLink size={12} />
                <span>Web Grounding Sources</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.groundingSources.map((src, sIdx) => (
                  <a
                    key={sIdx}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800/70 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 text-xs transition-colors max-w-full truncate"
                  >
                    <span className="truncate max-w-[220px]">{src.title || src.uri}</span>
                    <ExternalLink size={11} className="shrink-0 text-neutral-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Assistant Action Bar */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-1 pt-1.5 text-neutral-400 text-xs opacity-70 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              {/* Copy */}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
                title="Copy response"
              >
                {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>

              {/* Read Aloud */}
              {onToggleSpeech && (
                <button
                  type="button"
                  onClick={() => onToggleSpeech(message.id, message.content)}
                  className={`p-1.5 rounded hover:bg-neutral-800 transition-colors ${
                    isSpeaking ? 'text-indigo-400 bg-neutral-800' : 'hover:text-neutral-200'
                  }`}
                  title={
                    isSpeaking
                      ? isPaused
                        ? 'Resume reading'
                        : 'Pause reading'
                      : 'Read aloud'
                  }
                >
                  {isSpeaking ? (
                    isPaused ? (
                      <Volume1 size={14} />
                    ) : (
                      <Volume2 size={14} className="animate-pulse" />
                    )
                  ) : (
                    <Volume2 size={14} />
                  )}
                </button>
              )}

              {/* Regenerate */}
              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="p-1.5 rounded hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw size={14} />
                </button>
              )}

              {/* Feedback Like */}
              {onFeedback && (
                <>
                  <button
                    type="button"
                    onClick={() => onFeedback(message.id, 'like')}
                    className={`p-1.5 rounded hover:bg-neutral-800 transition-colors ${
                      message.feedback === 'like'
                        ? 'text-emerald-400 bg-neutral-800'
                        : 'hover:text-neutral-200'
                    }`}
                    title="Helpful response"
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onFeedback(message.id, 'dislike')}
                    className={`p-1.5 rounded hover:bg-neutral-800 transition-colors ${
                      message.feedback === 'dislike'
                        ? 'text-rose-400 bg-neutral-800'
                        : 'hover:text-neutral-200'
                    }`}
                    title="Needs improvement"
                  >
                    <ThumbsDown size={14} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
