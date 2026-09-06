import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, components } from '../../../theme/tokens';
import { OrderStatus } from '../../../types/enums';
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

  const newCount = allOrders.filter(o => [OrderStatus.New, OrderStatus.PendingDoctorConfirmation, OrderStatus.Accepted].includes(o.status)).length;
  const prepCount = allOrders.filter(o => [OrderStatus.Preparing, OrderStatus.Ready].includes(o.status)).length;
  const deliveryCount = allOrders.filter(o => [
    OrderStatus.DeliveryRequested,
    OrderStatus.DeliveryPartnerAssigned,
    OrderStatus.OutOfDelivery,
    OrderStatus.PickedUp
  ].includes(o.status) || Boolean(o.deliveryPartnerId)).length;
  const completedCount = allOrders.filter(o => o.status === OrderStatus.Completed).length;

  const tabs = [
    { id: 'All', label: `All (${allOrders.length})` },
    { id: 'New', label: `New / Billed (${newCount})` },
    { id: 'Preparing', label: `Preparing (${prepCount})` },
    { id: 'Delivery', label: `Delivery (${deliveryCount})` },
    { id: 'Completed', label: `Completed (${completedCount})` },
  ];

  const filteredOrders = allOrders.filter((o) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'New') return [OrderStatus.New, OrderStatus.PendingDoctorConfirmation, OrderStatus.Accepted].includes(o.status);
    if (activeTab === 'Preparing') return [OrderStatus.Preparing, OrderStatus.Ready].includes(o.status);
    if (activeTab === 'Delivery') {
      return [
        OrderStatus.DeliveryRequested,
        OrderStatus.DeliveryPartnerAssigned,
        OrderStatus.OutOfDelivery,
        OrderStatus.PickedUp
      ].includes(o.status) || Boolean(o.deliveryPartnerId);
    }
    if (activeTab === 'Completed') return o.status === OrderStatus.Completed;
    return true;
  });

  const getStatusBadgeStyle = (item: StoreOrder) => {
    const isAwaitingOtp = item.status === OrderStatus.DeliveryPartnerAssigned || 
                          (Boolean(item.deliveryPartnerId) && !item.storeOtpConfirmed && !item.storePickupOtpVerified);

    if (isAwaitingOtp) {
      return { 
        bg: '#FEF3C7', 
        text: '#B45309', 
        border: '#F59E0B', 
        label: '🛵 RIDER AT STORE (OTP NEEDED)' 
      };
    }

    switch (item.status) {
      case OrderStatus.New:
      case OrderStatus.PendingDoctorConfirmation:
        return { bg: 'rgba(255,221,184,1)', text: '#2a1700', border: 'rgba(130,81,0,0.3)', label: 'NEW ORDER' };
      case OrderStatus.Accepted:
        return { bg: 'rgba(224,231,255,1)', text: '#3730A3', border: 'rgba(99,102,241,0.3)', label: 'BILLED' };
      case OrderStatus.Preparing:
        return { bg: 'rgba(191,233,210,1)', text: '#446a58', border: 'rgba(64,102,84,0.3)', label: 'PREPARING' };
      case OrderStatus.Ready:
        return { bg: 'rgba(130,249,192,1)', text: '#005236', border: 'rgba(0,106,71,0.3)', label: 'READY' };
      case OrderStatus.DeliveryRequested:
        return { bg: 'rgba(254,243,199,1)', text: '#B45309', border: 'rgba(245,158,11,0.4)', label: 'FINDING RIDER...' };
      case OrderStatus.OutOfDelivery:
      case OrderStatus.PickedUp:
        return { bg: 'rgba(219,234,254,1)', text: '#1E40AF', border: 'rgba(59,130,246,0.3)', label: 'OUT FOR DELIVERY' };
      case OrderStatus.Completed:
        return { bg: 'rgba(220,252,231,1)', text: '#166534', border: 'rgba(34,197,94,0.3)', label: 'DELIVERED' };
      case OrderStatus.Rejected:
        return { bg: 'rgba(254,226,226,1)', text: '#991B1B', border: 'rgba(239,68,68,0.3)', label: 'REJECTED' };
      default:
        return { bg: 'rgba(255,255,255,0.8)', text: colors.text.primary, border: 'rgba(255,255,255,1)', label: String(item.status).replace(/_/g, ' ') };
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.bgMesh, StyleSheet.absoluteFill]} />

      <SafeAreaView style={styles.safeArea}>

        <View style={styles.header}>
          <Text style={styles.title}>Orders Pipeline</Text>
          <Text style={styles.subtitle}>Manage and track active prescriptions in real time.</Text>
        </View>

        <View style={styles.tabsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab(tab.id)}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={[colors.brand.emeraldLush, colors.brand.emeraldDeep]}
                      style={[styles.tab, styles.activeTabGradient]}
                    >
                      <Text style={[styles.tabText, styles.activeTabText]}>{tab.label}</Text>
                    </LinearGradient>
                  ) : (
                    <BlurView intensity={40} tint="light" style={[styles.tab, styles.inactiveTab]}>
                      <Text style={styles.tabText}>{tab.label}</Text>
                    </BlurView>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>📦</Text>
            <Text style={styles.emptyText}>No orders in this stage.</Text>
            {activeTab !== 'All' && (
              <TouchableOpacity onPress={() => setActiveTab('All')} style={{ marginTop: spacing.md }}>
                <Text style={{ color: colors.brand.primary, fontWeight: '700' }}>View All Orders ({allOrders.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const timeStr = new Date(item.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const medList = item.items?.map(i => i.name).filter(Boolean).join(', ') || 'Prescription Order';
              const badgeStyle = getStatusBadgeStyle(item);
              const isAwaitingOtp = item.status === OrderStatus.DeliveryPartnerAssigned || 
                                    (Boolean(item.deliveryPartnerId) && !item.storeOtpConfirmed && !item.storePickupOtpVerified);

              return (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                >
                  <LinearGradient
                    colors={isAwaitingOtp ? ['rgba(254,243,199,0.9)', 'rgba(255,255,255,0.7)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.3)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.orderCardWrap, isAwaitingOtp && { borderColor: '#F59E0B', borderWidth: 2 }]}
                  >
                    <BlurView intensity={50} tint="light" style={styles.orderCardInner}>
                      {/* Top Glowing Border */}
                      <LinearGradient
                        colors={['transparent', isAwaitingOtp ? '#F59E0B' : 'rgba(255,255,255,0.7)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.topGlowBorder}
                      />
                      
                      <View style={styles.cardHeader}>
                        <View style={styles.customerInfoRow}>
                          <View style={styles.avatarContainer}>
                            <Image 
                              source={{ uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.customerFirstName || 'User') + '&background=random' }} 
                              style={styles.avatar} 
                            />
                          </View>
                          <View>
                            <Text style={styles.customerName}>{item.customerFirstName || 'Customer'}</Text>
                            <View style={styles.timeRow}>
                              <MaterialIcons name="schedule" size={14} color={colors.text.secondary} />
                              <Text style={styles.timeText}>{timeStr}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
                          <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>{badgeStyle.label}</Text>
                        </View>
                      </View>

                      {isAwaitingOtp && item.deliveryPartnerName ? (
                        <View style={{ backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 10, padding: 8, marginBottom: 10 }}>
                          <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '700' }}>
                            🛵 Rider Assigned: {item.deliveryPartnerName} {item.deliveryPartnerPhone ? `(${item.deliveryPartnerPhone})` : ''}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
                            Delivery partner is waiting at the store. Enter pickup OTP to hand over.
                          </Text>
                        </View>
                      ) : null}
                      
                      <View style={styles.rxContainer}>
                        <Text style={styles.rxText} numberOfLines={2}>
                          <Text style={{ fontWeight: '600', color: colors.text.primary }}>Rx: </Text>
                          {medList}
                        </Text>
                      </View>
                      
                      <View style={styles.cardFooter}>
                        {isAwaitingOtp ? (
                          <View style={[styles.viewButton, { backgroundColor: colors.brand.primary, borderColor: colors.brand.primaryDark }]}>
                            <Text style={[styles.viewButtonText, { color: '#ffffff', fontWeight: '700' }]}>
                              🛵 Enter Pickup OTP & Hand Over →
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.viewButton}>
                            <Text style={styles.viewButtonText}>View Order Details →</Text>
                          </View>
                        )}
                      </View>
                    </BlurView>
                  </LinearGradient>
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
  container: { flex: 1, backgroundColor: '#f2fcf4' },
  bgMesh: {
    backgroundColor: '#f2fcf4',
  },
  safeArea: { flex: 1 },

  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  title: { fontSize: 28, lineHeight: 36, color: colors.text.primary, fontWeight: '700' },
  subtitle: { ...typography.body, color: colors.text.secondary, marginTop: 4 },
  tabsRow: { marginVertical: spacing.md },
  tabsContainer: { paddingHorizontal: spacing.xl },
  tab: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 9999, 
    marginRight: spacing.sm, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabGradient: {
    shadowColor: 'rgba(5, 150, 105, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  inactiveTab: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(5,150,105,0.2)',
  },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
  activeTabText: { color: '#ffffff' },
  
  list: { padding: spacing.xl, paddingBottom: 100 },
  
  orderCardWrap: {
    marginBottom: spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)', // More visible border
    shadowColor: 'rgba(0, 106, 71, 0.1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 4,
  },
  orderCardInner: {
    padding: spacing.xl,
  },
  topGlowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  customerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  customerName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rxContainer: {
    backgroundColor: 'rgba(242,252,244,0.5)', // surface/50
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  rxText: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  viewButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.text.secondary },
});

