import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/useAuthStore';
import { AuthService } from '../../../services/firebase/auth';
import { FirestoreService } from '../../../services/firebase/firestore';

const { width } = Dimensions.get('window');

// Colors matching tailwind config exactly
const C = {
  emeraldDeep: '#059669',
  emeraldLush: '#10B981',
  sageTop: '#F4F7F5',
  onSurface: '#151d19',
  onSurfaceVariant: '#3d4a42',
  outlineVariant: '#bccac0',
  outline: '#6d7a71',
  onPrimary: '#ffffff',
  glassBorder: 'rgba(255, 255, 255, 0.6)',
};

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { setStore, setAuthUser } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Invalid Input', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await AuthService.loginWithEmail(email.trim(), password);
      const existingStore = await FirestoreService.getStoreProfile(user.uid);

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
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
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
    <LinearGradient colors={[C.sageTop, C.emeraldLush]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={styles.mainContainer}>
            {/* Glass Card */}
            <View style={styles.glassWrapper}>
              <BlurView intensity={80} tint="light" style={styles.glassCard}>
                
                {/* Logo & Brand */}
                <View style={styles.brandContainer}>
                  <MaterialIcons name="local-pharmacy" size={36} color={C.emeraldDeep} />
                  <Text style={styles.brandText}>RapidMedicoco</Text>
                </View>

                {/* Titles */}
                <View style={styles.titleContainer}>
                  <Text style={styles.titleText}>Partner Portal</Text>
                  <Text style={styles.subtitleText}>Login to manage your store</Text>
                </View>

                {/* Login Form */}
                <View style={styles.formContainer}>
                  {/* Email Input Group */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
                        placeholder="owner@pharmacy.com"
                        placeholderTextColor={C.outline}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  {/* Password Input Group */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
                        placeholder="••••••••"
                        placeholderTextColor={C.outline}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity 
                    style={styles.submitBtnContainer}
                    activeOpacity={0.9}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    <LinearGradient 
                      colors={[C.emeraldLush, C.emeraldDeep]} 
                      style={styles.submitBtnGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.submitBtnText}>{loading ? 'LOGGING IN...' : 'LOGIN'}</Text>
                      {!loading && <MaterialIcons name="arrow-forward" size={20} color={C.onPrimary} style={{ marginLeft: 8 }} />}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Registration Link */}
                <TouchableOpacity onPress={() => navigation.navigate('StoreRegistration')} style={styles.registerLinkContainer}>
                  <Text style={styles.registerLinkText}>
                    New pharmacy? <Text style={styles.registerLinkTextBold}>Register your store</Text>
                  </Text>
                </TouchableOpacity>

              </BlurView>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
  },
  glassWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: C.glassBorder,
    shadowColor: C.emeraldDeep,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 8,
  },
  glassCard: {
    padding: 32,
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '700',
    color: C.emeraldDeep,
    letterSpacing: -0.5,
    marginLeft: 12,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '600',
    color: C.onSurface,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: C.onSurfaceVariant,
  },
  formContainer: {
    width: '100%',
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: C.onSurface,
    height: 48,
  },
  inputFocused: {
    borderColor: C.emeraldLush,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  submitBtnContainer: {
    marginTop: 8,
    borderRadius: 8,
    shadowColor: C.emeraldDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  submitBtnText: {
    color: C.onPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 32,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.glassBorder,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerLinkText: {
    fontSize: 16,
    color: C.emeraldDeep,
  },
  registerLinkTextBold: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  }
});
