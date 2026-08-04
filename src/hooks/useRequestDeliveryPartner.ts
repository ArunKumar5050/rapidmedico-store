import { useState } from 'react';
import { FirestoreService } from '../services/firebase/firestore';
import { useNetworkStatus } from './useNetworkStatus';
import { OrderStatus } from '../types/enums';
import { Alert } from 'react-native';

export const useRequestDeliveryPartner = () => {
  const [loading, setLoading] = useState(false);
  const { isOnline } = useNetworkStatus();

  const requestPartner = async (orderId: string): Promise<{ success: boolean; etaMinutes?: number }> => {
    if (!isOnline) {
      Alert.alert('Offline Error', 'Network connection required to signal delivery partner request.');
      return { success: false };
    }

    setLoading(true);
    try {
      await FirestoreService.updateOrderStatus(orderId, OrderStatus.DeliveryRequested);
      setLoading(false);
      return { success: true, etaMinutes: 8 }; // Mocking ETA
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Delivery Request Failed', error.message || 'Unable to signal routing engine for delivery partner.');
      return { success: false };
    }
  };

  return { requestPartner, loading };
};
