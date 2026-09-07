import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const minHeight = size === 'large' ? components.button.minHeightPrimary : components.button.minHeightSecondary;

  const getTextColor = () => {
    if (disabled) return colors.text.muted;
    switch (variant) {
      case 'outline':
        return colors.brand.primary;
      case 'ghost':
        return colors.brand.primary;
      default:
        return colors.text.inverse;
    }
  };

  // Gradient variants
  if ((variant === 'primary' || variant === 'accept') && !disabled) {
    const gradColors: [string, string] =
      variant === 'accept'
        ? ['#10B981', '#059669']
        : [colors.brand.secondary, colors.brand.primary];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          {
            borderRadius: components.button.borderRadius,
            minHeight,
            overflow: 'hidden',
            shadowColor: variant === 'accept' ? '#059669' : colors.brand.primaryDark,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 6,
          },
          style,
        ]}
      >
        <LinearGradient
          colors={gradColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientInner, { minHeight }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.text, { color: '#fff' }, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'reject') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.button,
          {
            backgroundColor: disabled ? colors.background.tertiary : colors.action.reject,
            minHeight,
            shadowColor: '#DC2626',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 4,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.text, { color: '#fff' }, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  // outline / ghost / disabled
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? colors.background.tertiary : 'transparent',
          minHeight,
          borderColor: variant === 'outline' ? colors.brand.primary : 'transparent',
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
  gradientInner: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: components.button.borderRadius,
  },
  text: {
    ...typography.button,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
});
