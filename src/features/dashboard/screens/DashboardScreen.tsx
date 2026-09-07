import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, components } from '../../../theme/tokens';
import { OrderStatus } from '../../../types/enums';
import { useAuthStore } from '../../../store/useAuthStore';
import { useOrderStore } from '../../../store/useOrderStore';

const { width } = Dimensions.get('window');

export const DashboardScreen = ({ navigation }: any) => {
  const { store } = useAuthStore();
  const { activeOrders, completedOrders } = useOrderStore();

  const totalOrders = activeOrders.length + completedOrders.length;
  const acceptedOrders =
    activeOrders.filter(o => o.status !== OrderStatus.New).length +
    completedOrders.filter(o => o.status === OrderStatus.Completed).length;
  const pendingOrders = activeOrders.filter(o => o.status === OrderStatus.New).length;

  const initials = (store?.businessName || 'R').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {/* Sky-blue gradient background */}
      <LinearGradient
        colors={['#E8F4FD', '#F0F7FF', '#FFFFFF']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative background orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greetingText}>Good morning 👋</Text>
              <Text style={styles.storeName} numberOfLines={1}>
                {store?.businessName || 'Your Store'}
              </Text>
            </View>
            <TouchableOpacity style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Hero Card */}
          <View style={styles.heroCardShadow}>
            <LinearGradient
              colors={[colors.brand.secondary, colors.brand.primary, colors.brand.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {/* Decorative inner orbs */}
              <View style={styles.heroOrb1} />
              <View style={styles.heroOrb2} />

              <View style={styles.heroHeader}>
                <View style={styles.heroIconCircle}>
                  <MaterialIcons name="analytics" size={20} color="#fff" />
                </View>
                <Text style={styles.heroTitle}>Today's Summary</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{totalOrders}</Text>
                  <Text style={styles.statLabel}>TOTAL</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{acceptedOrders}</Text>
                  <Text style={styles.statLabel}>FULFILLED</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, pendingOrders > 0 && styles.pendingNumber]}>
                    {pendingOrders}
                  </Text>
                  <Text style={styles.statLabel}>PENDING</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          {/* Primary Action — Orders */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('OrdersTab')}
            style={styles.primaryActionShadow}
          >
            <LinearGradient
              colors={['#0096C7', colors.brand.primary, colors.brand.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryAction}
            >
              <View style={styles.primaryInnerOrb} />
              <View style={styles.primaryIconWrapper}>
                <MaterialIcons name="receipt-long" size={26} color="#fff" />
              </View>
              <View style={styles.primaryTextBlock}>
                <Text style={styles.primaryActionTitle}>Manage Orders</Text>
                <Text style={styles.primaryActionDesc}>
                  Review and process incoming prescriptions
                </Text>
              </View>
              <View style={styles.primaryChevron}>
                <MaterialIcons name="chevron-right" size={24} color="rgba(255,255,255,0.7)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Actions Row */}
          <View style={styles.secondaryRow}>
            {/* Inventory */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('InventoryTab')}
              style={styles.secondaryCard}
            >
              <View style={[styles.secondaryIconWrapper, { backgroundColor: 'rgba(0, 119, 182, 0.1)' }]}>
                <Ionicons name="cube-outline" size={24} color={colors.brand.primary} />
              </View>
              <Text style={styles.secondaryTitle}>Stock</Text>
              <Text style={styles.secondaryDesc}>Update inventory</Text>
            </TouchableOpacity>

            {/* Analytics */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AnalyticsTab')}
              style={styles.secondaryCard}
            >
              <View style={[styles.secondaryIconWrapper, { backgroundColor: 'rgba(0, 180, 216, 0.1)' }]}>
                <Ionicons name="stats-chart-sharp" size={24} color={colors.brand.secondary} />
              </View>
              <Text style={styles.secondaryTitle}>Analytics</Text>
              <Text style={styles.secondaryDesc}>View metrics</Text>
            </TouchableOpacity>

            {/* Store Profile */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ProfileTab')}
              style={styles.secondaryCard}
            >
              <View style={[styles.secondaryIconWrapper, { backgroundColor: 'rgba(0, 90, 142, 0.1)' }]}>
                <Ionicons name="storefront-sharp" size={24} color={colors.brand.primaryDark} />
              </View>
              <Text style={styles.secondaryTitle}>Store</Text>
              <Text style={styles.secondaryDesc}>Profile & settings</Text>
            </TouchableOpacity>
          </View>

          {/* Tip card */}
          <View style={styles.tipCard}>
            <MaterialIcons name="info-outline" size={20} color={colors.brand.primary} />
            <Text style={styles.tipText}>
              Stay online to receive order alerts in real time.
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    top: -100,
    left: -60,
    width: width * 0.75,
    height: width * 0.75,
    backgroundColor: 'rgba(144, 224, 239, 0.35)',
  },
  orb2: {
    top: '20%',
    right: -80,
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
  },
  orb3: {
    bottom: '5%',
    left: '15%',
    width: width * 0.5,
    height: width * 0.5,
    backgroundColor: 'rgba(0, 119, 182, 0.08)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 120,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    marginBottom: 2,
  },
  storeName: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.text.primary,
    maxWidth: width * 0.65,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
  },

  // Hero Stats Card
  heroCardShadow: {
    borderRadius: 24,
    marginBottom: 28,
    shadowColor: colors.brand.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  heroCard: {
    borderRadius: 24,
    padding: spacing.xxl,
    overflow: 'hidden',
  },
  heroOrb1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroOrb2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 24,
  },
  heroIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
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
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  statNumber: {
    fontSize: 44,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#FFFFFF',
    lineHeight: 52,
  },
  pendingNumber: {
    color: '#FFD166',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginTop: 4,
  },

  // Quick Actions
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.primary,
    marginBottom: 14,
    paddingHorizontal: 2,
  },

  // Primary action card
  primaryActionShadow: {
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  primaryInnerOrb: {
    position: 'absolute',
    top: -30,
    right: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  primaryIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryTextBlock: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  primaryActionDesc: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  primaryChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Secondary row
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 182, 0.1)',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  secondaryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  secondaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  secondaryDesc: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.muted,
    lineHeight: 16,
  },

  // Tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 119, 182, 0.06)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 182, 0.12)',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.brand.primary,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    lineHeight: 18,
  },
});
