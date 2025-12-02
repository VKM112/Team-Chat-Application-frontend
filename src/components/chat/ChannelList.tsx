import React from 'react';
import type { Channel } from '../../types';

interface ChannelListProps {
  channels: Channel[];
  activeChannelId: string;
  onSelect: (channel: Channel) => void;
}

const ChannelList: React.FC<ChannelListProps> = ({ channels, activeChannelId, onSelect }) => {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Channels</h2>
      <ul className="space-y-2">
        {channels.map((channel) => (
          <li key={channel.id}>
            <button
              type="button"
              onClick={() => onSelect(channel)}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                channel.id === activeChannelId
                  ? 'bg-emerald-400/20 text-emerald-300'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <div className="font-semibold text-slate-100">{channel.name}</div>
              <p className="text-xs text-slate-500">{channel.description}</p>
              <p className="text-[11px] uppercase tracking-wider text-slate-500">
                {channel.members?.length ?? 0} member{channel.members?.length === 1 ? '' : 's'}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChannelList;
