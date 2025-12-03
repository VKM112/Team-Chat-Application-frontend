import { io, Socket } from 'socket.io-client';

const SERVER_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 
  import.meta.env.VITE_API_SERVER || 
  `http://localhost:${import.meta.env.VITE_API_PORT ?? '5002'}`;

export const createSocket = (token?: string): Socket => {
  return io(SERVER_URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });
};
