import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../theme/tokens';
import { OrderStatus } from '../../../types/enums';
import { StoreOrder } from '../../../types/models';
import { useAuthStore } from '../../../store/useAuthStore';
import { useOrderStore } from '../../../store/useOrderStore';

export const OrdersScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [loading, setLoading] = useState(false);
  const { storeId } = useAuthStore();
  const { activeOrders, completedOrders } = useOrderStore();

  // Deduplicate orders by ID across active and completed lists
  const orderMap = new Map<string, StoreOrder>();
  [...activeOrders, ...completedOrders].forEach(o => orderMap.set(o.id, o));
  const allOrders = Array.from(orderMap.values());

  const newCount = allOrders.filter(o =>
    [OrderStatus.New, OrderStatus.PendingDoctorConfirmation, OrderStatus.Accepted].includes(o.status)
  ).length;
  const prepCount = allOrders.filter(o =>
    [OrderStatus.Preparing, OrderStatus.Ready].includes(o.status)
  ).length;
  const deliveryCount = allOrders.filter(o =>
    [
      OrderStatus.DeliveryRequested,
      OrderStatus.DeliveryPartnerAssigned,
      OrderStatus.OutOfDelivery,
      OrderStatus.PickedUp,
    ].includes(o.status) || Boolean(o.deliveryPartnerId)
  ).length;
  const completedCount = allOrders.filter(o => o.status === OrderStatus.Completed).length;

  const tabs = [
    { id: 'All', label: `All (${allOrders.length})` },
    { id: 'New', label: `New / Billed (${newCount})` },
    { id: 'Preparing', label: `Preparing (${prepCount})` },
    { id: 'Delivery', label: `Delivery (${deliveryCount})` },
    { id: 'Completed', label: `Done (${completedCount})` },
  ];

  const filteredOrders = allOrders.filter(o => {
    if (activeTab === 'All') return true;
    if (activeTab === 'New')
      return [OrderStatus.New, OrderStatus.PendingDoctorConfirmation, OrderStatus.Accepted].includes(o.status);
    if (activeTab === 'Preparing')
      return [OrderStatus.Preparing, OrderStatus.Ready].includes(o.status);
    if (activeTab === 'Delivery') {
      return [
        OrderStatus.DeliveryRequested,
        OrderStatus.DeliveryPartnerAssigned,
        OrderStatus.OutOfDelivery,
        OrderStatus.PickedUp,
      ].includes(o.status) || Boolean(o.deliveryPartnerId);
    }
    if (activeTab === 'Completed') return o.status === OrderStatus.Completed;
    return true;
  });

  const getStatusBadgeStyle = (item: StoreOrder) => {
    const isAwaitingOtp =
      item.status === OrderStatus.DeliveryPartnerAssigned ||
      (Boolean(item.deliveryPartnerId) && !item.storeOtpConfirmed && !item.storePickupOtpVerified);

    if (isAwaitingOtp) {
      return {
        bg: '#FEF3C7',
        text: '#B45309',
        border: '#F59E0B',
        label: '🛵 RIDER AT STORE (OTP NEEDED)',
      };
    }

    switch (item.status) {
      case OrderStatus.New:
      case OrderStatus.PendingDoctorConfirmation:
        return { bg: '#FFF7ED', text: '#C2410C', border: 'rgba(251,146,60,0.3)', label: 'NEW ORDER' };
      case OrderStatus.Accepted:
        return { bg: '#EFF6FF', text: '#1D4ED8', border: 'rgba(99,102,241,0.25)', label: 'BILLED' };
      case OrderStatus.Preparing:
        return { bg: '#DBEAFE', text: '#1E40AF', border: 'rgba(59,130,246,0.25)', label: 'PREPARING' };
      case OrderStatus.Ready:
        return { bg: '#E0F2FE', text: '#0369A1', border: 'rgba(14,165,233,0.3)', label: 'READY' };
      case OrderStatus.DeliveryRequested:
        return { bg: '#FEF3C7', text: '#B45309', border: 'rgba(245,158,11,0.3)', label: 'FINDING RIDER...' };
      case OrderStatus.OutOfDelivery:
      case OrderStatus.PickedUp:
        return { bg: '#F0F9FF', text: '#0077B6', border: 'rgba(0,119,182,0.25)', label: 'OUT FOR DELIVERY' };
      case OrderStatus.Completed:
        return { bg: '#D1FAE5', text: '#065F46', border: 'rgba(16,185,129,0.3)', label: 'DELIVERED' };
      case OrderStatus.Rejected:
        return { bg: '#FEE2E2', text: '#991B1B', border: 'rgba(239,68,68,0.25)', label: 'REJECTED' };
      default:
        return {
          bg: '#F8FAFC',
          text: colors.text.secondary,
          border: 'rgba(0,0,0,0.08)',
          label: String(item.status).replace(/_/g, ' '),
        };
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Orders Pipeline</Text>
            <Text style={styles.subtitle}>Manage prescriptions in real time</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{allOrders.length}</Text>
          </View>
        </View>

        {/* Tab Pills */}
        <View style={styles.tabsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return isActive ? (
                <LinearGradient
                  key={tab.id}
                  colors={[colors.brand.secondary, colors.brand.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.tab, styles.activeTab]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setActiveTab(tab.id)}
                    style={styles.tabInner}
                  >
                    <Text style={[styles.tabText, styles.activeTabText]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab(tab.id)}
                  style={[styles.tab, styles.inactiveTab]}
                >
                  <Text style={styles.tabText}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="inbox" size={36} color={colors.brand.primaryLight} />
            </View>
            <Text style={styles.emptyTitle}>No orders here</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab !== 'All' ? 'No orders in this stage.' : 'Orders will appear here in real time.'}
            </Text>
            {activeTab !== 'All' && (
              <TouchableOpacity onPress={() => setActiveTab('All')} style={styles.emptyAction}>
                <Text style={styles.emptyActionText}>View All Orders</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const timeStr = new Date(item.assignedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const medList =
                item.items?.map((i: any) => i.name).filter(Boolean).join(', ') || 'Prescription Order';
              const badgeStyle = getStatusBadgeStyle(item);
              const isAwaitingOtp =
                item.status === OrderStatus.DeliveryPartnerAssigned ||
                (Boolean(item.deliveryPartnerId) && !item.storeOtpConfirmed && !item.storePickupOtpVerified);

              return (
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                  style={[styles.orderCard, isAwaitingOtp && styles.orderCardUrgent]}
                >
                  {/* Left accent bar */}
                  <View
                    style={[
                      styles.accentBar,
                      { backgroundColor: isAwaitingOtp ? '#F59E0B' : colors.brand.primary },
                    ]}
                  />

                  <View style={styles.orderCardContent}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.customerInfoRow}>
                        <View style={styles.avatarContainer}>
                          <Image
                            source={{
                              uri:
                                'https://ui-avatars.com/api/?name=' +
                                encodeURIComponent(item.customerFirstName || 'User') +
                                '&background=0077B6&color=fff',
                            }}
                            style={styles.avatar}
                          />
                        </View>
                        <View>
                          <Text style={styles.customerName}>
                            {item.customerFirstName || 'Customer'}
                          </Text>
                          <View style={styles.timeRow}>
                            <MaterialIcons name="schedule" size={13} color={colors.text.muted} />
                            <Text style={styles.timeText}>{timeStr}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Status badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
                        ]}
                      >
                        <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                          {badgeStyle.label}
                        </Text>
                      </View>
                    </View>

                    {/* Rider alert */}
                    {isAwaitingOtp && item.deliveryPartnerName ? (
                      <View style={styles.riderAlert}>
                        <Text style={styles.riderAlertText}>
                          🛵 Rider: {item.deliveryPartnerName}
                          {item.deliveryPartnerPhone ? ` · ${item.deliveryPartnerPhone}` : ''}
                        </Text>
                        <Text style={styles.riderAlertSub}>
                          Partner waiting at store. Enter pickup OTP to hand over.
                        </Text>
                      </View>
                    ) : null}

                    {/* Medicine list */}
                    <View style={styles.rxContainer}>
                      <Text style={styles.rxLabel}>Rx: </Text>
                      <Text style={styles.rxText} numberOfLines={2}>
                        {medList}
                      </Text>
                    </View>

                    {/* CTA */}
                    <View style={styles.cardFooter}>
                      {isAwaitingOtp ? (
                        <LinearGradient
                          colors={['#F59E0B', '#D97706']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.ctaGradient}
                        >
                          <Text style={styles.ctaGradientText}>
                            Enter Pickup OTP & Hand Over →
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.viewButton}>
                          <Text style={styles.viewButtonText}>View Order Details</Text>
                          <MaterialIcons name="arrow-forward" size={16} color={colors.brand.primary} />
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.muted,
    fontSize: 13,
    marginTop: 2,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
  },

  // Tabs
  tabsRow: { marginBottom: spacing.md },
  tabsContainer: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderRadius: 9999,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  inactiveTab: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 182, 0.15)',
  },
  tabText: { fontSize: 13, fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold', color: colors.text.secondary },
  activeTabText: { color: '#FFFFFF' },

  // List
  list: { padding: spacing.xl, paddingBottom: 110 },

  // Order Card
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 182, 0.1)',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  orderCardUrgent: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.2,
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  orderCardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  customerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,119,182,0.15)',
  },
  avatar: { width: '100%', height: '100%' },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  timeText: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: colors.text.muted },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 140,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700', fontFamily: 'Nunito_700Bold' },

  riderAlert: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  riderAlertText: { fontSize: 13, color: '#92400E', fontWeight: '700', fontFamily: 'Nunito_700Bold' },
  riderAlertSub: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: '#B45309', marginTop: 2 },

  rxContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 119, 182, 0.04)',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 182, 0.08)',
  },
  rxLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.brand.primary,
  },
  rxText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.secondary,
    lineHeight: 20,
  },

  cardFooter: {},
  ctaGradient: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  ctaGradientText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: '#fff',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 119, 182, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 182, 0.12)',
    borderRadius: 12,
    paddingVertical: 11,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.brand.primary,
  },

  // States
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,119,182,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700',
    fontFamily: 'Nunito_700Bold', color: colors.text.primary, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: colors.text.muted, textAlign: 'center', lineHeight: 20 },
  emptyAction: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.brand.primary,
    borderRadius: 10,
  },
  emptyActionText: { color: '#fff', fontWeight: '700',
    fontFamily: 'Nunito_700Bold', fontSize: 14 },
});
