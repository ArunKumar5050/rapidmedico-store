import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { KycPendingNavigator } from './KycPendingNavigator';
import { MainNavigator } from './MainNavigator';
import { useAuthStore } from '../../store/useAuthStore';
import { useAuth } from '../../hooks/useAuth';
import { KycStatus } from '../../types/enums';
import { FullScreenOrderAlertModal } from '../../components/ui/FullScreenOrderAlertModal';
import { useOrderStore } from '../../store/useOrderStore';
import { FirestoreService } from '../../services/firebase/firestore';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  useAuth();
  const { isAuthenticated, store, isLoading } = useAuthStore();
  const { activeAlertOrder, setActiveAlertOrder, addIgnoredAlertOrder } = useOrderStore();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (isAuthenticated && store?.storeId) {
      import('../../services/notifications').then(({ registerForPushNotificationsAsync }) => {
        registerForPushNotificationsAsync().then(token => {
          if (token && store.expoPushToken !== token) {
            FirestoreService.updatePushToken(store.storeId, token).catch(e => console.log('Push token update error:', e));
          }
        });
      });
    }
  }, [isAuthenticated, store?.storeId]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !store || store.kycStatus !== KycStatus.Approved ? (
          <Stack.Screen name="KycPending" component={KycPendingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>

      <FullScreenOrderAlertModal
        visible={!!activeAlertOrder}
        order={activeAlertOrder}
        onAccept={async (orderId) => {
          if (store?.storeId && activeAlertOrder) {
            const collectionName = activeAlertOrder._collection || 'customOrders';
            await FirestoreService.acceptOrder(store.storeId, orderId, collectionName);
          }
          setActiveAlertOrder(null);
          addIgnoredAlertOrder(orderId);
          if (navigationRef.isReady()) {
            // @ts-ignore
            navigationRef.navigate('Main', { screen: 'OrderDetails', params: { orderId } });
          }
        }}
        onReject={(orderId) => {
          setActiveAlertOrder(null);
          addIgnoredAlertOrder(orderId);
        }}
      />
    </NavigationContainer>
  );
};
