import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { OrderDetailsScreen } from '../../features/orders/screens/OrderDetailsScreen';
import { AddMedicineScreen } from '../../features/inventory/screens/AddMedicineScreen';
import { EditMedicineScreen } from '../../features/inventory/screens/EditMedicineScreen';
import { StoreSettingsScreen } from '../../features/profile/screens/StoreSettingsScreen';
import { WorkingHoursScreen } from '../../features/profile/screens/WorkingHoursScreen';
import { PerformanceDashboardScreen } from '../../features/profile/screens/PerformanceDashboardScreen';
import { RatingsScreen } from '../../features/profile/screens/RatingsScreen';
import { SupportScreen } from '../../features/support/screens/SupportScreen';
import { AnnouncementsScreen } from '../../features/support/screens/AnnouncementsScreen';
import { useOrderQueue } from '../../hooks/useOrderQueue';

const Stack = createNativeStackNavigator();

export const MainNavigator = () => {
  useOrderQueue(); // Automatically listen to queue and trigger alerts when inside Main
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddMedicine" component={AddMedicineScreen} options={{ title: 'Add Medicine' }} />
      <Stack.Screen name="EditMedicine" component={EditMedicineScreen} options={{ title: 'Edit Stock' }} />
      <Stack.Screen name="StoreSettings" component={StoreSettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="WorkingHours" component={WorkingHoursScreen} options={{ title: 'Working Hours' }} />
      <Stack.Screen name="PerformanceDashboard" component={PerformanceDashboardScreen} options={{ title: 'Performance Metrics' }} />
      <Stack.Screen name="Ratings" component={RatingsScreen} options={{ title: 'Store Ratings' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Support' }} />
      <Stack.Screen name="Announcements" component={AnnouncementsScreen} options={{ title: 'Announcements' }} />
    </Stack.Navigator>
  );
};
