import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/useAuthStore';
import { AuthService } from '../../../services/firebase/auth';
import { FirestoreService } from '../../../services/firebase/firestore';
import { db } from '../../../services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { KycStatus, AvailabilityStatus } from '../../../types/enums';

export const OtpVerificationScreen = ({ route, navigation }: any) => {
  const { registrationData, phone: paramPhone, isLogin } = route.params || {};
  const phoneNumber = paramPhone || registrationData?.phone || '+919876543210';
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(30);
  const [loading, setLoading] = useState(false);
  const { setStore, setAuthUser } = useAuthStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      let uid: string;
      let userPhone: string = phoneNumber;

        const user = await AuthService.verifyOtp(otp);
        uid = user.uid;
        userPhone = user.phoneNumber || phoneNumber;

      if (isLogin) {
        // --- LOGIN FLOW ---
        // 1. Fetch store profile from Firestore by UID
        let existingStore = await FirestoreService.getStoreProfile(uid);

        // 2. Fallback search by phone number if UID didn't match directly
        if (!existingStore) {
          try {
            const storesCol = collection(db, 'stores');
            const q = query(storesCol, where('phone', '==', userPhone));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const docSnap = snap.docs[0];
              existingStore = { storeId: docSnap.id, ...docSnap.data() } as any;
            }
          } catch (queryErr) {
            console.warn('[OtpVerification] Phone lookup query error:', queryErr);
          }
        }

        if (existingStore) {
          setAuthUser(existingStore.storeId, userPhone);
          setStore(existingStore);
          setLoading(false);

          if (existingStore.kycStatus === KycStatus.Approved) {
            navigation.replace('Main');
          } else {
            navigation.replace('KycPending');
          }
        } else {
          setLoading(false);
          Alert.alert(
            'Store Not Found',
            'No pharmacy store profile found for this phone number. Please register your store first.',
            [
              { text: 'Register Now', onPress: () => navigation.navigate('StoreRegistration') },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
      } else {
        // --- REGISTRATION FLOW ---
        const newStore = {
          storeId: uid,
          businessName: registrationData?.businessName || 'Rapidmedi Pharmacy',
          ownerName: registrationData?.ownerName || 'Pharmacy Partner',
          phone: userPhone,
          category: registrationData?.category || 'PHARMACY',
          city: registrationData?.city || 'Bengaluru',
          kycStatus: KycStatus.NotStarted,
          availability: AvailabilityStatus.Offline,
          workingHours: {
            mon: { open: '08:00', close: '22:00', closed: false },
            tue: { open: '08:00', close: '22:00', closed: false },
            wed: { open: '08:00', close: '22:00', closed: false },
            thu: { open: '08:00', close: '22:00', closed: false },
            fri: { open: '08:00', close: '22:00', closed: false },
            sat: { open: '08:00', close: '22:00', closed: false },
            sun: { open: '09:00', close: '20:00', closed: false },
          },
          createdAt: new Date().toISOString(),
        };

        // Create and save store profile in Firestore
        await FirestoreService.createStoreProfile(newStore);
        setAuthUser(uid, userPhone);
        setStore(newStore);

        setLoading(false);
        navigation.replace('KycUploadWizard');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Verification Failed', error.message || 'Incorrect verification code. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Phone Verification</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {phoneNumber}
        </Text>

        <TextInput
          style={styles.otpInput}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          autoFocus
        />

        <Button
          title={isLogin ? "VERIFY & LOGIN" : "VERIFY & CONTINUE TO KYC"}
          size="large"
          loading={loading}
          onPress={handleVerify}
          style={styles.button}
        />

        <Text style={styles.resendText}>
          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Did not receive code? Resend OTP'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  title: { ...typography.h1, color: colors.text.primary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.xl },
  otpInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: spacing.xl,
    color: colors.brand.primary,
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  button: { width: '100%', marginBottom: spacing.lg },
  resendText: { ...typography.caption, color: colors.text.secondary, textAlign: 'center' },
});
