import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { AuthService } from '../services/firebase/auth';
import { FirestoreService } from '../services/firebase/firestore';
import { orderAlertService } from '../services/alert/orderAlertService';

export const useAuth = () => {
  const { store, isAuthenticated, isLoading, setStore, setAuthUser, logout } = useAuthStore();

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
      if (user) {
        // Support both Email/Password and Phone auth users
        const identifier = user.email || user.phoneNumber || user.uid;
        setAuthUser(user.uid, identifier);
        const storeProfile = await FirestoreService.getStoreProfile(user.uid);
        setStore(storeProfile);

        // Fetch and save Push Token for Option B setup
        try {
          const pushToken = await orderAlertService.registerPushToken();
          if (pushToken && storeProfile?.storeId) {
            await FirestoreService.updatePushToken(storeProfile.storeId, pushToken);
            console.log('[useAuth] Push token saved to store profile:', pushToken);
          }
        } catch (tokenErr) {
          console.warn('[useAuth] Failed to register/save push token:', tokenErr);
        }
      } else {
        logout();
      }
    });

    return () => unsubscribe();
  }, []);

  return { store, isAuthenticated, isLoading, logout };
};
