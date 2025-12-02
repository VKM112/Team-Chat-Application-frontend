import React from 'react';
import type { User } from '../../types';

interface OnlineUsersProps {
  users: User[];
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ users }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Team</h2>
      {users.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">No members yet. Invite the team!</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between text-sm text-slate-100">
              <div>
                <p className="font-semibold">{user.username}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <span
                className={`h-3 w-3 rounded-full ${
                  user.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                }`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OnlineUsers;
