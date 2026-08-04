import React from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { colors, typography, spacing } from '../../theme/tokens';
import { AvailabilityStatus } from '../../types/enums';

interface AvailabilityToggleProps {
  status: AvailabilityStatus;
  onToggle: (newStatus: AvailabilityStatus) => void;
  hasActiveOrders?: boolean;
}

export const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({
  status,
  onToggle,
  hasActiveOrders = false,
}) => {
  const isOnline = status === AvailabilityStatus.Online;

  const handleValueChange = (value: boolean) => {
    const nextStatus = value ? AvailabilityStatus.Online : AvailabilityStatus.Offline;
    if (!value && hasActiveOrders) {
      Alert.alert(
        'Going Offline',
        'You have in-progress orders. Toggling offline will prevent NEW order assignments, but you must complete your existing active orders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go Offline', style: 'destructive', onPress: () => onToggle(nextStatus) },
        ]
      );
    } else {
      onToggle(nextStatus);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: isOnline ? colors.status.success : colors.text.muted }]} />
      <Text style={styles.label}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
      <Switch
        value={isOnline}
        onValueChange={handleValueChange}
        trackColor={{ false: colors.background.tertiary, true: '#A8E0C8' }}
        thumbColor={isOnline ? colors.brand.primary : '#999'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
});
