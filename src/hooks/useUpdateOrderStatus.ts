import { useState } from 'react';
import { FirestoreService } from '../services/firebase/firestore';
import { useNetworkStatus } from './useNetworkStatus';
import { OrderStatus } from '../types/enums';
import { Alert } from 'react-native';

export const useUpdateOrderStatus = () => {
  const [loading, setLoading] = useState(false);
  const { isOnline } = useNetworkStatus();

  const updateStatus = async (orderId: string, nextStatus: OrderStatus, collectionName: string = 'customOrders'): Promise<boolean> => {
    if (!isOnline) {
      Alert.alert('Offline Error', 'Network connection required to update order status.');
      return false;
    }

    setLoading(true);
    try {
      await FirestoreService.updateOrderStatus(orderId, nextStatus, collectionName);
      setLoading(false);
      return true;
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Update Failed', error.message || 'Unable to update order status.');
      return false;
    }
  };

  return { updateStatus, loading };
};
