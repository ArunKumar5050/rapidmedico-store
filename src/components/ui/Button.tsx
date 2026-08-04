import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, components, typography } from '../../theme/tokens';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accept' | 'reject' | 'outline' | 'ghost';
  size?: 'normal' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.background.tertiary;
    switch (variant) {
      case 'accept':
        return colors.action.accept;
      case 'reject':
        return colors.action.reject;
      case 'primary':
        return colors.brand.primary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colors.brand.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.text.muted;
    switch (variant) {
      case 'outline':
        return colors.text.primary;
      case 'reject':
        return colors.text.inverse;
      case 'ghost':
        return colors.brand.primary;
      default:
        return colors.text.inverse;
    }
  };

  const minHeight = size === 'large' ? components.button.minHeightPrimary : components.button.minHeightSecondary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          minHeight,
          borderColor: variant === 'outline' ? colors.border.default : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: components.button.borderRadius,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    ...typography.button,
  },
});
