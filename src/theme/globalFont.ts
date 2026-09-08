import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';

/**
 * Maps fontWeight to the corresponding Nunito font family variant.
 * If a fontFamily is already explicitly defined, it is preserved.
 */
export const getNunitoFontFamily = (style: any): string => {
  if (!style) return 'Nunito_400Regular';
  try {
    const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
    if (flattened?.fontFamily) {
      return flattened.fontFamily;
    }
    const weight = flattened?.fontWeight;
    switch (weight) {
      case '900':
        return 'Nunito_900Black';
      case '800':
        return 'Nunito_800ExtraBold';
      case '700':
      case 'bold':
        return 'Nunito_700Bold';
      case '600':
        return 'Nunito_600SemiBold';
      case '500':
        return 'Nunito_500Medium';
      case '100':
      case '200':
      case '300':
      case '400':
      case 'normal':
      default:
        return 'Nunito_400Regular';
    }
  } catch {
    return 'Nunito_400Regular';
  }
};

// Global monkey-patching has been removed because it causes crashes in newer React Native versions.
// Please use the AppText component instead.
