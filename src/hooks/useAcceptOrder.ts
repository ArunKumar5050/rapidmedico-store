import { useState } from 'react';
import { FirestoreService } from '../services/firebase/firestore';
import { useNetworkStatus } from './useNetworkStatus';
import { useAuthStore } from '../store/useAuthStore';
import { Alert } from 'react-native';

export const useAcceptOrder = () => {
  const [loading, setLoading] = useState(false);
  const { isOnline } = useNetworkStatus();
  const { storeId } = useAuthStore();

  const acceptOrder = async (orderId: string, collectionName: string = 'customOrders'): Promise<boolean> => {
    if (!isOnline) {
      Alert.alert(
        'Offline Error',
        'Cannot accept order while offline. Missed or delayed orders affect pharmacy rating. Re-connect to network and retry.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (!storeId) return false;

    setLoading(true);
    try {
      await FirestoreService.acceptOrder(storeId, orderId, collectionName);
      setLoading(false);
      return true;
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Action Failed', error.message || 'High priority alert: Unable to accept order. Please check network connection.');
      return false;
    }
  };

  return { acceptOrder, loading };
};
