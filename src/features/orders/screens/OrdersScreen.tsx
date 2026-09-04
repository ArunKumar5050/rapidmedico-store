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

  const allOrders = [...activeOrders, ...completedOrders];
  const filteredOrders = activeTab === 'All' ? allOrders : allOrders.filter((o) => o.status === activeTab);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case OrderStatus.New:
        return { bg: 'rgba(255,221,184,1)', text: '#2a1700', border: 'rgba(130,81,0,0.2)' }; // tertiary-fixed
      case OrderStatus.Preparing:
        return { bg: 'rgba(191,233,210,1)', text: '#446a58', border: 'rgba(64,102,84,0.2)' }; // secondary-container
      case OrderStatus.Ready:
        return { bg: 'rgba(130,249,192,1)', text: '#005236', border: 'rgba(0,106,71,0.2)' }; // primary-fixed
      default:
        return { bg: 'rgba(255,255,255,0.8)', text: colors.text.primary, border: 'rgba(255,255,255,1)' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.bgMesh, StyleSheet.absoluteFill]} />

      <SafeAreaView style={styles.safeArea}>


        <View style={styles.header}>
          <Text style={styles.title}>Orders Pipeline</Text>
          <Text style={styles.subtitle}>Manage and track active prescriptions.</Text>
        </View>

        <View style={styles.tabsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
            {[
              'All',
              OrderStatus.New,
              OrderStatus.Accepted,
              OrderStatus.Preparing,
              OrderStatus.Ready,
              OrderStatus.DeliveryRequested,
              OrderStatus.DeliveryPartnerAssigned,
              OrderStatus.OutOfDelivery,
              OrderStatus.Completed,
              OrderStatus.Rejected
            ].map((status) => {
              const isActive = activeTab === status;
              return (
                <TouchableOpacity
                  key={status}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab(status)}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={[colors.brand.emeraldLush, colors.brand.emeraldDeep]}
                      style={[styles.tab, styles.activeTabGradient]}
                    >
                      <Text style={[styles.tabText, styles.activeTabText]}>{status}</Text>
                    </LinearGradient>
                  ) : (
                    <BlurView intensity={40} tint="light" style={[styles.tab, styles.inactiveTab]}>
                      <Text style={styles.tabText}>{status}</Text>
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
            <Text style={styles.emptyText}>No orders in this status.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const timeStr = new Date(item.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const medList = item.items?.map(i => i.name).join(', ') || 'No medicines listed';
              const badgeStyle = getStatusBadgeStyle(item.status);

              return (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.3)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.orderCardWrap}
                  >
                    <BlurView intensity={50} tint="light" style={styles.orderCardInner}>
                      {/* Top Glowing Border */}
                      <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
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
                          <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>{item.status}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.rxContainer}>
                        <Text style={styles.rxText} numberOfLines={2}>
                          <Text style={{ fontWeight: '600', color: colors.text.primary }}>Rx: </Text>
                          {medList}
                        </Text>
                      </View>
                      
                      <View style={styles.cardFooter}>
                        <View style={styles.viewButton}>
                          <Text style={styles.viewButtonText}>View Order Details</Text>
                        </View>
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

