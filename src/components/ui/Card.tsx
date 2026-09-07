import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, components, spacing } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'flat' | 'outlined' | 'elevated';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'flat' }) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'outlined' && styles.outlined,
        variant === 'elevated' && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: components.card.borderRadius,
    padding: components.card.padding,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 182, 0.08)',
  },
  outlined: {
    backgroundColor: colors.background.primary,
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  elevated: {
    backgroundColor: '#FFFFFF',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 182, 0.06)',
  },
});
