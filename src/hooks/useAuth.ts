import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { AuthService } from '../services/firebase/auth';
import { FirestoreService } from '../services/firebase/firestore';

export const useAuth = () => {
  const { store, isAuthenticated, isLoading, setStore, setAuthUser, logout } = useAuthStore();

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
      if (user && user.phoneNumber) {
        setAuthUser(user.uid, user.phoneNumber);
        const storeProfile = await FirestoreService.getStoreProfile(user.uid);
        setStore(storeProfile);
      } else {
        logout();
      }
    });

    return () => unsubscribe();
  }, []);

  return { store, isAuthenticated, isLoading, logout };
};
