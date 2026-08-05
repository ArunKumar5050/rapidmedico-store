import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { KycUploadWizardScreen } from '../../features/kyc/screens/KycUploadWizardScreen';
import { KycStatusScreen } from '../../features/kyc/screens/KycStatusScreen';
import { KycReuploadScreen } from '../../features/kyc/screens/KycReuploadScreen';
import { useAuthStore } from '../../store/useAuthStore';
import { KycStatus } from '../../types/enums';

const Stack = createNativeStackNavigator();

export const KycPendingNavigator = () => {
  const { store } = useAuthStore();
  const initialRouteName = store?.kycStatus === KycStatus.NotStarted ? 'KycUploadWizard' : 'KycStatus';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="KycUploadWizard" component={KycUploadWizardScreen} />
      <Stack.Screen name="KycStatus" component={KycStatusScreen} />
      <Stack.Screen name="KycReupload" component={KycReuploadScreen} />
    </Stack.Navigator>
  );
};
