import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Card } from '../../../components/ui/Card';
import { StorePerformance } from '../../../types/models';
import { FirestoreService } from '../../../services/firebase/firestore';
import { useAuthStore } from '../../../store/useAuthStore';

export const PerformanceDashboardScreen = () => {
  const { storeId } = useAuthStore();
  const [metrics, setMetrics] = useState<StorePerformance>({
    acceptanceRate: 98,
    cancellationRate: 1.2,
    avgPrepTimeMinutes: 4.2,
    latePrepCount: 0,
    responseTimeSeconds: 24,
    reliabilityScore: 96,
    storeRating: 4.8,
    inventoryAccuracy: 99,
  });

  useEffect(() => {
    if (storeId) {
      FirestoreService.getStorePerformance(storeId).then((data) => {
        if (data) setMetrics(data);
      });
    }
  }, [storeId]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Performance & Reliability</Text>
        <Text style={styles.subtitle}>
          Your pharmacy performance score directly feeds the Rapidmedi order routing engine to prioritize order assignments.
        </Text>

        {/* Score Card */}
        <Card style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>OVERALL RELIABILITY SCORE</Text>
          <Text style={styles.scoreBig}>{metrics.reliabilityScore} / 100</Text>
          <Text style={styles.scoreBadge}>⭐ Top Rated Pharmacy Partner</Text>
        </Card>

        {/* Individual Metrics Cards */}
        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>Acceptance Rate</Text>
            <Text style={styles.metricValue}>{metrics.acceptanceRate}%</Text>
          </View>
          <Text style={styles.metricExplanation}>
            Percentage of assigned orders accepted within response window. Target: &gt;95%. High acceptance keeps routing priority high.
          </Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>Avg Preparation Time</Text>
            <Text style={styles.metricValue}>{metrics.avgPrepTimeMinutes} mins</Text>
          </View>
          <Text style={styles.metricExplanation}>
            Average time from accepting an order to marking it ready for pickup. Fast prep minimizes customer waiting time.
          </Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>Response Time</Text>
            <Text style={styles.metricValue}>{metrics.responseTimeSeconds}s</Text>
          </View>
          <Text style={styles.metricExplanation}>
            Average seconds taken to tap Accept or Reject after notification arrives. Faster response means faster assignment.
          </Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>Inventory Accuracy</Text>
            <Text style={styles.metricValue}>{metrics.inventoryAccuracy}%</Text>
          </View>
          <Text style={styles.metricExplanation}>
            Frequency of items requested matching actual store stock. Keep inventory toggles updated to prevent out-of-stock rejections.
          </Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>Cancellation Rate</Text>
            <Text style={styles.metricValue}>{metrics.cancellationRate}%</Text>
          </View>
          <Text style={styles.metricExplanation}>
            Percentage of accepted orders cancelled post-acceptance. Target: &lt;2%.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.text.primary, marginBottom: 2 },
  subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
  scoreCard: { backgroundColor: colors.brand.primaryLight, padding: spacing.xl, borderRadius: 20, alignItems: 'center', marginBottom: spacing.lg },
  scoreLabel: { ...typography.caption, color: colors.brand.primaryDark, fontWeight: '700', letterSpacing: 1 },
  scoreBig: { ...typography.display, fontSize: 48, lineHeight: 56, color: colors.brand.primaryDark, marginVertical: spacing.xs },
  scoreBadge: { ...typography.bodyStrong, color: colors.brand.primaryDark },
  metricCard: { marginBottom: spacing.md, padding: spacing.lg },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  metricTitle: { ...typography.h2, color: colors.text.primary },
  metricValue: { ...typography.h1, color: colors.brand.primary },
  metricExplanation: { ...typography.caption, color: colors.text.secondary, lineHeight: 18 },
});
