import React from 'react';
import { Text as RNText, TextProps, StyleSheet, TextStyle } from 'react-native';
import { getNunitoFontFamily } from '../../theme/globalFont';

export interface AppTextProps extends TextProps {
  weight?: '400' | '500' | '600' | '700' | '800' | '900' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold' | 'black';
}

const weightMap: Record<string, string> = {
  '400': 'Nunito_400Regular',
  'regular': 'Nunito_400Regular',
  '500': 'Nunito_500Medium',
  'medium': 'Nunito_500Medium',
  '600': 'Nunito_600SemiBold',
  'semiBold': 'Nunito_600SemiBold',
  '700': 'Nunito_700Bold',
  'bold': 'Nunito_700Bold',
  '800': 'Nunito_800ExtraBold',
  'extraBold': 'Nunito_800ExtraBold',
  '900': 'Nunito_900Black',
  'black': 'Nunito_900Black',
};

export const AppText = React.forwardRef<any, AppTextProps>(({ style, weight, ...props }, ref) => {
  const chosenFont = weight ? weightMap[weight] : getNunitoFontFamily(style);
  return (
    <RNText
      ref={ref}
      style={[{ fontFamily: chosenFont }, style]}
      {...props}
    />
  );
});

export default AppText;
