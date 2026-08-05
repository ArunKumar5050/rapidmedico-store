import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { KycPendingNavigator } from './KycPendingNavigator';
import { MainNavigator } from './MainNavigator';
import { useAuthStore } from '../../store/useAuthStore';
import { useAuth } from '../../hooks/useAuth';
import { KycStatus } from '../../types/enums';
import { FullScreenOrderAlertModal } from '../../components/ui/FullScreenOrderAlertModal';
import { useOrderStore } from '../../store/useOrderStore';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  useAuth();
  const { isAuthenticated, store, isLoading } = useAuthStore();
  const { activeAlertOrder, setActiveAlertOrder } = useOrderStore();

  return (
    <NavigationContainer>
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
        onAccept={(orderId) => {
          setActiveAlertOrder(null);
          alert(`Order ${orderId} Accepted!`);
        }}
        onReject={(orderId) => {
          setActiveAlertOrder(null);
          alert(`Order ${orderId} Rejected.`);
        }}
      />
    </NavigationContainer>
  );
};
