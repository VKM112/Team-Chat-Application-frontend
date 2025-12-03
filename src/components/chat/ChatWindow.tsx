import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import type { FormEvent } from 'react';
import ChannelList from './ChannelList';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import OnlineUsers from './OnlineUsers';
import type { Channel, Message, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import type { AxiosError } from 'axios';

const mapUser = (userDoc: any): User => ({
  id: (userDoc._id ?? userDoc.id)?.toString?.() ?? '',
  username: userDoc.username ?? 'Unknown',
  email:
    userDoc.email ??
    `${userDoc.username?.toLowerCase() ?? 'user'}@example.com`,
  isOnline: userDoc.isOnline ?? false,
  lastSeen: userDoc.lastSeen ? new Date(userDoc.lastSeen).toISOString() : undefined
});

const mapChannel = (channelDoc: any): Channel => ({
  id: (channelDoc._id ?? channelDoc.id)?.toString?.() ?? '',
  name: channelDoc.name,
  description: channelDoc.description,
  isPrivate: channelDoc.isPrivate,
  members: channelDoc.members?.map((member: any) => mapUser(member)),
  createdBy: channelDoc.createdBy ? mapUser(channelDoc.createdBy) : undefined
});

const mapMessage = (messageDoc: any): Message => ({
  id: (messageDoc._id ?? messageDoc.id)?.toString?.() ?? crypto.randomUUID(),
  channelId:
    (messageDoc.channel?._id ??
      messageDoc.channelId ??
      messageDoc.channel)
      ?.toString?.() ??
    '',
  sender: {
    id: messageDoc.sender?._id ?? messageDoc.sender?.id ?? '',
    username: messageDoc.sender?.username ?? 'Unknown'
  },
  content: messageDoc.content,
  timestamp: messageDoc.timestamp ?? new Date().toISOString(),
  editedAt: messageDoc.editedAt
    ? new Date(messageDoc.editedAt).toISOString()
    : null
});

const ChatWindow: React.FC = () => {
  const { user, logout, accessToken, refreshAccessToken } = useAuth();
  const socket = useSocket();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [channelStatus, setChannelStatus] = useState<string | null>(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isChannelActionLoading, setIsChannelActionLoading] = useState(false);
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, Message[]>>({});

  const withAuthRetry = useCallback(
    async function withAuthRetryImpl<T>(fn: () => Promise<T>, retry = true): Promise<T> {
      try {
        return await fn();
      } catch (error) {
        const axiosError = error as AxiosError;
        if (
          retry &&
          axiosError.response?.status === 401 &&
          refreshAccessToken
        ) {
          try {
            await refreshAccessToken();
            return withAuthRetryImpl(fn, false);
          } catch (refreshError) {
            logout();
            throw refreshError;
          }
        }
        throw error;
      }
    },
    [logout, refreshAccessToken]
  );

  const fetchChannels = useCallback(async () => {
    try {
      const { data } = await withAuthRetry(() => api.get('/channels'));
      const mapped = data.map(mapChannel);
      setChannels(mapped);
      if (!activeChannelId && mapped.length > 0) {
        setActiveChannelId(mapped[0].id);
      }
    } catch (error) {
      console.error('fetchChannels error', error);
      setChannelError('Unable to load channels');
    }
  }, [activeChannelId, withAuthRetry]);

  const fetchMessages = useCallback(
    async (channelId: string) => {
      try {
        const { data } = await withAuthRetry(() =>
          api.get(`/messages/${channelId}`)
        );
        const mapped = (data.messages ?? []).map(mapMessage);
        setMessagesByChannel((prev) => ({ ...prev, [channelId]: mapped }));
      } catch (error) {
        console.error('fetchMessages failed', error);
        setChannelError('Unable to load messages');
      }
    },
    [withAuthRetry]
  );

  useEffect(() => {
    if (!accessToken) return;
    fetchChannels();
  }, [accessToken, fetchChannels]);

  useEffect(() => {
    if (activeChannelId) {
      fetchMessages(activeChannelId);
    }
  }, [activeChannelId, fetchMessages]);

  useEffect(() => {
    if (!socket || !activeChannelId) return undefined;
    socket.emit('channel:join', activeChannelId);
    return () => {
      socket.emit('channel:leave', activeChannelId);
    };
  }, [socket, activeChannelId]);

  const activeChannel = useMemo(
    () => channels.find((channel) => channel.id === activeChannelId) ?? null,
    [channels, activeChannelId]
  );

  const activeMessages = useMemo(
    () => (activeChannelId ? messagesByChannel[activeChannelId] ?? [] : []),
    [activeChannelId, messagesByChannel]
  );

  const isMember = useMemo(
    () =>
      Boolean(
        user &&
          activeChannel?.members?.some((member) => member.id === user.id)
      ),
    [activeChannel, user]
  );

  const isChannelCreator = useMemo(
    () => Boolean(user && activeChannel?.createdBy?.id === user.id),
    [activeChannel, user]
  );

  const handleCreateChannel = async (event: FormEvent) => {
    event.preventDefault();
    if (!newChannelName.trim()) {
      setChannelError('Channel name is required');
      return;
    }
    setIsCreatingChannel(true);
    setChannelError(null);
    try {
      const { data } = await withAuthRetry(() =>
        api.post('/channels', {
          name: newChannelName.trim(),
          description: newChannelDescription.trim()
        })
      );
      const mapped = mapChannel(data);
      setChannels((prev) => [mapped, ...prev]);
      setActiveChannelId(mapped.id);
      setChannelStatus(`Channel "${mapped.name}" created`);
      setNewChannelName('');
      setNewChannelDescription('');
    } catch (error) {
      setChannelError('Unable to create channel with that name');
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleJoinChannel = async () => {
    if (!activeChannel) return;
    setIsChannelActionLoading(true);
    setChannelError(null);
    try {
      await withAuthRetry(() => api.post(`/channels/${activeChannel.id}/join`));
      await fetchChannels();
      setChannelStatus(`Joined #${activeChannel.name}`);
    } catch (error) {
      setChannelError('Unable to join channel');
    } finally {
      setIsChannelActionLoading(false);
    }
  };

  const handleLeaveChannel = async () => {
    if (!activeChannel || !user) return;
    setIsChannelActionLoading(true);
    setChannelError(null);
    try {
      await withAuthRetry(() => api.post(`/channels/${activeChannel.id}/leave`));
      await fetchChannels();
      setChannelStatus(`Left #${activeChannel.name}`);
    } catch (error) {
      setChannelError('Unable to leave channel');
    } finally {
      setIsChannelActionLoading(false);
    }
  };

  const handleSendMessage = (content: string) => {
    if (!isMember) {
      setChannelError('Join the channel to send messages');
      return;
    }
    if (!socket || !activeChannelId) return;
    setChannelError(null);
    socket.emit('message:send', {
      channelId: activeChannelId,
      content
    });
  };

  const handleDeleteChannel = async () => {
    if (!activeChannel) return;
    setIsChannelActionLoading(true);
    setChannelError(null);
    try {
      await withAuthRetry(() => api.delete(`/channels/${activeChannel.id}`));
      setChannelStatus(`Channel "${activeChannel.name}" deleted`);
      setChannels((prev) => {
        const updated = prev.filter((channel) => channel.id !== activeChannel.id);
        setActiveChannelId(updated[0]?.id ?? null);
        return updated;
      });
      setMessagesByChannel((prev) => {
        const next = { ...prev };
        delete next[activeChannel.id];
        return next;
      });
    } catch (error) {
      setChannelError('Unable to delete channel');
    } finally {
      setIsChannelActionLoading(false);
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    if (!socket) return;
    socket.emit('message:edit', { messageId, content });
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!socket) return;
    socket.emit('message:delete', { messageId });
  };

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message: any) => {
      const mapped = mapMessage(message);
      setMessagesByChannel((prev) => {
        const existing = prev[mapped.channelId] ?? [];
        return {
          ...prev,
          [mapped.channelId]: [...existing, mapped]
        };
      });
    };
    const handleUpdatedMessage = (message: any) => {
      const mapped = mapMessage(message);
      setMessagesByChannel((prev) => {
        const existing = prev[mapped.channelId] ?? [];
        return {
          ...prev,
          [mapped.channelId]: existing.map((msg) =>
            msg.id === mapped.id ? mapped : msg
          )
        };
      });
    };
    const handleDeletedMessage = (payload: any) => {
      if (!payload?.channelId) return;
      setMessagesByChannel((prev) => {
        const existing = prev[payload.channelId] ?? [];
        return {
          ...prev,
          [payload.channelId]: existing.filter(
            (message) => message.id !== payload.messageId
          )
        };
      });
    };
    socket.on('message:new', handleNewMessage);
    socket.on('message:updated', handleUpdatedMessage);
    socket.on('message:deleted', handleDeletedMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:updated', handleUpdatedMessage);
      socket.off('message:deleted', handleDeletedMessage);
    };
  }, [socket]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-900/80 bg-slate-900 px-6 py-4 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Workspace</p>
          <h1 className="text-xl font-semibold text-white">Mini Team Chat</h1>
        </div>
        <div className="flex items-center space-x-3">
          {user && (
            <div className="text-right text-sm">
              <div className="font-semibold text-slate-100">{user.username}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-emerald-300"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 px-4 py-6 md:grid-cols-12 md:px-6 md:py-8">
        <aside className="col-span-12 space-y-6 md:col-span-3">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900 p-5 shadow-lg">
            <ChannelList
              channels={channels}
              activeChannelId={activeChannelId ?? ''}
              onSelect={(channel) => setActiveChannelId(channel.id)}
            />
          </div>
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900 p-5 shadow-lg">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Create a channel
            </h2>
            <form className="mt-4 space-y-3" onSubmit={handleCreateChannel}>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-400">
                  Name
                </label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(event) => setNewChannelName(event.target.value)}
                  placeholder="Team standup"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-400">
                  Description
                </label>
                <input
                  type="text"
                  value={newChannelDescription}
                  onChange={(event) => setNewChannelDescription(event.target.value)}
                  placeholder="What will be discussed?"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCreatingChannel}
              >
                {isCreatingChannel ? 'Creating...' : 'Create channel'}
              </button>
            </form>
            <p className="mt-3 text-xs text-slate-500">Channel names must be unique.</p>
          </div>
        </aside>

        <main className="col-span-12 flex flex-col rounded-3xl border border-slate-800/80 bg-slate-900 shadow-lg md:col-span-6">
          <div className="border-b border-slate-800/70 px-4 py-3 text-sm text-slate-400">
            #{activeChannel?.name ?? 'None selected'} -{' '}
            {activeChannel?.description ??
              'Select or create a channel to view messages'}
          </div>

          <div className="px-4 pt-4">
            {channelError && (
              <div className="rounded-2xl bg-rose-500/30 px-4 py-2 text-xs text-rose-100">
                {channelError}
              </div>
            )}
            {channelStatus && (
              <div className="mt-2 rounded-2xl bg-emerald-500/20 px-4 py-2 text-xs text-emerald-100">
                {channelStatus}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-slate-500">
              <span>
                {activeChannel?.members?.length ?? 0} member
                {(activeChannel?.members?.length ?? 0) === 1 ? '' : 's'}
              </span>
              <span>|</span>
              <span>{activeChannel?.isPrivate ? 'Private' : 'Public'}</span>
              <span>|</span>
              <span>
                Created by{' '}
                {activeChannel?.members
                  ? activeChannel.members[0]?.username ??
                    activeChannel.members[0]?.email ??
                    'the team'
                  : 'the team'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {isMember ? (
                <button
                  type="button"
                  onClick={handleLeaveChannel}
                  disabled={isChannelActionLoading}
                  className="rounded-full border border-rose-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-200 transition hover:border-rose-300 disabled:opacity-50"
                >
                  {isChannelActionLoading ? 'Leaving...' : 'Leave'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleJoinChannel}
                  disabled={isChannelActionLoading || !activeChannel}
                  className="rounded-full border border-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-300 disabled:opacity-50"
                >
                  {isChannelActionLoading ? 'Joining...' : 'Join'}
                </button>
              )}
              {isChannelCreator && (
                <button
                  type="button"
                  onClick={handleDeleteChannel}
                  disabled={isChannelActionLoading}
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:border-rose-300 hover:text-white disabled:opacity-50"
                >
                  {isChannelActionLoading ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>

          <MessageList
            messages={activeMessages}
            currentUserId={user?.id ?? null}
            activeChannelCreatorId={activeChannel?.createdBy?.id ?? null}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
          />
          <MessageInput
            onSend={handleSendMessage}
            disabled={!isMember}
            disabledMessage={
              !activeChannel
                ? 'Select a channel to send messages'
                : 'Join the channel to send messages'
            }
          />
        </main>

        <aside className="col-span-12 md:col-span-3">
          <OnlineUsers users={activeChannel?.members ?? []} />
        </aside>
      </div>
    </div>
  );
};

export default ChatWindow;
