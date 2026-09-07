import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/useAuthStore';
import { AuthService } from '../../../services/firebase/auth';
import { FirestoreService } from '../../../services/firebase/firestore';
import { db } from '../../../services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { KycStatus, AvailabilityStatus } from '../../../types/enums';

const { width, height } = Dimensions.get('window');

// Colors matching tailwind config exactly
const C = {
  emeraldDeep: '#059669',
  emeraldLush: '#10B981',
  sageTop: '#F4F7F5',
  sageBottom: '#E2E8E4',
  secondaryFixed: '#c2ecd5',
  primaryFixed: '#82f9c0',
  onSurface: '#151d19',
  onSurfaceVariant: '#3d4a42',
  outlineVariant: '#bccac0',
  onPrimary: '#ffffff',
  glassBorder: 'rgba(255, 255, 255, 0.6)',
};

export const OtpVerificationScreen = ({ route, navigation }: any) => {
  const { registrationData, phone: paramPhone, isLogin } = route.params || {};
  const phoneNumber = paramPhone || registrationData?.phone || '+919876543210';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputsRef = useRef<Array<TextInput | null>>([]);
  
  const [cooldown, setCooldown] = useState(59);
  const [loading, setLoading] = useState(false);
  const { setStore, setAuthUser } = useAuthStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto advance
    if (text !== '' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      let uid: string;
      let userPhone: string = phoneNumber;

      const user = await AuthService.verifyOtp(fullOtp);
      uid = user.uid;
      userPhone = user.phoneNumber || phoneNumber;

      if (isLogin) {
        let existingStore = await FirestoreService.getStoreProfile(uid);

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
        const newStore = {
          storeId: uid,
          businessName: registrationData?.businessName || 'RapidMedico Pharmacy',
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
    <View style={styles.container}>
      <LinearGradient colors={[C.sageTop, C.sageBottom, C.secondaryFixed]} style={StyleSheet.absoluteFill} />
      
      {/* Decorative Orbs */}
      <View style={[styles.orb, styles.orbTopRight]} />
      <View style={[styles.orb, styles.orbMiddleLeft]} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={styles.mainContainer}>
            {/* Back Navigation */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color={C.onSurface} />
            </TouchableOpacity>

            {/* Main Card */}
            <View style={styles.glassWrapper}>
              <BlurView intensity={70} tint="light" style={styles.glassCard}>
                
                {/* Header */}
                <View style={styles.header}>
                  <MaterialIcons name="security" size={48} color={C.emeraldDeep} style={styles.icon} />
                  <Text style={styles.title}>Verify Your Number</Text>
                  <Text style={styles.subtitle}>
                    We've sent a 6-digit code to your registered mobile number. Please enter it below.
                  </Text>
                </View>

                {/* OTP Form */}
                <View style={styles.formContainer}>
                  <View style={styles.otpInputsContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={`otp-${index}`}
                        ref={(ref) => { inputsRef.current[index] = ref; }}
                        style={[
                          styles.otpInput,
                          focusedIndex === index && styles.otpInputFocused
                        ]}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        onFocus={() => setFocusedIndex(index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={styles.submitBtnContainer}
                    activeOpacity={0.9}
                    onPress={handleVerify}
                    disabled={loading}
                  >
                    <LinearGradient 
                      colors={[C.emeraldLush, C.emeraldDeep]} 
                      style={styles.submitBtnGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.submitBtnText}>{loading ? 'VERIFYING...' : 'VERIFY OTP'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Resend Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Didn't receive the code?
                  </Text>
                  <Text style={[styles.timerText, cooldown === 0 && styles.timerTextHidden]}>
                    00:{cooldown < 10 ? `0${cooldown}` : cooldown}
                  </Text>
                  <TouchableOpacity disabled={cooldown > 0} onPress={() => { setCooldown(59); }}>
                    <Text style={[styles.resendBtn, cooldown > 0 && styles.resendBtnDisabled]}>
                      Resend OTP
                    </Text>
                  </TouchableOpacity>
                </View>

              </BlurView>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  mainContainer: {
    width: '100%',
    maxWidth: 448, // max-w-md
    zIndex: 10,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.3,
  },
  orbTopRight: {
    top: -160,
    right: -160,
    width: 384,
    height: 384,
    backgroundColor: C.primaryFixed,
  },
  orbMiddleLeft: {
    top: height / 2 - 144,
    left: -80,
    width: 288,
    height: 288,
    backgroundColor: C.emeraldLush,
    opacity: 0.2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  glassWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: C.glassBorder,
    shadowColor: C.emeraldDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 4,
  },
  glassCard: {
    padding: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: C.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
  },
  otpInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 8,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    color: C.onSurface,
    textAlign: 'center',
  },
  otpInputFocused: {
    borderColor: C.emeraldLush,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  submitBtnContainer: {
    borderRadius: 12,
    shadowColor: C.emeraldDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  submitBtnGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitBtnText: {
    color: C.onPrimary,
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: C.onSurfaceVariant,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    color: C.emeraldDeep,
    marginTop: 4,
  },
  timerTextHidden: {
    display: 'none',
  },
  resendBtn: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    color: C.emeraldDeep,
  },
  resendBtnDisabled: {
    opacity: 0.5,
  }
});
