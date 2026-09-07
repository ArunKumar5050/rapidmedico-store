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

// Global monkey-patch for React Native's Text & TextInput in Metro
try {
  const TextModule = require('react-native/Libraries/Text/Text');
  const OriginalText = TextModule.default;
  if (OriginalText && !(OriginalText as any).__isNunitoPatched) {
    const PatchedText = React.forwardRef((props: any, ref: any) => {
      const resolvedFont = getNunitoFontFamily(props?.style);
      const combinedStyle = [{ fontFamily: resolvedFont }, props?.style];
      return React.createElement(OriginalText, {
        ...props,
        style: combinedStyle,
        ref,
      });
    });
    (PatchedText as any).__isNunitoPatched = true;
    // Preserve static properties if any
    Object.assign(PatchedText, OriginalText);
    TextModule.default = PatchedText;
  }
} catch (e) {
  console.warn('[GlobalFont] Notice: Could not patch TextModule:', e);
}

try {
  const TextInputModule = require('react-native/Libraries/Components/TextInput/TextInput');
  const OriginalTextInput = TextInputModule.default;
  if (OriginalTextInput && !(OriginalTextInput as any).__isNunitoPatched) {
    const PatchedTextInput = React.forwardRef((props: any, ref: any) => {
      const resolvedFont = getNunitoFontFamily(props?.style);
      const combinedStyle = [{ fontFamily: resolvedFont }, props?.style];
      return React.createElement(OriginalTextInput, {
        ...props,
        style: combinedStyle,
        ref,
      });
    });
    (PatchedTextInput as any).__isNunitoPatched = true;
    Object.assign(PatchedTextInput, OriginalTextInput);
    TextInputModule.default = PatchedTextInput;
  }
} catch (e) {
  console.warn('[GlobalFont] Notice: Could not patch TextInputModule:', e);
}
