import { useCallback } from 'react';
import { useAuth } from './useAuth';

export const useRefreshToken = () => {
  const { refreshAccessToken } = useAuth();

  return useCallback(async () => {
    try {
      await refreshAccessToken();
    } catch (error) {
      console.error('Refresh token failed', error);
    }
  }, [refreshAccessToken]);
};
