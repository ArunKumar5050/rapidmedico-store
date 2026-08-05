import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { KycStatus, KycDocumentType } from '../../../types/enums';
import { useAuthStore } from '../../../store/useAuthStore';
import { FirestoreService } from '../../../services/firebase/firestore';

export const KycStatusScreen = ({ navigation }: any) => {
  const { store, storeId, setKycStatus } = useAuthStore();
  const [docStatuses, setDocStatuses] = useState<any[]>([]);

  useEffect(() => {
    if (storeId) {
      const unsub = FirestoreService.subscribeKycDocs(storeId, (docs) => {
        if (docs) {
          setDocStatuses(docs);
        }
      });
      return () => unsub();
    }
  }, [storeId]);

  const isApproved = store?.kycStatus === KycStatus.Approved;
  const isNotStarted = store?.kycStatus === KycStatus.NotStarted || (!isApproved && docStatuses.length === 0);

  const handleSimulateApproval = () => {
    setKycStatus(KycStatus.Approved);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusHeader}>
          <Badge
            label={isApproved ? 'KYC APPROVED' : isNotStarted ? 'KYC NOT STARTED' : 'KYC UNDER REVIEW'}
            status={isApproved ? KycStatus.Approved : isNotStarted ? KycStatus.NotStarted : KycStatus.PendingReview}
          />
          <Text style={styles.title}>
            {isApproved
              ? 'Pharmacy Account Active'
              : isNotStarted
              ? 'KYC Verification Required'
              : 'Verification In Progress'}
          </Text>
          <Text style={styles.subtitle}>
            {isApproved
              ? 'Your pharmacy is fully verified and ready to accept delivery orders.'
              : isNotStarted
              ? 'Please submit your Drug License, PAN, Aadhaar, Bank Details, and Shop photo to get verified.'
              : 'Our operations team is verifying your license and tax records. Estimated turnaround: 2-4 hours.'}
          </Text>
        </View>

        {isNotStarted && (
          <Button
            title="FILL & UPLOAD KYC DOCUMENTS"
            size="large"
            onPress={() => navigation.navigate('KycUploadWizard')}
            style={{ marginBottom: spacing.lg }}
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uploaded Documents Status</Text>
          {docStatuses.length === 0 ? (
            <Text style={styles.expiryText}>No documents uploaded yet. Tap the button above to upload.</Text>
          ) : (
            docStatuses.map((docItem, idx) => (
              <View key={idx} style={styles.docRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docName}>{docItem.type}</Text>
                  {docItem.expiryDate && (
                    <Text style={styles.expiryText}>Expires: {docItem.expiryDate}</Text>
                  )}
                  {docItem.rejectionReason && (
                    <Text style={styles.rejectionReason}>Reason: {docItem.rejectionReason}</Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Badge
                    label={docItem.status}
                    status={docItem.status === 'APPROVED' ? KycStatus.Approved : KycStatus.PendingReview}
                  />
                  {docItem.status === 'REJECTED' && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('KycReupload', { docType: docItem.type })}
                      style={styles.reuploadBtn}
                    >
                      <Text style={styles.reuploadText}>Re-upload</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {!isApproved && (
          <Button
            title="Simulate Instant Approval (Dev)"
            variant="accept"
            onPress={handleSimulateApproval}
            style={styles.devBtn}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg },
  statusHeader: { backgroundColor: colors.background.secondary, padding: spacing.xl, borderRadius: 16, alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typography.h1, color: colors.text.primary, marginTop: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs },
  section: { backgroundColor: colors.background.secondary, padding: spacing.lg, borderRadius: 16, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.md },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border.default },
  docName: { ...typography.bodyStrong, color: colors.text.primary },
  expiryText: { ...typography.caption, color: colors.text.secondary },
  rejectionReason: { ...typography.caption, color: colors.action.reject, fontWeight: '600', marginTop: 2 },
  reuploadBtn: { marginTop: spacing.xs },
  reuploadText: { ...typography.caption, color: colors.brand.primary, fontWeight: '700' },
  devBtn: { marginTop: spacing.md },
});
