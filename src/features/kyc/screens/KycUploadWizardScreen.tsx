import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
import { DocumentUploadTile } from '../../../components/ui/DocumentUploadTile';
import { KycDocumentType, KycStatus } from '../../../types/enums';
import { useKycUpload } from '../../../hooks/useKycUpload';
import { useAuthStore } from '../../../store/useAuthStore';
import { FirestoreService } from '../../../services/firebase/firestore';

export const KycUploadWizardScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1); // Steps 1 to 5
  const { storeId, setKycStatus } = useAuthStore();
  const { uploadDocument, submitKycPackage, uploading } = useKycUpload();

  // Form State across steps
  const [drugLicenseNo, setDrugLicenseNo] = useState('');
  const [drugLicenseExpiry, setDrugLicenseExpiry] = useState('2028-12-31');
  const [drugLicenseUri, setDrugLicenseUri] = useState<string | null>(null);

  const [panNumber, setPanNumber] = useState('');
  const [panUri, setPanUri] = useState<string | null>(null);

  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarUri, setAadhaarUri] = useState<string | null>(null);

  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [chequeUri, setChequeUri] = useState<string | null>(null);

  const [shopPhotoUri, setShopPhotoUri] = useState<string | null>(null);
  const [ownerPhotoUri, setOwnerPhotoUri] = useState<string | null>(null);

  const handleNextStep = () => {
    if (step === 1 && (!drugLicenseNo || !drugLicenseUri)) {
      Alert.alert('Incomplete Step', 'Please enter license number and attach Drug License document.');
      return;
    }
    if (step === 2 && (!panNumber || !panUri)) {
      Alert.alert('Incomplete Step', 'Please enter PAN number and attach PAN document.');
      return;
    }
    if (step === 3 && (!aadhaarNumber || !aadhaarUri)) {
      Alert.alert('Incomplete Step', 'Please enter 12-digit Aadhaar number and attach document.');
      return;
    }
    if (step === 4 && (!accountNumber || !ifscCode || !chequeUri)) {
      Alert.alert('Incomplete Step', 'Please enter bank account details and attach cancelled cheque photo.');
      return;
    }

    if (step < 5) {
      setStep(step + 1);
    } else {
      handleSubmitFinalPackage();
    }
  };

  const handleSubmitFinalPackage = async () => {
    try {
      if (!storeId) {
        // Fallback for dev mode
        setKycStatus(KycStatus.PendingReview);
        navigation.replace('KycPending');
        return;
      }

      // Upload files and create document records
      const kycPackage = {
        drugLicense: { number: drugLicenseNo, expiry: drugLicenseExpiry, uri: drugLicenseUri },
        pan: { number: panNumber, uri: panUri },
        aadhaar: { number: aadhaarNumber, uri: aadhaarUri },
        bank: { account: accountNumber, ifsc: ifscCode, holder: accountHolder, chequeUri },
        photos: { shopPhotoUri, ownerPhotoUri },
      };

      await submitKycPackage(kycPackage);
      await FirestoreService.createStoreProfile({ storeId, kycStatus: KycStatus.PendingReview });
      setKycStatus(KycStatus.PendingReview);

      Alert.alert('KYC Package Submitted', 'Your documents have been submitted for review.');
      navigation.replace('KycPending');
    } catch (error: any) {
      Alert.alert('Submission Error', error.message || 'Failed to submit KYC package');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepHeader}>STEP {step} OF 5</Text>
        <Text style={styles.stepTitle}>
          {step === 1 && 'Drug License Details'}
          {step === 2 && 'PAN Card Verification'}
          {step === 3 && 'Aadhaar Card Verification'}
          {step === 4 && 'Bank Details & Cancelled Cheque'}
          {step === 5 && 'Shop & Owner Photos'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View>
            <Text style={styles.label}>Drug License Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. KA-BNG-2024-DL12345"
              value={drugLicenseNo}
              onChangeText={setDrugLicenseNo}
            />
            <Text style={styles.label}>License Expiry Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="2028-12-31"
              value={drugLicenseExpiry}
              onChangeText={setDrugLicenseExpiry}
            />
            <DocumentUploadTile
              title="Drug License Copy"
              docType={KycDocumentType.DrugLicense}
              description="Clear photo or scan of valid state pharmacy license"
              imageUri={drugLicenseUri}
              onImageSelected={setDrugLicenseUri}
            />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.label}>PAN Card Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ABCDE1234F"
              value={panNumber}
              onChangeText={(text) => setPanNumber(text.toUpperCase())}
              maxLength={10}
            />
            <DocumentUploadTile
              title="PAN Card Photo"
              docType={KycDocumentType.Pan}
              imageUri={panUri}
              onImageSelected={setPanUri}
            />
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.label}>Aadhaar Number (12 digits) *</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012"
              keyboardType="number-pad"
              maxLength={12}
              value={aadhaarNumber}
              onChangeText={setAadhaarNumber}
            />
            <DocumentUploadTile
              title="Aadhaar Card Front Photo"
              docType={KycDocumentType.Aadhaar}
              imageUri={aadhaarUri}
              onImageSelected={setAadhaarUri}
            />
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={styles.label}>Bank Account Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="9-18 digit account number"
              keyboardType="number-pad"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
            <Text style={styles.label}>IFSC Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. SBIN0001234"
              value={ifscCode}
              onChangeText={(t) => setIfscCode(t.toUpperCase())}
            />
            <Text style={styles.label}>Account Holder Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="As printed on bank records"
              value={accountHolder}
              onChangeText={setAccountHolder}
            />
            <DocumentUploadTile
              title="Cancelled Cheque or Passbook Photo"
              docType={KycDocumentType.CancelledCheque}
              imageUri={chequeUri}
              onImageSelected={setChequeUri}
            />
          </View>
        )}

        {step === 5 && (
          <View>
            <DocumentUploadTile
              title="Shop Storefront Photo"
              docType={KycDocumentType.ShopPhoto}
              description="Front view showing pharmacy signboard"
              imageUri={shopPhotoUri}
              onImageSelected={setShopPhotoUri}
            />
            <DocumentUploadTile
              title="Owner Photo"
              docType={KycDocumentType.OwnerPhoto}
              description="Clear portrait photo of pharmacy owner"
              imageUri={ownerPhotoUri}
              onImageSelected={setOwnerPhotoUri}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <Button
            title="Back"
            variant="outline"
            onPress={() => setStep(step - 1)}
            style={{ flex: 1, marginRight: spacing.sm }}
          />
        )}
        <Button
          title={step === 5 ? 'SUBMIT KYC PACKAGE' : 'NEXT STEP →'}
          onPress={handleNextStep}
          loading={uploading}
          style={{ flex: 2 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { padding: spacing.lg, backgroundColor: colors.background.secondary, borderBottomWidth: 1, borderBottomColor: colors.border.default },
  stepHeader: { ...typography.caption, color: colors.brand.primary, fontWeight: '700', fontFamily: 'Nunito_700Bold' },
  stepTitle: { ...typography.h2, color: colors.text.primary, marginTop: 2 },
  content: { padding: spacing.lg },
  label: { ...typography.bodyStrong, color: colors.text.primary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  footer: { padding: spacing.lg, flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border.default },
});
