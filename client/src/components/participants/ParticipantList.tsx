'use client';

import { useRoomStore } from '@/store/useRoomStore';
import ParticipantItem from './ParticipantItem';

export default function ParticipantList() {
  const users = useRoomStore((s) => s.users);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border-glass">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Participants ({users.length})
        </span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
        {users.map((user) => (
          <ParticipantItem key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
