import { create } from 'zustand';
import { InventoryItem } from '../types/models';

interface InventoryState {
  items: InventoryItem[];
  searchQuery: string;
  setItems: (items: InventoryItem[]) => void;
  setSearchQuery: (query: string) => void;
  toggleStockLocally: (medicineId: string, inStock: boolean) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  searchQuery: '',
  setItems: (items) => set({ items }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleStockLocally: (medicineId, inStock) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.medicineId === medicineId ? { ...item, inStock } : item
      ),
    })),
}));
