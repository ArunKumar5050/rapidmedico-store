import { useState } from 'react';
import { FunctionsService } from '../services/firebase/functions';
import { useNetworkStatus } from './useNetworkStatus';
import { RejectionReason } from '../types/enums';
import { Alert } from 'react-native';

export const useRejectOrder = () => {
  const [loading, setLoading] = useState(false);
  const { isOnline } = useNetworkStatus();

  const rejectOrder = async (
    orderId: string,
    rejectionReason: RejectionReason,
    rejectionNote?: string,
    collectionName: string = 'customOrders'
  ): Promise<boolean> => {
    if (!isOnline) {
      Alert.alert(
        'Offline Error',
        'Cannot reject order while offline. Network connection required to re-assign order to routing engine.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (rejectionReason === RejectionReason.Other && (!rejectionNote || rejectionNote.trim().length < 5)) {
      Alert.alert('Validation Error', 'A note of at least 5 characters is required when selecting "Other".');
      return false;
    }

    setLoading(true);
    try {
      const res = await FunctionsService.respondToOrder({
        orderId,
        action: 'REJECT',
        rejectionReason,
        rejectionNote,
        collectionName,
      });

      setLoading(false);
      if (res.success) {
        return true;
      } else {
        Alert.alert('Rejection Failed', res.message || 'Unable to submit rejection.');
        return false;
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Action Failed', error.message || 'Failed to submit rejection reason to routing engine.');
      return false;
    }
  };

  return { rejectOrder, loading };
};
