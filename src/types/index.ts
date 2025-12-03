export interface User {
  id: string;
  email: string;
  username: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  isPrivate?: boolean;
  members?: User[];
  createdBy?: User;
}

export interface Message {
  id: string;
  channelId: string;
  sender: {
    id: string;
    username: string;
  };
  content: string;
  timestamp: string;
  editedAt?: string | null;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}
