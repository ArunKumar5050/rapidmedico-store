import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { StoreRegistrationScreen } from '../../features/auth/screens/StoreRegistrationScreen';
import { OtpVerificationScreen } from '../../features/auth/screens/OtpVerificationScreen';
import { KycUploadWizardScreen } from '../../features/kyc/screens/KycUploadWizardScreen';

const Stack = createNativeStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="StoreRegistration" component={StoreRegistrationScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="KycUploadWizard" component={KycUploadWizardScreen} />
    </Stack.Navigator>
  );
};
