import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar, Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/nav/navigation/RootNavigator';
import { orderAlertService } from './src/services/alert/orderAlertService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes default stale time per spec section 54
    },
  },
});

export default function App() {
  useEffect(() => {
    // Make status bar transparent on Android
    if (Platform.OS === 'android') {
      RNStatusBar.setTranslucent(true);
      RNStatusBar.setBackgroundColor('transparent');
    }
    orderAlertService.initializeNotificationChannel().catch((err) => {
      console.warn('[App] Notification channel init warning:', err);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <RootNavigator />
    </QueryClientProvider>
  );
}
