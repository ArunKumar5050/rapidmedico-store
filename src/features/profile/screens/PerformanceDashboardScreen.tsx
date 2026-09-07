import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Card } from '../../../components/ui/Card';
import { FirestoreService } from '../../../services/firebase/firestore';
import { useAuthStore } from '../../../store/useAuthStore';
import { OrderStatus } from '../../../types/enums';

type Timeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export const PerformanceDashboardScreen = () => {
  const { storeId } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('DAILY');

  useEffect(() => {
    if (storeId) {
      FirestoreService.fetchOrdersForMetrics(storeId).then((data) => {
        setOrders(data);
        setLoading(false);
      });
    }
  }, [storeId]);

  const metrics = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    if (timeframe === 'DAILY') {
      startDate.setHours(0,0,0,0);
    } else if (timeframe === 'WEEKLY') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'MONTHLY') {
      startDate.setMonth(now.getMonth() - 1);
    }

    const filteredOrders = orders.filter(o => {
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || o.assignedAt || 0);
      return orderDate >= startDate;
    });

    let completedOrdersCount = 0;
    let cancelledOrdersCount = 0;
    let totalRevenue = 0;

    filteredOrders.forEach(o => {
      if (o.status === 'completed' || o.storeStatus === OrderStatus.Completed) {
        completedOrdersCount++;
        totalRevenue += (o.billAmount || 0);
      } else if (o.status === 'cancelled' || o.storeStatus === OrderStatus.Rejected) {
        cancelledOrdersCount++;
      }
    });

    const avgOrderValue = completedOrdersCount > 0 ? (totalRevenue / completedOrdersCount) : 0;

    return {
      totalRevenue,
      completedOrdersCount,
      cancelledOrdersCount,
      avgOrderValue
    };
  }, [orders, timeframe]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Metrics Dashboard</Text>
      </View>

      <View style={styles.tabsRow}>
        {(['DAILY', 'WEEKLY', 'MONTHLY'] as Timeframe[]).map((tf) => (
          <TouchableOpacity
            key={tf}
            onPress={() => setTimeframe(tf)}
            style={[styles.tab, timeframe === tf && styles.activeTab]}
          >
            <Text style={[styles.tabText, timeframe === tf && styles.activeTabText]}>{tf}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Revenue Card */}
          <Card style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>TOTAL REVENUE ({timeframe})</Text>
            <Text style={styles.scoreBig}>₹{metrics.totalRevenue.toFixed(2)}</Text>
          </Card>

          {/* Individual Metrics Cards */}
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Completed Orders</Text>
              <Text style={styles.metricValue}>{metrics.completedOrdersCount}</Text>
            </View>
            <Text style={styles.metricExplanation}>
              Total number of successfully billed and completed orders.
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Average Order Value</Text>
              <Text style={styles.metricValue}>₹{metrics.avgOrderValue.toFixed(2)}</Text>
            </View>
            <Text style={styles.metricExplanation}>
              The average amount a customer spends per completed order.
            </Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Cancelled / Rejected</Text>
              <Text style={styles.metricValue}>{metrics.cancelledOrdersCount}</Text>
            </View>
            <Text style={styles.metricExplanation}>
              Number of orders cancelled by customer or rejected by your store.
            </Text>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  content: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.text.primary, marginBottom: 2 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginVertical: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: 8, backgroundColor: colors.background.secondary, marginHorizontal: 4 },
  activeTab: { backgroundColor: colors.brand.primary },
  tabText: { ...typography.caption, color: colors.text.secondary },
  activeTabText: { color: colors.text.inverse, fontWeight: '700', fontFamily: 'Nunito_700Bold' },
  scoreCard: { backgroundColor: colors.brand.primaryLight, padding: spacing.xl, borderRadius: 20, alignItems: 'center', marginBottom: spacing.lg },
  scoreLabel: {
    ...typography.caption,
    color: colors.brand.primaryDark,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 1,
  },
  scoreBig: { ...typography.display, fontSize: 48, lineHeight: 56, color: colors.brand.primaryDark, marginVertical: spacing.xs },
  metricCard: { marginBottom: spacing.md, padding: spacing.lg },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  metricTitle: { ...typography.h2, color: colors.text.primary },
  metricValue: { ...typography.h1, color: colors.brand.primary },
  metricExplanation: { ...typography.caption, color: colors.text.secondary, lineHeight: 18 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
