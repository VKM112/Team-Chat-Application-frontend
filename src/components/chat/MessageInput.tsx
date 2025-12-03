import React, { useState } from 'react';
import type { FormEvent } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  disabledMessage?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  disabledMessage
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (disabled || !text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form className="border-t border-slate-800 px-4 py-3" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-3">
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a message..."
            disabled={disabled}
            className="flex-1 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-50 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 disabled:border-slate-700 disabled:bg-slate-950 disabled:text-slate-500"
          />
          <button
            type="submit"
            className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
            disabled={disabled || !text.trim()}
          >
            Send
          </button>
        </div>
        {disabled && disabledMessage && (
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            {disabledMessage}
          </p>
        )}
      </div>
    </form>
  );
};

export default MessageInput;
