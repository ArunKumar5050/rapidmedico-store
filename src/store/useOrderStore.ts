import { create } from 'zustand';
import { StoreOrder } from '../types/models';
import { OrderStatus } from '../types/enums';

interface OrderState {
  activeOrders: StoreOrder[];
  completedOrders: StoreOrder[];
  selectedOrder: StoreOrder | null;
  activeAlertOrder: StoreOrder | null;
  setActiveOrders: (orders: StoreOrder[]) => void;
  setCompletedOrders: (orders: StoreOrder[]) => void;
  setSelectedOrder: (order: StoreOrder | null) => void;
  setActiveAlertOrder: (order: StoreOrder | null) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  activeOrders: [],
  completedOrders: [],
  selectedOrder: null,
  activeAlertOrder: null,
  setActiveOrders: (activeOrders) => set({ activeOrders }),
  setCompletedOrders: (completedOrders) => set({ completedOrders }),
  setSelectedOrder: (selectedOrder) => set({ selectedOrder }),
  setActiveAlertOrder: (activeAlertOrder) => set({ activeAlertOrder }),
}));
