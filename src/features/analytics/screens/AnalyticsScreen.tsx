import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Card } from '../../../components/ui/Card';

export const AnalyticsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Store Analytics</Text>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Daily Summary (Today)</Text>
          <Text style={styles.metricText}>• Orders Accepted: 12</Text>
          <Text style={styles.metricText}>• Orders Rejected: 1</Text>
          <Text style={styles.metricText}>• Avg Preparation Time: 4.2 mins</Text>
          <Text style={styles.metricText}>• Revenue Estimate: ₹4,850</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.text.primary, marginBottom: spacing.lg },
  card: { padding: spacing.lg },
  cardTitle: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.md },
  metricText: { ...typography.body, color: colors.text.primary, marginBottom: spacing.xs },
});
