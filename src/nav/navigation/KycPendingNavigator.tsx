import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { KycStatusScreen } from '../../features/kyc/screens/KycStatusScreen';
import { KycReuploadScreen } from '../../features/kyc/screens/KycReuploadScreen';

const Stack = createNativeStackNavigator();

export const KycPendingNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="KycStatus" component={KycStatusScreen} />
      <Stack.Screen name="KycReupload" component={KycReuploadScreen} />
    </Stack.Navigator>
  );
};
