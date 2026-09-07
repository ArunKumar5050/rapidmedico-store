import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { DashboardScreen } from '../../features/dashboard/screens/DashboardScreen';
import { OrdersScreen } from '../../features/orders/screens/OrdersScreen';
import { InventoryScreen } from '../../features/inventory/screens/InventoryScreen';
import { AnalyticsScreen } from '../../features/analytics/screens/AnalyticsScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { colors } from '../../theme/tokens';

const CircleHomeIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <View style={{
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: focused ? colors.brand.primary : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: focused ? colors.brand.primary : 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: focused ? 0.4 : 0,
    shadowRadius: 8,
    elevation: focused ? 6 : 0,
  }}>
    <Ionicons name="home-sharp" size={18} color={focused ? '#ffffff' : color} />
  </View>
);

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
          height: 64 + insets.bottom,
          paddingBottom: Math.max(10, insets.bottom),
          paddingTop: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 119, 182, 0.1)',
          elevation: 12,
          shadowColor: colors.brand.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: 'Nunito_600SemiBold',
          marginTop: 2,
        },
        tabBarIcon: ({ color, focused }) => {
          if (route.name === 'DashboardTab') {
            return <CircleHomeIcon color={color} focused={focused} />;
          }
          if (route.name === 'ProfileTab') {
            return <Ionicons name="storefront-sharp" size={24} color={color} />;
          }
          if (route.name === 'InventoryTab') {
            return <FontAwesome5 name="cubes" size={21} color={color} />;
          }
          if (route.name === 'OrdersTab') {
            return <Ionicons name="receipt-sharp" size={24} color={color} />;
          }
          if (route.name === 'AnalyticsTab') {
            return <Ionicons name="stats-chart-sharp" size={22} color={color} />;
          }
          return null;
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
