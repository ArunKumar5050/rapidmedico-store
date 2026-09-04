import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';

export const SupportScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>RapidMedico Store Support</Text>
        <Text style={styles.subtitle}>Direct assistance for partner pharmacies.</Text>
        <Button title="Call Partner Helpline" onPress={() => alert('Dialing Store Support...')} style={{ marginBottom: spacing.md }} />
        <Button title="Report an Order Issue" variant="outline" onPress={() => alert('Report Issue Form')} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  title: { ...typography.h1, color: colors.text.primary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.xl },
});
