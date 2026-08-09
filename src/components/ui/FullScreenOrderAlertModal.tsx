import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../theme/tokens';
import { Button } from './Button';
import { StoreOrder } from '../../types/models';
import { orderAlertService } from '../../services/alert/orderAlertService';

interface FullScreenOrderAlertModalProps {
  visible: boolean;
  order: StoreOrder | null;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
}

export const FullScreenOrderAlertModal: React.FC<FullScreenOrderAlertModalProps> = ({
  visible,
  order,
  onAccept,
  onReject,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(90);

  useEffect(() => {
    if (visible && order) {
      // Calculate initial countdown
      const expireTime = new Date(order.respondByAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expireTime - now) / 1000));
      setSecondsRemaining(diff || 90);

      // Start alert sound/vibration
      orderAlertService.startForegroundAlert({
        orderId: order.id,
        customerFirstName: order.customerFirstName,
        itemCount: order.items.length,
        hasPrescription: !!(order.prescriptionUrls && order.prescriptionUrls.length > 0),
        respondByAt: order.respondByAt,
      });

      const interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            orderAlertService.stopAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
        orderAlertService.stopAlert();
      };
    }
  }, [visible, order]);

  if (!visible || !order) return null;

  const handleAcceptPress = () => {
    orderAlertService.stopAlert();
    onAccept(order.id);
  };

  const handleRejectPress = () => {
    orderAlertService.stopAlert();
    onReject(order.id);
  };

  const isNearExpiry = secondsRemaining <= 30;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.badgeText}>🔔 NEW ASSIGNED ORDER</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>

          <View style={[styles.timerContainer, isNearExpiry && styles.timerUrgent]}>
            <Text style={[styles.timerNumber, isNearExpiry && styles.timerNumberUrgent]}>
              {secondsRemaining}s
            </Text>
            <Text style={styles.timerLabel}>Response Time Remaining</Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailRow}>
              <Text style={styles.detailTitle}>Customer: </Text>
              {order.customerFirstName}
            </Text>
            <Text style={styles.detailTitle}>Requested Medicines ({order.items.length}):</Text>
            <View style={styles.itemsList}>
              {order.items.map((i, idx) => (
                <Text key={idx} style={styles.itemBullet}>
                  • {i.name}  <Text style={{ fontWeight: '700' }}>x{i.quantity}</Text>
                </Text>
              ))}
            </View>
            {order.prescriptionUrls && order.prescriptionUrls.length > 0 && (
              <Text style={styles.prescriptionBadge}>📄 Prescription Attached</Text>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="ACCEPT ORDER"
            variant="accept"
            size="large"
            onPress={handleAcceptPress}
            style={styles.actionButton}
          />
          <View style={{ height: spacing.md }} />
          <Button
            title="Reject Order"
            variant="reject"
            size="large"
            onPress={handleRejectPress}
            style={styles.actionButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.alert.urgentLight,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.alert.urgent,
  },
  badgeText: {
    ...typography.h2,
    color: colors.text.inverse,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderId: {
    ...typography.display,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  timerContainer: {
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  timerUrgent: {
    borderColor: colors.alert.urgent,
    backgroundColor: '#FFF0F0',
  },
  timerNumber: {
    ...typography.display,
    fontSize: 48,
    lineHeight: 56,
    color: colors.brand.primary,
  },
  timerNumberUrgent: {
    color: colors.alert.urgent,
  },
  timerLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  detailsCard: {
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    borderRadius: 16,
    width: '100%',
  },
  detailRow: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  detailTitle: {
    ...typography.bodyStrong,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  itemsList: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  itemBullet: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: 4,
  },
  prescriptionBadge: {
    ...typography.bodyStrong,
    color: colors.brand.primary,
    marginTop: spacing.sm,
  },
  footer: {
    padding: spacing.xl,
  },
  actionButton: {
    width: '100%',
  },
});
