import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { DashboardScreen } from '../../features/dashboard/screens/DashboardScreen';
import { OrdersScreen } from '../../features/orders/screens/OrdersScreen';
import { InventoryScreen } from '../../features/inventory/screens/InventoryScreen';
import { AnalyticsScreen } from '../../features/analytics/screens/AnalyticsScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { colors } from '../../theme/tokens';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: { 
          height: 60 + insets.bottom, 
          paddingBottom: Math.max(8, insets.bottom), 
          paddingTop: 8,
          backgroundColor: '#f4f7f5', // Softer, matching background
          borderTopColor: 'rgba(5,150,105,0.1)', // Subtle line
          elevation: 0,
          shadowOpacity: 0
        },
        tabBarIcon: ({ color }) => {
          let icon = '🏠';
          if (route.name === 'DashboardTab') icon = '📊';
          if (route.name === 'OrdersTab') icon = '📦';
          if (route.name === 'InventoryTab') icon = '💊';
          if (route.name === 'AnalyticsTab') icon = '📈';
          if (route.name === 'ProfileTab') icon = '👤';
          return <Text style={{ fontSize: 20 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="OrdersTab" component={OrdersScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="InventoryTab" component={InventoryScreen} options={{ title: 'Stock' }} />
      <Tab.Screen name="AnalyticsTab" component={AnalyticsScreen} options={{ title: 'Metrics' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Store' }} />
    </Tab.Navigator>
  );
};
