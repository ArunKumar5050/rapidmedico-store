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
            ? [colors.brand.secondary, colors.brand.primary]   // cyan → blue when online
            : ['#94A3B8', '#64748B']                            // slate grey when offline
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
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(255,255,255,0.9)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
