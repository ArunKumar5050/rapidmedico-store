import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity, Modal, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { StoreRegistrationSchema, StoreRegistrationInput } from '../../../utils/schemas';
import { AuthService } from '../../../services/firebase/auth';
import { FirestoreService } from '../../../services/firebase/firestore';
import { useAuthStore } from '../../../store/useAuthStore';
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
  onBackground: '#151d19',
  outline: '#6d7a71',
  primary: '#006a47',
  error: '#ba1a1a',
};

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
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
      const user = await AuthService.registerWithEmail(data.email.trim(), data.password);

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

  const InputField = ({ name, icon, placeholder, keyboardType = 'default', secureTextEntry = false, maxLength }: any) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{placeholder.split(' ')[0]} *</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconContainer}>
              <MaterialIcons name={icon} size={20} color={C.outline} />
            </View>
            <TextInput
              style={[
                styles.input,
                focusedField === name && styles.inputFocused,
                errors[name as keyof StoreRegistrationInput] && styles.inputError
              ]}
              placeholder={placeholder}
              placeholderTextColor={C.outline}
              keyboardType={keyboardType}
              secureTextEntry={secureTextEntry}
              autoCapitalize="none"
              maxLength={maxLength}
              value={value}
              onChangeText={onChange}
              onFocus={() => setFocusedField(name)}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        )}
      />
      {errors[name as keyof StoreRegistrationInput] && (
        <Text style={styles.errorText}>{errors[name as keyof StoreRegistrationInput]?.message as string}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[C.sageTop, C.sageBottom, C.secondaryFixed]} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={styles.mainContainer}>
            {/* Header */}
            <View style={styles.topHeader}>
              <View style={styles.logoContainer}>
                <MaterialIcons name="local-pharmacy" size={32} color={C.emeraldDeep} />
                <Text style={styles.logoText}>RapidMedico</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
                <MaterialIcons name="close" size={18} color={C.emeraldLush} />
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Main Card */}
            <View style={styles.glassWrapper}>
              {/* Decorative Orb */}
              <View style={[styles.orb, styles.orbTopRight]} />
              
              <BlurView intensity={70} tint="light" style={styles.glassCard}>
                
                {/* Progress Stepper */}
                <View style={styles.stepperContainer}>
                  <View style={styles.stepperLine}>
                    <View style={styles.stepperLineActive} />
                  </View>
                  <View style={styles.step}>
                    <LinearGradient colors={[C.emeraldLush, C.emeraldDeep]} style={styles.stepCircleActive}>
                      <Text style={styles.stepCircleTextActive}>1</Text>
                    </LinearGradient>
                    <Text style={styles.stepLabelActive}>Details</Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepCircleInactive}>
                      <Text style={styles.stepCircleTextInactive}>2</Text>
                    </View>
                    <Text style={styles.stepLabelInactive}>Docs</Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepCircleInactive}>
                      <Text style={styles.stepCircleTextInactive}>3</Text>
                    </View>
                    <Text style={styles.stepLabelInactive}>Verify</Text>
                  </View>
                </View>

                {/* Form Header */}
                <View style={styles.formHeader}>
                  <Text style={styles.title}>Basic Information</Text>
                  <Text style={styles.subtitle}>
                    Let's start with your store's essential details to get you registered on RapidMedico.
                  </Text>
                </View>

                {/* Form Fields */}
                <InputField name="businessName" icon="storefront" placeholder="Business Name e.g. HealthPlus" />
                <InputField name="ownerName" icon="person" placeholder="Owner Full Name" />
                <InputField name="email" icon="email" placeholder="Email Address" keyboardType="email-address" />
                <InputField name="password" icon="lock" placeholder="Create Password" secureTextEntry />
                <InputField name="phone" icon="phone" placeholder="Phone Number" keyboardType="phone-pad" />
                
                {/* Category Picker Placeholder (simplified as TextInput for now) */}
                <InputField name="category" icon="category" placeholder="Category (e.g. PHARMACY)" />

                <InputField name="city" icon="location-city" placeholder="City Name" />
                <InputField name="streetAddress" icon="location-on" placeholder="Full Address" />
                
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>State *</Text>
                  <Controller
                    control={control}
                    name="state"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.inputWrapper}>
                        <View style={styles.inputIconContainer}>
                          <MaterialIcons name="map" size={20} color={C.outline} />
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.input,
                            { justifyContent: 'center' },
                            errors.state && styles.inputError
                          ]}
                          onPress={() => setStateModalVisible(true)}
                        >
                          <Text style={value ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
                            {value || 'Select State'}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.pickerIconContainer}>
                          <MaterialIcons name="expand-more" size={20} color={C.outline} />
                        </View>
                      </View>
                    )}
                  />
                  {errors.state && <Text style={styles.errorText}>{errors.state.message}</Text>}
                </View>

                <InputField name="pincode" icon="pin-drop" placeholder="Pincode" keyboardType="number-pad" maxLength={6} />

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Store Location Coordinates</Text>
                  <TouchableOpacity
                    style={styles.locationBtn}
                    onPress={handleFetchLocation}
                    disabled={fetchingLocation}
                  >
                    <MaterialIcons name="my-location" size={20} color={C.emeraldDeep} />
                    <Text style={styles.locationBtnText}>
                      {fetchingLocation ? "FETCHING..." : coords ? `LAT: ${coords.latitude.toFixed(4)}, LNG: ${coords.longitude.toFixed(4)}` : "GET CURRENT LOCATION"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <View style={styles.submitContainer}>
                  <TouchableOpacity 
                    style={styles.submitBtnContainer}
                    activeOpacity={0.9}
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}
                  >
                    <LinearGradient 
                      colors={[C.emeraldLush, C.emeraldDeep]} 
                      style={styles.submitBtnGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.submitBtnText}>{loading ? 'REGISTERING...' : 'NEXT'}</Text>
                      {!loading && <MaterialIcons name="arrow-forward" size={24} color={C.onPrimary} />}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

              </BlurView>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* State Picker Modal */}
      <Modal visible={stateModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setStateModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={C.onSurfaceVariant} />
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
                  style={styles.stateItem}
                  onPress={() => {
                    setValue('state', item);
                    setStateModalVisible(false);
                    setStateSearch('');
                  }}
                >
                  <Text style={styles.stateItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

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
    alignItems: 'center',
    padding: 16,
    paddingVertical: 32,
  },
  mainContainer: {
    width: '100%',
    maxWidth: 672, // max-w-2xl
    zIndex: 10,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: C.emeraldDeep,
    letterSpacing: -1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.emeraldLush,
    textTransform: 'uppercase',
  },
  glassWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: C.glassBorder,
    shadowColor: C.emeraldDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 4,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.1,
  },
  orbTopRight: {
    top: -128,
    right: -128,
    width: 256,
    height: 256,
    backgroundColor: C.emeraldLush,
  },
  glassCard: {
    padding: 24,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    position: 'relative',
    paddingHorizontal: 16,
  },
  stepperLine: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    height: 4,
    backgroundColor: 'rgba(188, 202, 192, 0.3)',
    borderRadius: 2,
    zIndex: -1,
  },
  stepperLineActive: {
    width: '25%',
    height: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.5)',
    borderRadius: 2,
  },
  step: {
    alignItems: 'center',
    gap: 8,
  },
  stepCircleActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.emeraldDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  stepCircleInactive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(219, 229, 222, 1)',
    borderWidth: 1,
    borderColor: 'rgba(188, 202, 192, 0.5)',
  },
  stepCircleTextActive: {
    color: C.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  stepCircleTextInactive: {
    color: C.onSurfaceVariant,
    fontSize: 16,
    fontWeight: '600',
  },
  stepLabelActive: {
    fontSize: 12,
    fontWeight: '600',
    color: C.emeraldDeep,
  },
  stepLabelInactive: {
    fontSize: 12,
    fontWeight: '600',
    color: C.onSurfaceVariant,
  },
  formHeader: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: C.onBackground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: C.onSurfaceVariant,
    lineHeight: 24,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.onSurface,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIconContainer: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  pickerIconContainer: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    paddingVertical: 12,
    paddingLeft: 40,
    paddingRight: 12,
    fontSize: 16,
    color: C.onBackground,
  },
  inputFocused: {
    borderColor: C.emeraldLush,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: C.error,
  },
  errorText: {
    color: C.error,
    fontSize: 12,
    marginTop: 4,
  },
  pickerTextPlaceholder: {
    color: C.outline,
    fontSize: 16,
  },
  pickerTextSelected: {
    color: C.onBackground,
    fontSize: 16,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: C.emeraldLush,
    borderRadius: 8,
  },
  locationBtnText: {
    color: C.emeraldDeep,
    fontSize: 14,
    fontWeight: '600',
  },
  submitContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: C.glassBorder,
    alignItems: 'flex-end',
  },
  submitBtnContainer: {
    borderRadius: 12,
    shadowColor: C.emeraldDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  submitBtnText: {
    color: C.onPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.onBackground,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  stateItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stateItemText: {
    fontSize: 16,
    color: C.onBackground,
  },
});
