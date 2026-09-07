import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../../../theme/tokens';
import { KycStatus, AvailabilityStatus } from '../../../types/enums';
import { useAuthStore } from '../../../store/useAuthStore';
import { AuthService } from '../../../services/firebase/auth';
import { FirestoreService } from '../../../services/firebase/firestore';
import { AvailabilityToggle } from '../../../components/ui/AvailabilityToggle';

interface MenuItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, iconBg, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.menuIconWrapper, { backgroundColor: iconBg }]}>{icon}</View>
    <View style={styles.menuTextWrapper}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </View>
    <View style={styles.chevronWrapper}>
      <Ionicons name="chevron-forward" size={18} color={colors.brand.primary} />
    </View>
  </TouchableOpacity>
);

export const ProfileScreen = ({ navigation }: any) => {
  const { store, storeId, setAvailability, logout } = useAuthStore();
  const kycStatus = store?.kycStatus || KycStatus.NotStarted;
  const availability = store?.availability || AvailabilityStatus.Offline;

  const handleToggleAvailability = (newStatus: AvailabilityStatus) => {
    setAvailability(newStatus);
    if (storeId) {
      FirestoreService.updateStoreAvailability(storeId, newStatus).catch(err =>
        console.warn('[ProfileScreen] Availability update error:', err)
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of your store account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut();
            } catch (e) {
              console.warn('[ProfileScreen] Signout error:', e);
            } finally {
              logout();
            }
          },
        },
      ]
    );
  };

  const kycLabel =
    kycStatus === KycStatus.Approved
      ? 'KYC VERIFIED'
      : kycStatus === KycStatus.PendingReview
      ? 'KYC UNDER REVIEW'
      : 'KYC PENDING';

  const kycDotColor =
    kycStatus === KycStatus.Approved
      ? '#6EE7B7'
      : kycStatus === KycStatus.PendingReview
      ? '#FCD34D'
      : '#FCA5A5';

  const initials = (store?.ownerName || store?.businessName || 'P')[0]?.toUpperCase();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Top App Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>💊</Text>
            <Text style={styles.headerTitle}>RapidMedico</Text>
          </View>
          <AvailabilityToggle status={availability} onToggle={handleToggleAvailability} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Profile Hero */}
          <View style={styles.heroShadow}>
            <LinearGradient
              colors={['#0096C7', colors.brand.primary, colors.brand.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              {/* Decorative orbs */}
              <View style={styles.heroOrb1} />
              <View style={styles.heroOrb2} />

              <View style={styles.avatarWrapper}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.1)']}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color={colors.brand.primary} />
                </View>
              </View>

              <Text style={styles.profileName}>{store?.ownerName || 'Store Manager'}</Text>
              <Text style={styles.businessName}>{store?.businessName || 'Your Pharmacy'}</Text>

              <View style={styles.kycBadge}>
                <View style={[styles.kycDot, { backgroundColor: kycDotColor }]} />
                <Text style={styles.kycText}>{kycLabel}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Store Info Strip */}
          <View style={styles.infoStrip}>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>{store?.city || '—'}</Text>
              <Text style={styles.infoLabel}>City</Text>
            </View>
            <View style={styles.infoSep} />
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>{store?.category || '—'}</Text>
              <Text style={styles.infoLabel}>Category</Text>
            </View>
            <View style={styles.infoSep} />
            <View style={styles.infoItem}>
              <Text style={[styles.infoValue,
                { color: availability === AvailabilityStatus.Online ? '#059669' : colors.text.muted }]}>
                {availability}
              </Text>
              <Text style={styles.infoLabel}>Status</Text>
            </View>
          </View>

          {/* Section Label */}
          <Text style={styles.sectionLabel}>ACCOUNT</Text>

          {/* Menu Items */}
          <View style={styles.menuGroup}>
            <MenuItem
              icon={<Ionicons name="analytics-sharp" size={22} color="#0077B6" />}
              iconBg="rgba(0, 119, 182, 0.1)"
              title="Performance Dashboard"
              subtitle="Sales, orders, and revenue metrics"
              onPress={() => navigation.navigate('PerformanceDashboard')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={<MaterialCommunityIcons name="briefcase-clock" size={22} color="#0096C7" />}
              iconBg="rgba(0, 150, 199, 0.1)"
              title="Working Hours"
              subtitle="Manage store timings and breaks"
              onPress={() => navigation.navigate('WorkingHours')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={<Ionicons name="settings-sharp" size={22} color="#005A8E" />}
              iconBg="rgba(0, 90, 142, 0.1)"
              title="Store Settings"
              subtitle="Update details and inventory preferences"
              onPress={() => navigation.navigate('StoreSettings')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={<Ionicons name="star-sharp" size={22} color="#D97706" />}
              iconBg="rgba(217, 119, 6, 0.1)"
              title="Store Ratings"
              subtitle="View customer feedback and reviews"
              onPress={() => navigation.navigate('Ratings')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={<Ionicons name="chatbubbles-sharp" size={22} color="#7C3AED" />}
              iconBg="rgba(124, 58, 237, 0.1)"
              title="Support"
              subtitle="Get help from the RapidMedico team"
              onPress={() => navigation.navigate('Support')}
            />
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
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
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { fontSize: 22, marginRight: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.brand.primaryDark, fontSize: 22 },

  content: { paddingBottom: spacing.xl },

  // Hero
  heroShadow: {
    marginHorizontal: spacing.xl,
    marginBottom: 16,
    borderRadius: 24,
    shadowColor: colors.brand.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  heroGradient: {
    borderRadius: 24,
    paddingTop: 36,
    paddingBottom: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroOrb1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroOrb2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(144,224,239,0.15)',
  },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  profileName: {
    ...typography.h1,
    color: '#fff',
    fontSize: 24,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  businessName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    marginBottom: 14,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  kycDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  kycText: {
    ...typography.caption,
    color: '#fff',
    letterSpacing: 1.2,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },

  // Info Strip
  infoStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.xl,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,119,182,0.08)',
  },
  infoItem: { flex: 1, alignItems: 'center' },
  infoValue: { fontSize: 14, fontWeight: '700',
    fontFamily: 'Nunito_700Bold', color: colors.text.primary, marginBottom: 2 },
  infoLabel: { fontSize: 11, color: colors.text.muted, fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold', letterSpacing: 0.5 },
  infoSep: { width: 1, backgroundColor: 'rgba(0,119,182,0.1)', marginVertical: 4 },

  // Menu
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.muted,
    letterSpacing: 1.5,
    paddingHorizontal: spacing.xl,
    marginBottom: 8,
  },
  menuGroup: {
    marginHorizontal: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 182, 0.08)',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 119, 182, 0.06)',
    marginLeft: 72,
  },
  menuIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextWrapper: { flex: 1 },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.muted,
    lineHeight: 18,
  },
  chevronWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,119,182,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xl,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.15)',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  logoutText: {
    ...typography.h3,
    color: '#DC2626',
    fontSize: 16,
  },
});
