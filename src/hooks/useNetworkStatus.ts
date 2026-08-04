import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // In React Native / Expo Go, check connectivity via fetch or NetInfo
    const checkConnection = async () => {
      try {
        const response = await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          cache: 'no-cache',
        });
        setIsOnline(response.status === 204 || response.ok);
      } catch (e) {
        setIsOnline(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  return { isOnline };
};
