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
        
        let activeStoreId = user.uid;
        try {
          const storeUser = await FirestoreService.getStoreUser(user.uid);
          if (storeUser && storeUser.storeId) {
            activeStoreId = storeUser.storeId;
          }
        } catch (err) {
          console.warn('[useAuth] Failed to fetch store_user mapping:', err);
        }

        setAuthUser(activeStoreId, identifier);
        
        let storeProfile = null;
        try {
          storeProfile = await FirestoreService.getStoreProfile(activeStoreId);
          setStore(storeProfile);
        } catch (err) {
          console.warn('[useAuth] Failed to fetch store profile:', err);
          setStore(null);
        }

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
