import React, { useState, useMemo } from 'react';
import { Conversation, AssistantMode } from '../types';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit2,
  Download,
  Check,
  X,
  MessageSquare,
  Sparkles,
  ChevronRight,
  PanelLeftClose,
  MoreVertical,
} from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onExportConversation: (conv: Conversation, format: 'markdown' | 'json') => void;
  onClearAll: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onTogglePin,
  onToggleArchive,
  onExportConversation,
  onClearAll,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (showArchived ? !c.isArchived : c.isArchived) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(q);
      const messageMatch = c.messages.some((m) => m.content.toLowerCase().includes(q));
      return titleMatch || messageMatch;
    });
  }, [conversations, showArchived, searchQuery]);

  // Group by date
  const { pinned, today, yesterday, previous7Days, older } = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    const pinnedList: Conversation[] = [];
    const todayList: Conversation[] = [];
    const yesterdayList: Conversation[] = [];
    const prev7List: Conversation[] = [];
    const olderList: Conversation[] = [];

    for (const c of filteredConversations) {
      if (c.isPinned && !showArchived) {
        pinnedList.push(c);
        continue;
      }

      const updated = c.updatedAt || c.createdAt;
      if (updated >= startOfToday) {
        todayList.push(c);
      } else if (updated >= startOfToday - oneDay) {
        yesterdayList.push(c);
      } else if (updated >= startOfToday - 7 * oneDay) {
        prev7List.push(c);
      } else {
        olderList.push(c);
      }
    }

    return {
      pinned: pinnedList,
      today: todayList,
      yesterday: yesterdayList,
      previous7Days: prev7List,
      older: olderList,
    };
  }, [filteredConversations, showArchived]);

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setActiveMenuId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const renderConversationItem = (conv: Conversation) => {
    const isActive = conv.id === activeId;
    const isEditing = conv.id === editingId;
    const isMenuOpen = conv.id === activeMenuId;

    return (
      <div
        key={conv.id}
        className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
          isActive
            ? 'bg-neutral-800 text-white font-medium'
            : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
        }`}
        onClick={() => {
          if (!isEditing) onSelectConversation(conv.id);
        }}
      >
        <MessageSquare size={14} className="shrink-0 text-neutral-400 group-hover:text-indigo-400" />

        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(conv.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              autoFocus
              className="w-full bg-neutral-900 px-1.5 py-0.5 rounded text-white border border-neutral-700 focus:outline-none focus:border-indigo-500 text-xs"
            />
            <button
              type="button"
              onClick={() => handleSaveRename(conv.id)}
              className="p-1 text-emerald-400 hover:text-emerald-300"
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="p-1 text-neutral-400 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <span className="truncate flex-1">{conv.title}</span>
        )}

        {/* Pin badge */}
        {conv.isPinned && !isEditing && (
          <Pin size={11} className="shrink-0 text-indigo-400 rotate-45" />
        )}

        {/* Options Menu Trigger */}
        {!isEditing && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveMenuId(isMenuOpen ? null : conv.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-opacity"
              title="Options"
            >
              <MoreVertical size={13} />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-neutral-900 border border-neutral-800 shadow-xl z-50 p-1 space-y-0.5 backdrop-blur-md"
                onMouseLeave={() => setActiveMenuId(null)}
              >
                <button
                  type="button"
                  onClick={() => handleStartRename(conv)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-neutral-300 hover:bg-neutral-800 hover:text-white text-xs"
                >
                  <Edit2 size={13} />
                  <span>Rename</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTogglePin(conv.id);
                    setActiveMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-neutral-300 hover:bg-neutral-800 hover:text-white text-xs"
                >
                  {conv.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
                  <span>{conv.isPinned ? 'Unpin' : 'Pin'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleArchive(conv.id);
                    setActiveMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-neutral-300 hover:bg-neutral-800 hover:text-white text-xs"
                >
                  {conv.isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                  <span>{conv.isArchived ? 'Restore' : 'Archive'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onExportConversation(conv, 'markdown');
                    setActiveMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-neutral-300 hover:bg-neutral-800 hover:text-white text-xs"
                >
                  <Download size={13} />
                  <span>Export Markdown</span>
                </button>

                <div className="h-px bg-neutral-800 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    onDeleteConversation(conv.id);
                    setActiveMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-neutral-950 border-r border-neutral-900 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header: Brand & New Chat */}
        <div className="p-3.5 border-b border-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white leading-none">
                Martins AI
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">
                Your AI. Your Ideas.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 md:hidden"
            title="Close sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Action button: New Chat */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onNewConversation();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus size={15} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800/80 text-neutral-200 placeholder-neutral-500 text-xs focus:outline-none focus:border-neutral-700"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-neutral-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List Scroll Area */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-400">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </div>
          ) : (
            <>
              {/* Pinned */}
              {pinned.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
                    Pinned
                  </div>
                  {pinned.map(renderConversationItem)}
                </div>
              )}

              {/* Today */}
              {today.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
                    Today
                  </div>
                  {today.map(renderConversationItem)}
                </div>
              )}

              {/* Yesterday */}
              {yesterday.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
                    Yesterday
                  </div>
                  {yesterday.map(renderConversationItem)}
                </div>
              )}

              {/* Previous 7 Days */}
              {previous7Days.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
                    Previous 7 Days
                  </div>
                  {previous7Days.map(renderConversationItem)}
                </div>
              )}

              {/* Older */}
              {older.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
                    Older
                  </div>
                  {older.map(renderConversationItem)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer controls: Archive toggle & Clear All */}
        <div className="p-3 border-t border-neutral-900 space-y-1 bg-neutral-950">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Archive size={14} />
              <span>{showArchived ? 'View Active Chats' : 'Archived Chats'}</span>
            </div>
            {showArchived && <span className="text-[10px] text-indigo-400 font-medium">Viewing</span>}
          </button>

          {conversations.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 size={14} />
              <span>Clear All Conversations</span>
            </button>
          )}
        </div>
      </aside>

      {/* Confirmation Modal for Clear All */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 size={20} />
              </div>
              <h3 className="text-sm font-semibold text-white">Delete All Conversations?</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This will permanently delete all saved conversations from local storage. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
