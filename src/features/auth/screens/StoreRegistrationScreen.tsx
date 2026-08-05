import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Location from 'expo-location';
import { StoreRegistrationSchema, StoreRegistrationInput } from '../../../utils/schemas';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
import { AuthService } from '../../../services/firebase/auth';
import { FirestoreService } from '../../../services/firebase/firestore';
import { useAuthStore } from '../../../store/useAuthStore';
import { KycStatus, AvailabilityStatus } from '../../../types/enums';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const StoreRegistrationScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const { setStore, setAuthUser } = useAuthStore();

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
      email: '',
      password: '',
      phone: '+91',
      category: 'PHARMACY',
      streetAddress: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  const handleFetchLocation = async () => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied. Please allow location access to tag your store.');
        setFetchingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      setCoords({ latitude: lat, longitude: lng });
      setValue('latitude', lat);
      setValue('longitude', lng);

      Alert.alert('Location Fetched', `Coordinates set to:\nLatitude: ${lat.toFixed(6)}\nLongitude: ${lng.toFixed(6)}`);
    } catch (err: any) {
      console.error('[StoreRegistration] Location error:', err);
      Alert.alert('Location Error', err.message || 'Unable to fetch current location');
    } finally {
      setFetchingLocation(false);
    }
  };

  const onSubmit = async (data: StoreRegistrationInput) => {
    setLoading(true);
    try {
      // 1. Register user in Firebase Auth using their entered password
      const user = await AuthService.registerWithEmail(data.email.trim(), data.password);

      // 2. Create Store Profile with location coordinates
      const newStore: any = {
        storeId: user.uid,
        businessName: data.businessName,
        ownerName: data.ownerName,
        phone: data.phone,
        email: data.email.trim(),
        category: data.category,
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        latitude: coords ? coords.latitude : (data.latitude || null),
        longitude: coords ? coords.longitude : (data.longitude || null),
        location: coords ? {
          latitude: coords.latitude,
          longitude: coords.longitude,
        } : undefined,
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
      await FirestoreService.createStoreUser(user.uid, user.uid, data.email.trim(), 'OWNER');

      // 3. Update Auth Store
      setAuthUser(user.uid, data.email.trim());
      setStore(newStore);

      setLoading(false);

      Alert.alert(
        'Registration Successful',
        'Your store account has been created successfully!',
        [
          {
            text: 'Continue to KYC',
            onPress: () => navigation.replace('KycUploadWizard'),
          },
        ]
      );
    } catch (error: any) {
      setLoading(false);
      let errorMsg = 'Unable to register store details';
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'This email is already registered. Please login instead.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      Alert.alert('Registration Error', errorMsg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Rapidmedi Partner</Text>
        <Text style={styles.subtitle}>Register your pharmacy to become a fulfillment hub</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Pharmacy / Business Name *</Text>
          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.businessName && styles.inputError]}
                placeholder="Enter pharmacy / store name"
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
                placeholder="Enter owner full name"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.ownerName && <Text style={styles.errorText}>{errors.ownerName.message}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Login Email Address *</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Create Account Password *</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Enter password (min 6 characters)"
                secureTextEntry
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Store Contact Phone (E.164) *</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="+91 Mobile number"
                keyboardType="phone-pad"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Shop / Street Address *</Text>
          <Controller
            control={control}
            name="streetAddress"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.streetAddress && styles.inputError]}
                placeholder="Door/Shop No., Street, Area & Landmark"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.streetAddress && <Text style={styles.errorText}>{errors.streetAddress.message}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>City *</Text>
          <Controller
            control={control}
            name="city"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                placeholder="Enter city name"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.city && <Text style={styles.errorText}>{errors.city.message}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>State *</Text>
          <Controller
            control={control}
            name="state"
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity
                  style={[styles.pickerTile, errors.state && styles.inputError]}
                  onPress={() => setStateModalVisible(true)}
                >
                  <Text style={value ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
                    {value || 'Select State / Union Territory'}
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>

                <Modal
                  visible={stateModalVisible}
                  animationType="slide"
                  transparent={true}
                  onRequestClose={() => setStateModalVisible(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select State / UT</Text>
                        <TouchableOpacity onPress={() => setStateModalVisible(false)}>
                          <Text style={styles.closeBtn}>✕</Text>
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search state..."
                        value={stateSearch}
                        onChangeText={setStateSearch}
                      />

                      <FlatList
                        data={INDIAN_STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[styles.stateItem, value === item && styles.stateItemSelected]}
                            onPress={() => {
                              onChange(item);
                              setStateModalVisible(false);
                              setStateSearch('');
                            }}
                          >
                            <Text style={[styles.stateItemText, value === item && styles.stateItemTextSelected]}>
                              {item}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  </View>
                </Modal>
              </>
            )}
          />
          {errors.state && <Text style={styles.errorText}>{errors.state.message}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Pincode / Postal Code *</Text>
          <Controller
            control={control}
            name="pincode"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.pincode && styles.inputError]}
                placeholder="6-digit postal pincode"
                keyboardType="number-pad"
                maxLength={6}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.pincode && <Text style={styles.errorText}>{errors.pincode.message}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Store Location Coordinates</Text>
          <Button
            title={fetchingLocation ? "FETCHING LOCATION..." : coords ? `LAT: ${coords.latitude.toFixed(4)}, LNG: ${coords.longitude.toFixed(4)}` : "GET CURRENT LOCATION COORDINATES"}
            variant="outline"
            loading={fetchingLocation}
            onPress={handleFetchLocation}
            style={styles.locationBtn}
          />
          {coords && (
            <Text style={styles.successText}>
              Location set: Lat {coords.latitude.toFixed(6)}, Lng {coords.longitude.toFixed(6)}
            </Text>
          )}
        </View>

        <Button
          title="REGISTER STORE"
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
  successText: { ...typography.caption, color: colors.action.accept, marginTop: 6, fontWeight: '600' },
  locationBtn: { marginTop: spacing.xs, borderColor: colors.brand.primary },
  submitBtn: { marginTop: spacing.lg },
  pickerTile: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  pickerTextPlaceholder: { ...typography.body, color: colors.text.secondary },
  pickerTextSelected: { ...typography.bodyStrong, color: colors.text.primary },
  pickerArrow: { fontSize: 12, color: colors.text.secondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h2, color: colors.text.primary },
  closeBtn: { ...typography.h2, color: colors.text.secondary, paddingHorizontal: spacing.sm },
  searchInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    padding: spacing.md,
    ...typography.body,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  stateItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  stateItemSelected: {
    backgroundColor: colors.brand.primaryLight,
    borderRadius: 8,
  },
  stateItemText: { ...typography.body, color: colors.text.primary },
  stateItemTextSelected: { ...typography.bodyStrong, color: colors.brand.primaryDark },
});
