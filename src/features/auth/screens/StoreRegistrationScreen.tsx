import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StoreRegistrationSchema, StoreRegistrationInput } from '../../../utils/schemas';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
import { StoreCategory } from '../../../types/enums';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useRef } from 'react';
import app from '../../../services/firebase/config';
import { AuthService } from '../../../services/firebase/auth';

export const StoreRegistrationScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StoreRegistrationInput>({
    resolver: zodResolver(StoreRegistrationSchema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      phone: '+91',
      category: 'PHARMACY',
      city: '',
    },
  });

  const onSubmit = async (data: StoreRegistrationInput) => {
    setLoading(true);
    try {
      // Form validated, proceed to OTP verification
      const success = await AuthService.sendOtp(data.phone, recaptchaVerifier.current);
      setLoading(false);
      if (success) {
        navigation.navigate('OtpVerification', { registrationData: data });
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Registration Error', error.message || 'Unable to register store details');
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
        <Text style={styles.title}>Rapidmedi Partner Program</Text>
        <Text style={styles.subtitle}>Turn your pharmacy into a high-speed fulfillment hub</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Pharmacy / Business Name *</Text>
          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.businessName && styles.inputError]}
                placeholder="e.g. Apollo Pharmacy Indiranagar"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.businessName && <Text style={styles.errorText}>{errors.businessName.message}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Owner Full Name *</Text>
          <Controller
            control={control}
            name="ownerName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.ownerName && styles.inputError]}
                placeholder="e.g. Arun Kumar"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.ownerName && <Text style={styles.errorText}>{errors.ownerName.message}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Store Contact Phone (E.164) *</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="+919876543210"
                keyboardType="phone-pad"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>City *</Text>
          <Controller
            control={control}
            name="city"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                placeholder="e.g. Bengaluru"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.city && <Text style={styles.errorText}>{errors.city.message}</Text>}
        </View>

        <Button
          title="SEND OTP VERIFICATION"
          size="large"
          loading={loading}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.text.primary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.xl },
  fieldGroup: { marginBottom: spacing.md },
  label: { ...typography.bodyStrong, color: colors.text.primary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  inputError: { borderColor: colors.action.reject },
  errorText: { ...typography.caption, color: colors.action.reject, marginTop: 4 },
  submitBtn: { marginTop: spacing.md },
});
