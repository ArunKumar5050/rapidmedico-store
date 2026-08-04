import { create } from 'zustand';
import { Store } from '../types/models';
import { KycStatus, AvailabilityStatus } from '../types/enums';

interface AuthState {
  store: Store | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  storeId: string | null;
  phoneNumber: string | null;
  setStore: (store: Store | null) => void;
  setAuthUser: (storeId: string | null, phoneNumber: string | null) => void;
  setAvailability: (availability: AvailabilityStatus) => void;
  setKycStatus: (status: KycStatus) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  store: null,
  isAuthenticated: false,
  isLoading: true,
  storeId: null,
  phoneNumber: null,
  setStore: (store) =>
    set({
      store,
      isAuthenticated: !!store,
      isLoading: false,
      storeId: store?.storeId || null,
    }),
  setAuthUser: (storeId, phoneNumber) =>
    set({
      storeId,
      phoneNumber,
      isAuthenticated: !!storeId,
      isLoading: false,
    }),
  setAvailability: (availability) =>
    set((state) => ({
      store: state.store ? { ...state.store, availability } : null,
    })),
  setKycStatus: (kycStatus) =>
    set((state) => ({
      store: state.store ? { ...state.store, kycStatus } : null,
    })),
  logout: () =>
    set({
      store: null,
      isAuthenticated: false,
      isLoading: false,
      storeId: null,
      phoneNumber: null,
    }),
}));
