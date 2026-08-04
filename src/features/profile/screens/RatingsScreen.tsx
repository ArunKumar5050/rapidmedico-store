import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';

export const RatingsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Store Ratings & Reviews</Text>
        <Text style={styles.ratingBig}>4.8 ★</Text>
        <Text style={styles.subtitle}>Based on 142 completed customer orders</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.h1, color: colors.text.primary, marginBottom: spacing.md },
  ratingBig: { ...typography.display, fontSize: 56, lineHeight: 64, color: colors.brand.primary },
  subtitle: { ...typography.body, color: colors.text.secondary, marginTop: spacing.xs },
});
