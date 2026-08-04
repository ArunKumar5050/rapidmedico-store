import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '../../theme/tokens';
import { OrderStatus, KycStatus } from '../../types/enums';

interface BadgeProps {
  label: string;
  status?: OrderStatus | KycStatus | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, status = 'neutral', style }) => {
  const getColors = () => {
    switch (status) {
      case OrderStatus.New:
      case 'warning':
      case KycStatus.PendingReview:
        return { bg: colors.status.warningLight, text: colors.status.warning };
      case OrderStatus.Accepted:
      case OrderStatus.Preparing:
      case OrderStatus.Ready:
      case OrderStatus.Completed:
      case 'success':
      case KycStatus.Approved:
        return { bg: '#E6F4EA', text: colors.status.success };
      case OrderStatus.Rejected:
      case OrderStatus.TimedOut:
      case 'error':
      case KycStatus.Rejected:
      case KycStatus.SuspendedExpired:
        return { bg: colors.alert.urgentLight, text: colors.alert.urgent };
      case 'info':
        return { bg: '#E8F0FE', text: colors.status.info };
      default:
        return { bg: colors.background.tertiary, text: colors.text.secondary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
