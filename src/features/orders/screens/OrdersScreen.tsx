import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { OrderStatus } from '../../../types/enums';
import { FirestoreService } from '../../../services/firebase/firestore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useOrderStore } from '../../../store/useOrderStore';

export const OrdersScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<OrderStatus>(OrderStatus.New);
  const [loading, setLoading] = useState(true);
  const { storeId } = useAuthStore();
  const { activeOrders, setActiveOrders } = useOrderStore();

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    const unsubscribe = FirestoreService.subscribeActiveOrders(storeId, (orders) => {
      setActiveOrders(orders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [storeId, setActiveOrders]);

  const filteredOrders = activeOrders.filter((o) => o.status === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders Pipeline</Text>
      </View>

      <View style={styles.tabsRow}>
        {[OrderStatus.New, OrderStatus.Accepted, OrderStatus.Preparing, OrderStatus.Ready, OrderStatus.Completed].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setActiveTab(status)}
            style={[styles.tab, activeTab === status && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === status && styles.activeTabText]}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders in this status.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}>
              <Card style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.orderId}>{item.id}</Text>
                  <Badge label={item.status} status={item.status} />
                </View>
                <Text style={styles.customerName}>Customer: {item.customerFirstName}</Text>
                <Text style={styles.itemsCount}>{item.items?.length || 0} Medicines requested</Text>
                {item.prescriptionUrls && item.prescriptionUrls.length > 0 && <Text style={styles.prescriptionTag}>📄 Prescription Included</Text>}
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { ...typography.h1, color: colors.text.primary },
  tabsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginVertical: spacing.md },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 16, marginRight: spacing.xs, backgroundColor: colors.background.secondary },
  activeTab: { backgroundColor: colors.brand.primary },
  tabText: { ...typography.caption, color: colors.text.secondary },
  activeTabText: { color: colors.text.inverse, fontWeight: '700' },
  list: { padding: spacing.lg },
  orderCard: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  orderId: { ...typography.h2, color: colors.text.primary },
  customerName: { ...typography.body, color: colors.text.primary, marginBottom: 2 },
  itemsCount: { ...typography.caption, color: colors.text.secondary },
  prescriptionTag: { ...typography.caption, color: colors.brand.primary, marginTop: spacing.xs, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.text.secondary },
});
