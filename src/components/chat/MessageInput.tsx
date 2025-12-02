import React, { useState } from 'react';
import type { FormEvent } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form className="border-t border-slate-800 px-4 py-3" onSubmit={handleSubmit}>
      <div className="flex gap-3">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-50 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
        />
        <button
          type="submit"
          className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
          disabled={!text.trim()}
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
