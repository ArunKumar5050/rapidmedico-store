import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { AvailabilityToggle } from '../../../components/ui/AvailabilityToggle';
import { Card } from '../../../components/ui/Card';
import { AvailabilityStatus } from '../../../types/enums';
import { useAuthStore } from '../../../store/useAuthStore';
import { FirestoreService } from '../../../services/firebase/firestore';

import { useOrderStore } from '../../../store/useOrderStore';

export const DashboardScreen = ({ navigation }: any) => {
  const { store, storeId, setAvailability } = useAuthStore();
  const { activeOrders, completedOrders, setActiveOrders, setCompletedOrders } = useOrderStore();
  const availability = store?.availability || AvailabilityStatus.Offline;

  React.useEffect(() => {
    if (!storeId) return;
    const unsubActive = FirestoreService.subscribeActiveOrders(storeId, setActiveOrders);
    const unsubHistory = FirestoreService.subscribeOrderHistory(storeId, setCompletedOrders);
    return () => {
      unsubActive();
      unsubHistory();
    };
  }, [storeId, setActiveOrders, setCompletedOrders]);

  const handleToggleAvailability = (newStatus: AvailabilityStatus) => {
    setAvailability(newStatus);
    if (storeId) {
      FirestoreService.updateStoreAvailability(storeId, newStatus).catch((err) =>
        console.warn('[DashboardScreen] Availability update error:', err)
      );
    }
  };

  const totalOrders = activeOrders.length + completedOrders.length;
  const acceptedOrders = activeOrders.filter(o => o.status !== OrderStatus.New).length + completedOrders.filter(o => o.status === OrderStatus.Completed).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={styles.storeName} numberOfLines={1}>
              {store?.businessName || 'Pharmacy Store'}
            </Text>
            <Text style={styles.storeLocation}>
              {store?.city ? `${store.city}` : 'Partner Store'}
            </Text>
          </View>
          <AvailabilityToggle status={availability} onToggle={handleToggleAvailability} />
        </View>

        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Today's Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{acceptedOrders}</Text>
              <Text style={styles.statLabel}>Accepted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.2m</Text>
              <Text style={styles.statLabel}>Avg Prep</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('OrdersTab')}>
            <Text style={styles.actionText}>📦 Manage Assigned Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('InventoryTab')}>
            <Text style={styles.actionText}>💊 Update Stock / Inventory</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  storeName: { ...typography.h1, color: colors.text.primary },
  storeLocation: { ...typography.caption, color: colors.text.secondary },
  summaryCard: { backgroundColor: colors.brand.primaryLight, padding: spacing.lg, borderRadius: 16, marginBottom: spacing.lg },
  cardTitle: { ...typography.h2, color: colors.brand.primaryDark, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statNumber: { ...typography.display, color: colors.text.primary },
  statLabel: { ...typography.caption, color: colors.text.secondary },
  section: { marginTop: spacing.md },
  sectionTitle: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.md },
  actionRow: { backgroundColor: colors.background.secondary, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
  actionText: { ...typography.bodyStrong, color: colors.text.primary },
});
