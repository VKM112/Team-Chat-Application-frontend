import React, { useEffect, useState } from 'react';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string | null;
  activeChannelCreatorId: string | null;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}

const USER_COLORS = [
  '#4ade80',
  '#38bdf8',
  '#f472b6',
  '#a855f7',
  '#fb923c',
  '#14b8a6',
  '#e11d48'
];

const getUserColor = (seed: string) => {
  const normalized = seed ?? 'unknown';
  // simple hash to keep color consistent per user
  const hash = Array.from(normalized).reduce((total, char) => total + char.charCodeAt(0), 0);
  return USER_COLORS[hash % USER_COLORS.length];
};

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  activeChannelCreatorId,
  onEdit,
  onDelete
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      if (target.closest('[data-message-menu]') || target.closest('[data-menu-button]')) {
        return;
      }
      setOpenMenuId(null);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingText(message.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSave = () => {
    if (!editingMessageId) return;
    const trimmed = editingText.trim();
    if (!trimmed) return;
    onEdit(editingMessageId, trimmed);
    cancelEditing();
  };

  const formatTime = (value?: string) => {
    const date = value ? new Date(value) : new Date();
    return date.toLocaleTimeString();
  };

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
      {messages.length === 0 ? (
        <p className="text-center text-xs uppercase tracking-wide text-slate-500">
          No messages yet
        </p>
      ) : (
        messages.map((message) => {
          const accentColor = getUserColor(message.sender.id);
          const isEditing = editingMessageId === message.id;
          const canEdit = message.sender.id === currentUserId;
          const canDelete =
            canEdit || activeChannelCreatorId === currentUserId;

          return (
          <div
            key={message.id}
            className="relative rounded-2xl border bg-slate-900 px-4 py-3 text-sm shadow-sm transition"
            style={{
              borderColor: accentColor,
              boxShadow: `0 0 0 1px ${accentColor}22`
            }}
          >
            <div className="flex items-start justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="font-semibold text-slate-100">
                  {message.sender.username}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide">
                <span>{formatTime(message.timestamp)}</span>
                {message.editedAt && (
                  <span className="text-slate-500">• edited</span>
                )}
                {(canEdit || canDelete) && (
                  <button
                    type="button"
                    data-menu-button
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId((prev) =>
                        prev === message.id ? null : message.id
                      );
                    }}
                    className="ml-2 rounded-full px-1 text-slate-400 transition hover:text-white"
                    aria-haspopup="true"
                    aria-expanded={openMenuId === message.id}
                  >
                    <span className="text-[18px] leading-none">⋮</span>
                  </button>
                )}
              </div>
            </div>
            {isEditing ? (
              <div className="mt-3 space-y-2">
                  <textarea
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    rows={3}
                    placeholder="Update your message..."
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!editingText.trim()}
                      className="rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 transition hover:border-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-slate-200">{message.content}</p>
              )}
              {!isEditing && (canEdit || canDelete) && (
                <div
                  data-message-menu
                  className={`absolute right-3 top-8 w-32 rounded-2xl border border-slate-800 bg-slate-900 p-2 text-xs uppercase tracking-wide text-slate-200 shadow-xl transition ${
                    openMenuId === message.id ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        startEditing(message);
                        setOpenMenuId(null);
                      }}
                      className="block w-full rounded-xl px-2 py-1 text-left transition hover:bg-slate-800"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(message.id);
                        setOpenMenuId(null);
                      }}
                      className="mt-1 block w-full rounded-xl px-2 py-1 text-left text-rose-200 transition hover:bg-slate-800"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default MessageList;
