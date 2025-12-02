import React from 'react';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
      {messages.length === 0 ? (
        <p className="text-center text-xs uppercase tracking-wide text-slate-500">
          No messages yet
        </p>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className="rounded-2xl border border-slate-800/80 bg-slate-900 px-4 py-3 text-sm shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-100">{message.sender.username}</span>
              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="mt-1 text-slate-200">{message.content}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default MessageList;
