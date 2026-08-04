import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/useAuthStore';
import { KycStatus, AvailabilityStatus } from '../../../types/enums';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useRef } from 'react';
import app from '../../../services/firebase/config';
import { AuthService } from '../../../services/firebase/auth';

export const LoginScreen = ({ navigation }: any) => {
  const [phone, setPhone] = useState('+91');
  const [loading, setLoading] = useState(false);
  const { setStore, setAuthUser } = useAuthStore();
  const recaptchaVerifier = useRef(null);

  const handleLogin = async () => {
    if (phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number with country code (e.g. +919876543210).');
      return;
    }

    setLoading(true);
    try {
      const success = await AuthService.sendOtp(phone, recaptchaVerifier.current);
      setLoading(false);
      if (success) {
        navigation.navigate('OtpVerification', { phone, isLogin: true });
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Login Error', error.message || 'Unable to proceed to OTP verification');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Rapidmedi Partner</Text>
          <Text style={styles.subtitle}>Login to manage your store and orders</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+919876543210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <Button
          title="LOGIN"
          size="large"
          loading={loading}
          onPress={handleLogin}
          style={styles.submitBtn}
        />

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('StoreRegistration')}>
            <Text style={styles.registerLink}>Register Here</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.xl, flexGrow: 1, justifyContent: 'center' },
  header: { marginBottom: spacing.xl * 2, alignItems: 'center' },
  title: { ...typography.h1, color: colors.brand.primary, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  fieldGroup: { marginBottom: spacing.xl },
  label: { ...typography.bodyStrong, color: colors.text.primary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.h3,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  submitBtn: { marginTop: spacing.md },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  registerText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  registerLink: {
    ...typography.bodyStrong,
    color: colors.brand.primary,
  },
});
