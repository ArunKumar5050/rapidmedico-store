import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
import { RejectionReason } from '../../../types/enums';
import { REJECTION_REASON_LABELS } from '../../../constants/config';
import { useRejectOrder } from '../../../hooks/useRejectOrder';

interface RejectOrderBottomSheetProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RejectOrderBottomSheet: React.FC<RejectOrderBottomSheetProps> = ({
  visible,
  orderId,
  onClose,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<RejectionReason | null>(null);
  const [otherNote, setOtherNote] = useState('');
  const { rejectOrder, loading } = useRejectOrder();

  if (!visible) return null;

  const handleConfirmReject = async () => {
    if (!selectedReason) {
      Alert.alert('Reason Required', 'Please select a rejection reason to return order to routing engine.');
      return;
    }

    if (selectedReason === RejectionReason.Other && otherNote.trim().length < 5) {
      Alert.alert('Validation Error', 'Please enter a note of at least 5 characters explaining why the order is rejected.');
      return;
    }

    const success = await rejectOrder(orderId, selectedReason, otherNote);
    if (success) {
      Alert.alert('Order Rejected', 'The order has been rejected and returned to the routing engine.');
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={styles.bottomSheet}>
          <Text style={styles.title}>Reject Order #{orderId.slice(-6).toUpperCase()}</Text>
          <Text style={styles.subtitle}>Select a reason for rejecting this order:</Text>

          <ScrollView style={styles.reasonsList}>
            {Object.entries(RejectionReason).map(([key, value]) => (
              <TouchableOpacity
                key={value}
                onPress={() => setSelectedReason(value as RejectionReason)}
                style={[
                  styles.reasonOption,
                  selectedReason === value && styles.reasonOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === value && styles.reasonTextSelected,
                  ]}
                >
                  {REJECTION_REASON_LABELS[key as keyof typeof REJECTION_REASON_LABELS]}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedReason === RejectionReason.Other && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Rejection Note (5+ characters) *</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Provide specific reason..."
                  multiline
                  numberOfLines={3}
                  value={otherNote}
                  onChangeText={setOtherNote}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.actionRow}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onClose}
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <Button
              title="CONFIRM REJECTION"
              variant="reject"
              loading={loading}
              onPress={handleConfirmReject}
              style={{ flex: 2 }}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  title: { ...typography.h1, color: colors.text.primary, marginBottom: 2 },
  subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.md },
  reasonsList: { marginVertical: spacing.sm },
  reasonOption: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  reasonOptionSelected: {
    backgroundColor: colors.alert.urgentLight,
    borderColor: colors.action.reject,
  },
  reasonText: { ...typography.bodyStrong, color: colors.text.primary },
  reasonTextSelected: { color: colors.action.reject },
  noteContainer: { marginTop: spacing.md },
  noteLabel: { ...typography.caption, color: colors.text.primary, fontWeight: '700', marginBottom: spacing.xs },
  noteInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: 80,
  },
  actionRow: { flexDirection: 'row', marginTop: spacing.lg },
});
