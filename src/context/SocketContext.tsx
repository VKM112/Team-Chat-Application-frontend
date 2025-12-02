import React, { createContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { createSocket } from '../services/socket';

export const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    if (!accessToken) {
      setSocket(null);
      return;
    }

    const newSocket = createSocket(accessToken);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [accessToken]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
