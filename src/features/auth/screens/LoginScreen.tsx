import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/useAuthStore';
import { KycStatus } from '../../../types/enums';
import { AuthService } from '../../../services/firebase/auth';
import { FirestoreService } from '../../../services/firebase/firestore';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setStore, setAuthUser } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Invalid Input', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate with Firebase
      const user = await AuthService.loginWithEmail(email.trim(), password);
      
      // 2. Fetch Store Profile
      const existingStore = await FirestoreService.getStoreProfile(user.uid);

      if (existingStore) {
        setAuthUser(user.uid, email.trim());
        setStore(existingStore);
        setLoading(false);

        if (existingStore.kycStatus === KycStatus.Approved) {
          navigation.replace('Main');
        } else {
          navigation.replace('KycPending');
        }
      } else {
        setLoading(false);
        // If they authenticated but have no store profile, it's an invalid state.
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
      setLoading(false);
      let errorMsg = 'Unable to login. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      Alert.alert('Login Error', errorMsg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Rapidmedi Partner</Text>
          <Text style={styles.subtitle}>Login to manage your store and orders</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="owner@pharmacy.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
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
    ...typography.body,
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
