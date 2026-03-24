import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [networkType, setNetworkType] = useState('unknown');
  const [isConnected, setIsConnected] = useState(true);
  const [isMetered, setIsMetered] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setIsMetered(state.isConnectionMetered);
      
      // Detect connection type
      if (state.type === 'wifi') {
        setNetworkType('wifi');
      } else if (state.type === 'cellular') {
        setNetworkType('mobile');
      } else if (state.type === 'ethernet') {
        setNetworkType('wired');
      } else {
        setNetworkType('unknown');
      }
    });

    return () => unsubscribe();
  }, []);

  return { networkType, isConnected, isMetered };
};