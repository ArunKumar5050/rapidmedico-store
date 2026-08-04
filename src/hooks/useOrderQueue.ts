import { useEffect } from 'react';
import { FirestoreService } from '../services/firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { OrderStatus } from '../types/enums';

export const useOrderQueue = () => {
  const { storeId } = useAuthStore();
  const { activeOrders, completedOrders, setActiveOrders, setCompletedOrders, setActiveAlertOrder } = useOrderStore();

  useEffect(() => {
    if (!storeId) return;

    // Live subscription for assigned active orders
    const unsubscribeActive = FirestoreService.subscribeActiveOrders(storeId, (orders) => {
      setActiveOrders(orders);

      // Trigger Alert Modal if a NEW unhandled order is in queue
      const newOrder = orders.find((o) => o.status === OrderStatus.New);
      if (newOrder) {
        setActiveAlertOrder(newOrder);
      }
    });

    const unsubscribeHistory = FirestoreService.subscribeOrderHistory(storeId, (orders) => {
      setCompletedOrders(orders);
    });

    return () => {
      unsubscribeActive();
      unsubscribeHistory();
    };
  }, [storeId]);

  return { activeOrders, completedOrders };
};
