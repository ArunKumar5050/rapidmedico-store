import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { AuthService } from '../services/firebase/auth';
import { FirestoreService } from '../services/firebase/firestore';

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
      } else {
        logout();
      }
    });

    return () => unsubscribe();
  }, []);

  return { store, isAuthenticated, isLoading, logout };
};
