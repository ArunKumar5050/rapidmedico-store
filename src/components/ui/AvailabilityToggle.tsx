import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  const handlePress = () => {
    const nextStatus = isOnline ? AvailabilityStatus.Offline : AvailabilityStatus.Online;
    if (isOnline && hasActiveOrders) {
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
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
      <LinearGradient
        colors={
          isOnline 
            ? [colors.brand.emeraldLush, colors.brand.primaryDark]
            : [colors.text.muted, colors.text.secondary]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        <View style={[styles.dot, isOnline && styles.dotOnline]} />
        <Text style={styles.label}>{isOnline ? 'Online' : 'Offline'}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    shadowColor: 'rgba(5, 150, 105, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotOnline: {
    backgroundColor: '#ffffff',
    shadowColor: 'rgba(255,255,255,0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});

