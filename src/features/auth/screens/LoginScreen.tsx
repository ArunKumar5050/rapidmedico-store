import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Alert, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/useAuthStore';
import { AuthService } from '../../../services/firebase/auth';
import { FirestoreService } from '../../../services/firebase/firestore';

const { width } = Dimensions.get('window');

const C = {
  primaryBlue: '#0077B6',
  primaryDark: '#005A8E',
  cyan: '#00B4D8',
  bgLight: '#EAF6FF',
  bgTop: '#CAF0F8',
  onSurface: '#0D1B2A',
  onSurfaceVariant: '#3A5F7A',
  outline: '#7A9BB5',
  outlineVariant: '#B3D4EA',
  onPrimary: '#ffffff',
  glassBorder: 'rgba(255, 255, 255, 0.7)',
};

const CustomTextInput = React.forwardRef(({
  label,
  iconName,
  ...props
}: any, ref: any) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, {
        borderColor: isFocused ? '#0077B6' : '#B3D4EA',
        backgroundColor: isFocused ? 'rgba(255,255,255,0.95)' : 'rgba(240, 247, 255, 0.8)',
      }]}>
        <MaterialIcons name={iconName} size={18} color={isFocused ? C.primaryBlue : C.outline} style={styles.inputIcon} />
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={C.outline}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
    </View>
  );
});

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const { setStore, setAuthUser } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Invalid Input', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await AuthService.loginWithEmail(email.trim(), password);
      
      let storeUser = null;
      let retries = 3;
      while (retries > 0) {
        try {
          storeUser = await FirestoreService.getStoreUser(user.uid);
          break; // Success
        } catch (err: any) {
          if (err.message?.includes('offline') && retries > 1) {
            console.log('Firestore offline, retrying in 2 seconds...');
            await new Promise((resolve) => setTimeout(resolve, 2000));
            retries--;
          } else {
            throw err;
          }
        }
      }

      if (!storeUser || !['OWNER', 'store', 'medical-store', 'MANAGER', 'STAFF'].includes(storeUser.role)) {
        Alert.alert('Access Denied', 'Your account does not have store access.');
        // Make sure to log out the user if access is denied
        await AuthService.logout();
        return;
      }

      const storeId = storeUser.storeId || user.uid;
      
      let existingStore = null;
      retries = 3;
      while (retries > 0) {
        try {
          existingStore = await FirestoreService.getStoreProfile(storeId);
          break;
        } catch (err: any) {
          if (err.message?.includes('offline') && retries > 1) {
            console.log('Firestore offline, retrying in 2 seconds...');
            await new Promise((resolve) => setTimeout(resolve, 2000));
            retries--;
          } else {
            throw err;
          }
        }
      }

      if (existingStore) {
        setAuthUser(user.uid, email.trim());
        setStore(existingStore);
      } else {
        Alert.alert(
          'Store Not Found',
          'No pharmacy store profile found for this account. Please register your store first.',
          [
            { text: 'Register Now', onPress: () => navigation.navigate('StoreRegistration') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (error: any) {
      let errorMsg = 'Unable to login. Please check your credentials.';
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        errorMsg = 'Invalid email or password.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      Alert.alert('Login Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#CAF0F8', '#90E0EF', '#0077B6']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top brand mark */}
          <View style={styles.brandMark}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.brandIconWrapper}
            >
              <MaterialIcons name="local-pharmacy" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.brandName}>RapidMedico</Text>
            <Text style={styles.brandTagline}>Partner Portal</Text>
          </View>

          {/* Glass Card */}
          <View style={styles.glassWrapper}>
            <View style={[styles.glassCard, { backgroundColor: 'rgba(255,255,255,0.72)' }]}>

              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.titleText}>Welcome back</Text>
                <Text style={styles.subtitleText}>Login to manage your store</Text>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                {/* Email */}
                <CustomTextInput
                  label="EMAIL ADDRESS"
                  iconName="email"
                  placeholder="owner@pharmacy.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    if (email.trim().length > 0) {
                      passwordRef.current?.focus();
                    }
                  }}
                />

                {/* Password */}
                <CustomTextInput
                  ref={passwordRef}
                  label="PASSWORD"
                  iconName="lock"
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="current-password"
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                {/* Login Button */}
                <TouchableOpacity
                  style={styles.submitBtnContainer}
                  activeOpacity={0.88}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[C.cyan, C.primaryBlue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitBtnGradient}
                  >
                    <Text style={styles.submitBtnText}>{loading ? 'LOGGING IN...' : 'LOGIN'}</Text>
                    {!loading && (
                      <MaterialIcons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register Link */}
              <TouchableOpacity
                onPress={() => navigation.navigate('StoreRegistration')}
                style={styles.registerLinkContainer}
              >
                <Text style={styles.registerLinkText}>
                  New pharmacy?{' '}
                  <Text style={styles.registerLinkTextBold}>Register your store</Text>
                </Text>
              </TouchableOpacity>
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
  orb1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  orb2: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(0, 180, 216, 0.2)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  brandMark: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  brandTagline: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  glassWrapper: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#005A8E',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.2,
    shadowRadius: 48,
    elevation: 12,
  },
  glassCard: {
    padding: 28,
  },
  cardHeader: {
    marginBottom: 28,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: '#3A5F7A',
  },
  formContainer: {
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: '#3A5F7A',
    letterSpacing: 1.0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 247, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: '#B3D4EA',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: '#0077B6',
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#0D1B2A',
  },
  submitBtnContainer: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0077B6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 119, 182, 0.15)',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: '#7A9BB5',
    letterSpacing: 1.5,
  },
  registerLinkContainer: {
    alignItems: 'center',
  },
  registerLinkText: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: '#3A5F7A',
  },
  registerLinkTextBold: {
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#0077B6',
    textDecorationLine: 'underline',
  },
});
