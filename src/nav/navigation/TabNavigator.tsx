import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { DashboardScreen } from '../../features/dashboard/screens/DashboardScreen';
import { OrdersScreen } from '../../features/orders/screens/OrdersScreen';
import { InventoryScreen } from '../../features/inventory/screens/InventoryScreen';
import { AnalyticsScreen } from '../../features/analytics/screens/AnalyticsScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { colors } from '../../theme/tokens';

const CircleHomeIcon = ({ color }: { color: string }) => (
  <View style={{
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Ionicons name="home-sharp" size={15} color="#ffffff" />
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
          if (route.name === 'ProfileTab') {
            return <Ionicons name="storefront-sharp" size={24} color={color} />;
          }
          if (route.name === 'InventoryTab') {
            return <FontAwesome5 name="cubes" size={22} color={color} />;
          }
          if (route.name === 'DashboardTab') {
            return <CircleHomeIcon color={color} />;
          }
          if (route.name === 'OrdersTab') {
            return <Ionicons name="cart-sharp" size={24} color={color} />;
          }
          if (route.name === 'AnalyticsTab') {
            return <Ionicons name="stats-chart-sharp" size={22} color={color} />;
          }
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
