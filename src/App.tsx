import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Conversation,
  Message,
  AssistantMode,
  Attachment,
  UserSettings,
  UserMemory,
  Artifact,
  GroundingSource,
} from './types';
import { StorageService } from './services/storage';
import { ApiService } from './services/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatComposer } from './components/ChatComposer';
import { EmptyState } from './components/EmptyState';
import { ArtifactWorkspace } from './components/ArtifactWorkspace';
import { SettingsModal } from './components/SettingsModal';
import { ImageGenModal } from './components/ImageGenModal';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';

export default function App() {
  // Persistence state
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [conversations, setConversations] = useState<Conversation[]>(StorageService.getConversations());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [memories, setMemories] = useState<UserMemory[]>(StorageService.getMemories());

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImageGenOpen, setIsImageGenOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);

  // Chat execution state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [enableSearch, setEnableSearch] = useState(settings.enableSearchGrounding);
  const [currentMode, setCurrentMode] = useState<AssistantMode>(settings.defaultMode);

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  // Speech synthesis hook
  const {
    speakingMessageId,
    isPaused: isSpeechPaused,
    speak: toggleSpeech,
    stop: stopSpeech,
  } = useSpeechSynthesis();

  // Load initial active conversation or create one
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
      setCurrentMode(conversations[0].mode || 'general');
    }
  }, [conversations, activeConversationId]);

  // Sync theme
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.body.className =
        'bg-neutral-100 text-neutral-900 font-sans antialiased overflow-x-hidden';
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.className =
        'bg-neutral-950 text-neutral-100 font-sans antialiased overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200';
    }
  }, [settings.theme]);

  // Get active conversation
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  // Auto-scroll logic
  const scrollToBottom = useCallback((force = false) => {
    if (!chatScrollRef.current) return;
    if (force || !isUserScrolledUp.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, []);

  const handleScroll = () => {
    if (!chatScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
    isUserScrolledUp.current = distanceToBottom > 80;
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, streamingContent, scrollToBottom]);

  // Create new conversation
  const handleNewConversation = () => {
    stopSpeech();
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }

    const newConv: Conversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mode: currentMode,
      messages: [],
    };

    const updated = [newConv, ...conversations];
    setConversations(updated);
    StorageService.saveConversations(updated);
    setActiveConversationId(newConv.id);
  };

  // Switch conversation
  const handleSelectConversation = (id: string) => {
    stopSpeech();
    setActiveConversationId(id);
    const target = conversations.find((c) => c.id === id);
    if (target?.mode) {
      setCurrentMode(target.mode);
    }
  };

  // Mode change
  const handleSelectMode = (mode: AssistantMode) => {
    setCurrentMode(mode);
    if (activeConversation) {
      const updated = conversations.map((c) =>
        c.id === activeConversation.id ? { ...c, mode, updatedAt: Date.now() } : c
      );
      setConversations(updated);
      StorageService.saveConversations(updated);
    }
  };

  // Send message
  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if ((!text.trim() && attachments.length === 0) || isStreaming) return;

    let targetConv = activeConversation;
    let currentConvList = conversations;

    // If no conversation exists yet, create one
    if (!targetConv) {
      targetConv = {
        id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        mode: currentMode,
        messages: [],
      };
      currentConvList = [targetConv, ...conversations];
      setActiveConversationId(targetConv.id);
    }

    const userMessage: Message = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: text,
      attachments,
      timestamp: Date.now(),
      mode: currentMode,
    };

    const updatedMessages = [...targetConv.messages, userMessage];
    const isFirstMessage = targetConv.messages.length === 0;

    const updatedConv: Conversation = {
      ...targetConv,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    const updatedList = currentConvList.map((c) => (c.id === targetConv!.id ? updatedConv : c));
    setConversations(updatedList);
    StorageService.saveConversations(updatedList);

    // Title generation on first message
    if (isFirstMessage && text) {
      ApiService.generateTitle(text).then((generatedTitle) => {
        setConversations((prev) => {
          const list = prev.map((c) =>
            c.id === targetConv!.id ? { ...c, title: generatedTitle } : c
          );
          StorageService.saveConversations(list);
          return list;
        });
      });
    }

    // Prepare streaming
    setIsStreaming(true);
    setStreamingContent('');
    isUserScrolledUp.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Build memory string if enabled
    let memoryContext = '';
    if (settings.enableMemory && memories.length > 0) {
      memoryContext = memories.map((m) => `- ${m.text}`).join('\n');
    }
    if (settings.customInstructions) {
      memoryContext += `\nPersonal Instructions:\n${settings.customInstructions}`;
    }

    let accumulatedText = '';
    let collectedSources: GroundingSource[] = [];

    try {
      await ApiService.streamChat({
        messages: targetConv.messages,
        message: text,
        attachments,
        mode: currentMode,
        customInstructions: memoryContext,
        enableSearch: enableSearch || currentMode === 'research',
        signal: controller.signal,
        onChunk: (chunk) => {
          accumulatedText += chunk;
          setStreamingContent((prev) => prev + chunk);
        },
        onGrounding: (sources) => {
          collectedSources = sources;
        },
      });

      // Stream completed successfully
      const assistantMessage: Message = {
        id: 'msg_asst_' + Date.now(),
        role: 'assistant',
        content: accumulatedText || 'Response completed.',
        timestamp: Date.now(),
        groundingSources: collectedSources,
        mode: currentMode,
      };

      setConversations((prev) => {
        const list = prev.map((c) => {
          if (c.id === targetConv!.id) {
            return {
              ...c,
              messages: [...c.messages, assistantMessage],
              updatedAt: Date.now(),
            };
          }
          return c;
        });
        StorageService.saveConversations(list);
        return list;
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Interrupted by user stop
        if (accumulatedText) {
          const partialMessage: Message = {
            id: 'msg_asst_' + Date.now(),
            role: 'assistant',
            content: accumulatedText + '\n\n*(Generation stopped by user)*',
            timestamp: Date.now(),
            mode: currentMode,
          };
          setConversations((prev) => {
            const list = prev.map((c) =>
              c.id === targetConv!.id
                ? { ...c, messages: [...c.messages, partialMessage], updatedAt: Date.now() }
                : c
            );
            StorageService.saveConversations(list);
            return list;
          });
        }
      } else {
        console.error('Chat error:', err);
        const errorMessage: Message = {
          id: 'msg_asst_err_' + Date.now(),
          role: 'assistant',
          content: `⚠️ **Notice**: ${err.message || 'Unable to connect to AI server. Please verify network and server status.'}`,
          timestamp: Date.now(),
          error: true,
          mode: currentMode,
        };
        setConversations((prev) => {
          const list = prev.map((c) =>
            c.id === targetConv!.id
              ? { ...c, messages: [...c.messages, errorMessage], updatedAt: Date.now() }
              : c
          );
          StorageService.saveConversations(list);
          return list;
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Regenerate assistant response
  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length === 0 || isStreaming) return;
    const messages = [...activeConversation.messages];
    // Find last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const userMsg = messages[lastUserIndex];
    // Slice messages up to the user message
    const trimmed = messages.slice(0, lastUserIndex);
    const updatedConv = { ...activeConversation, messages: trimmed };
    const updatedList = conversations.map((c) => (c.id === updatedConv.id ? updatedConv : c));
    setConversations(updatedList);
    StorageService.saveConversations(updatedList);

    // Re-send user prompt
    handleSendMessage(userMsg.content, userMsg.attachments || []);
  };

  // Edit and resend user message
  const handleEditAndResend = (newContent: string) => {
    handleSendMessage(newContent, []);
  };

  // Feedback
  const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    if (!activeConversation) return;
    const updatedMessages = activeConversation.messages.map((m) =>
      m.id === messageId ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m
    );
    const updatedConv = { ...activeConversation, messages: updatedMessages };
    const updatedList = conversations.map((c) => (c.id === updatedConv.id ? updatedConv : c));
    setConversations(updatedList);
    StorageService.saveConversations(updatedList);
  };

  // Rename
  const handleRename = (id: string, newTitle: string) => {
    StorageService.renameConversation(id, newTitle);
    setConversations(StorageService.getConversations());
  };

  // Delete single
  const handleDelete = (id: string) => {
    StorageService.deleteConversation(id);
    const list = StorageService.getConversations();
    setConversations(list);
    if (activeConversationId === id) {
      setActiveConversationId(list.length > 0 ? list[0].id : null);
    }
  };

  // Toggle Pin
  const handleTogglePin = (id: string) => {
    StorageService.togglePin(id);
    setConversations(StorageService.getConversations());
  };

  // Toggle Archive
  const handleToggleArchive = (id: string) => {
    StorageService.toggleArchive(id);
    setConversations(StorageService.getConversations());
  };

  // Export
  const handleExport = (conv: Conversation, format: 'markdown' | 'json') => {
    const text =
      format === 'markdown'
        ? StorageService.exportConversationMarkdown(conv)
        : StorageService.exportConversationJSON(conv);
    const blob = new Blob([text], {
      type: format === 'markdown' ? 'text/markdown' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${format === 'markdown' ? 'md' : 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear all
  const handleClearAll = () => {
    StorageService.deleteAllConversations();
    setConversations([]);
    setActiveConversationId(null);
  };

  // Memory management
  const handleAddMemory = (text: string) => {
    const newMem = StorageService.addMemory(text);
    setMemories([newMem, ...memories]);
  };

  const handleDeleteMemory = (id: string) => {
    StorageService.deleteMemory(id);
    setMemories(memories.filter((m) => m.id !== id));
  };

  const handleClearMemories = () => {
    StorageService.clearAllMemories();
    setMemories([]);
  };

  // Settings saving
  const handleSaveSettings = (newSettings: UserSettings) => {
    StorageService.saveSettings(newSettings);
    setSettings(newSettings);
    setEnableSearch(newSettings.enableSearchGrounding);
  };

  // Artifact workspace
  const handleOpenArtifact = (code: string, language: string, title?: string) => {
    const art: Artifact = {
      id: 'art_' + Date.now(),
      title: title || `${language.toUpperCase()} Snippet`,
      language,
      content: code,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setActiveArtifact(art);
    setIsWorkspaceOpen(true);
    StorageService.saveArtifact(art);
  };

  return (
    <div
      className={`flex h-screen w-full overflow-hidden ${
        settings.theme === 'light'
          ? 'bg-neutral-100 text-neutral-900'
          : 'bg-neutral-950 text-neutral-100'
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRename}
        onDeleteConversation={handleDelete}
        onTogglePin={handleTogglePin}
        onToggleArchive={handleToggleArchive}
        onExportConversation={handleExport}
        onClearAll={handleClearAll}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat & Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeMode={currentMode}
          onSelectMode={handleSelectMode}
          onOpenWorkspace={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
          isWorkspaceOpen={isWorkspaceOpen}
          onOpenImageGen={() => setIsImageGenOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          chatTitle={activeConversation?.title || ''}
        />

        {/* Workspace + Message split container */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Messages Column */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <div
              ref={chatScrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
            >
              {!activeConversation || activeConversation.messages.length === 0 ? (
                <EmptyState
                  currentMode={currentMode}
                  onSelectPrompt={(p) => handleSendMessage(p, [])}
                  onSelectMode={handleSelectMode}
                />
              ) : (
                <div className="flex flex-col py-2">
                  {activeConversation.messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      onRegenerate={handleRegenerate}
                      onEditAndResend={handleEditAndResend}
                      onFeedback={handleFeedback}
                      onOpenArtifact={handleOpenArtifact}
                      isSpeaking={speakingMessageId === msg.id}
                      isPaused={isSpeechPaused}
                      onToggleSpeech={toggleSpeech}
                    />
                  ))}

                  {/* Streaming In-Progress Assistant Bubble */}
                  {isStreaming && streamingContent && (
                    <ChatMessage
                      message={{
                        id: 'streaming_temp',
                        role: 'assistant',
                        content: streamingContent,
                        timestamp: Date.now(),
                        mode: currentMode,
                      }}
                      isStreaming={true}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Bottom Composer */}
            <ChatComposer
              onSendMessage={handleSendMessage}
              onStopGeneration={handleStopGeneration}
              isStreaming={isStreaming}
              enableSearch={enableSearch}
              onToggleSearch={() => setEnableSearch(!enableSearch)}
              placeholder={`Ask Martins AI (${currentMode} mode)...`}
            />
          </div>

          {/* Right Artifact Canvas Workspace */}
          {isWorkspaceOpen && (
            <ArtifactWorkspace
              artifact={
                activeArtifact || {
                  id: 'draft',
                  title: 'Draft Workspace',
                  language: 'javascript',
                  content: '// Martins AI Workspace Canvas\n// Write or test code, markdown, or HTML here.\n',
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                }
              }
              onUpdateArtifact={(art) => {
                setActiveArtifact(art);
                StorageService.saveArtifact(art);
              }}
              onClose={() => setIsWorkspaceOpen(false)}
              onAskImprovement={(inst) => {
                handleSendMessage(inst, []);
              }}
            />
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearMemories={handleClearMemories}
      />

      {/* Image Gen Modal */}
      <ImageGenModal
        isOpen={isImageGenOpen}
        onClose={() => setIsImageGenOpen(false)}
        onAttachImageToChat={(attachment) => {
          handleSendMessage('', [attachment]);
        }}
      />
    </div>
  );
}
