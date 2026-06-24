export interface User {
  id: string;
  socketId: string;
  displayName: string;
  isHost: boolean;
  joinedAt: number;
}

export interface RoomState {
  id: string;
  users: User[];
  hostId: string;
  screenShare?: {
    active: boolean;
    sharerId: string | null;
    sharerName: string | null;
  };
}
