import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import { colors, spacing } from '../../theme/tokens';

export const Skeleton: React.FC<{ width?: DimensionValue; height?: number; borderRadius?: number }> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
}) => {
  return <View style={[styles.skeleton, { width, height, borderRadius }]} />;
};

export const DashboardSkeleton = () => (
  <View style={styles.container}>
    <Skeleton height={120} borderRadius={16} />
    <View style={{ height: spacing.lg }} />
    <Skeleton height={80} borderRadius={16} />
    <View style={{ height: spacing.lg }} />
    <Skeleton height={200} borderRadius={16} />
  </View>
);

export const OrderListSkeleton = () => (
  <View style={styles.container}>
    {[1, 2, 3].map((key) => (
      <View key={key} style={styles.cardSkeleton}>
        <Skeleton width="40%" height={24} />
        <View style={{ height: spacing.xs }} />
        <Skeleton width="80%" height={18} />
        <View style={{ height: spacing.md }} />
        <Skeleton height={56} borderRadius={12} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.background.tertiary,
  },
  container: {
    padding: spacing.lg,
  },
  cardSkeleton: {
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
});
