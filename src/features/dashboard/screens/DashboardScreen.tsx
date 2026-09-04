import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, components } from '../../../theme/tokens';
import { OrderStatus } from '../../../types/enums';
import { useAuthStore } from '../../../store/useAuthStore';
import { useOrderStore } from '../../../store/useOrderStore';

const { width } = Dimensions.get('window');

export const DashboardScreen = ({ navigation }: any) => {
  const { store } = useAuthStore();
  const { activeOrders, completedOrders } = useOrderStore();

  const totalOrders = activeOrders.length + completedOrders.length;
  const acceptedOrders = activeOrders.filter(o => o.status !== OrderStatus.New).length + completedOrders.filter(o => o.status === OrderStatus.Completed).length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background.sageTop, colors.background.sageBottom]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Immersive Background Orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Welcome Header */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>
              Welcome back, <Text style={styles.storeName}>{store?.businessName || 'Jai Suresh Medicose'}</Text>
            </Text>
            <Text style={styles.welcomeSubtitle}>Your daily operational overview is looking optimal.</Text>
          </View>

          {/* Today's Summary (Immersive Floating Glass Card) */}
          <View style={styles.summaryCardWrapper}>
            <LinearGradient
              colors={['#ffffff', 'rgba(255,255,255,0.2)']}
              style={styles.summaryCardBorder}
            >
              <BlurView intensity={40} tint="light" style={styles.summaryCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.3)']}
                  style={styles.summaryCardGradient}
                >
                  <View style={styles.summaryHeader}>
                    <View style={styles.iconCircle}>
                      <MaterialIcons name="analytics" size={24} color={colors.brand.primaryDark} />
                    </View>
                    <Text style={styles.cardTitle}>Today's Summary</Text>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.brand.primaryDark }]}>{totalOrders}</Text>
                      <Text style={styles.statLabel}>ORDERS</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.brand.primary }]}>{acceptedOrders}</Text>
                      <Text style={styles.statLabel}>ACCEPTED</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.brand.secondary }]}>12m</Text>
                      <Text style={styles.statLabel}>AVG PREP</Text>
                    </View>
                  </View>
                </LinearGradient>
              </BlurView>
            </LinearGradient>
          </View>

          {/* Quick Actions Bento Grid */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => navigation.navigate('OrdersTab')}
                style={styles.actionCardWrap}
              >
                <LinearGradient
                  colors={[colors.brand.emeraldLush, colors.brand.primaryDark]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.primaryAction}
                >
                  <View style={styles.primaryIconWrapper}>
                    <MaterialIcons name="assignment-turned-in" size={24} color="#ffffff" />
                  </View>
                  <View>
                    <Text style={styles.primaryActionTitle}>Manage Assigned Orders</Text>
                    <Text style={styles.primaryActionDesc}>Review and process incoming requests.</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('InventoryTab')}
                style={styles.actionCardWrap}
              >
                <BlurView intensity={40} tint="light" style={styles.secondaryAction}>
                  <View style={styles.secondaryIconWrapper}>
                    <MaterialIcons name="inventory" size={24} color={colors.brand.primaryDark} />
                  </View>
                  <View>
                    <Text style={styles.secondaryActionTitle}>Update Stock</Text>
                    <Text style={styles.secondaryActionDesc}>Manage inventory and availability.</Text>
                  </View>
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.sageTop,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    top: '-15%',
    left: '-10%',
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: 'rgba(191, 233, 210, 0.6)', // secondary-container
    opacity: 0.6,
  },
  orb2: {
    top: '10%',
    right: '-15%',
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: 'rgba(130, 249, 192, 0.4)', // primary-fixed
    opacity: 0.4,
  },
  orb3: {
    bottom: '-10%',
    left: '20%',
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // emerald-lush
    opacity: 0.3,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.huge * 2,
  },
  welcomeSection: {
    marginBottom: spacing.xxl,
  },
  welcomeTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  storeName: {
    color: colors.brand.primaryDark,
    fontWeight: '800',
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  summaryCardWrapper: {
    marginBottom: spacing.xxl,
    ...components.shadows.lg,
    shadowColor: 'rgba(5, 150, 105, 0.2)',
  },
  summaryCardBorder: {
    borderRadius: 32,
    padding: 1,
  },
  summaryCard: {
    borderRadius: 31,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.6)', // Increased visibility
  },
  summaryCardGradient: {
    padding: spacing.xxl,
    backgroundColor: 'rgba(255,255,255,0.4)', // Added solid color for better contrast
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  statNumber: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.text.secondary,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  quickActionsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  actionsGrid: {
    gap: spacing.md,
  },
  actionCardWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(5, 150, 105, 0.25)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  primaryAction: {
    height: 192, // h-48
    padding: spacing.xxl,
    justifyContent: 'space-between',
  },
  primaryIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: spacing.xs,
  },
  primaryActionDesc: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryAction: {
    height: 192,
    padding: spacing.xxl,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.8)', // Increased visibility
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  secondaryIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brand.primaryDark,
    marginBottom: spacing.xs,
  },
  secondaryActionDesc: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});

