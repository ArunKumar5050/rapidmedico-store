import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, typography, spacing, components } from '../../../theme/tokens';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { KycStatus, AvailabilityStatus } from '../../../types/enums';
import { useAuthStore } from '../../../store/useAuthStore';
import { AuthService } from '../../../services/firebase/auth';
import { FirestoreService } from '../../../services/firebase/firestore';
import { AvailabilityToggle } from '../../../components/ui/AvailabilityToggle';

export const ProfileScreen = ({ navigation }: any) => {
  const { store, storeId, setAvailability, logout } = useAuthStore();
  const kycStatus = store?.kycStatus || KycStatus.NotStarted;
  const availability = store?.availability || AvailabilityStatus.Offline;

  const handleToggleAvailability = (newStatus: AvailabilityStatus) => {
    setAvailability(newStatus);
    if (storeId) {
      FirestoreService.updateStoreAvailability(storeId, newStatus).catch((err) =>
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

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.bgTop} />
        <View style={styles.bgBottom} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Top App Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🏥</Text>
            <Text style={styles.headerTitle}>RapidMedico</Text>
          </View>
          <View style={styles.headerRight}>
             <AvailabilityToggle status={availability} onToggle={handleToggleAvailability} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Header Area */}
          <View style={styles.profileHeaderContainer}>
            <LinearGradient colors={[colors.brand.primary, colors.brand.primaryDark]} style={styles.profileHeaderGradient}>
              {/* Decorative Blur Circles */}
              <View style={styles.blurCircleTopRight} />
              <View style={styles.blurCircleBottomLeft} />
              
              <View style={styles.profileInfoContainer}>
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {(store?.ownerName || store?.businessName || 'P')[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Text style={{ fontSize: 12, color: colors.brand.primaryDark }}>✓</Text>
                  </View>
                </View>
                <Text style={styles.profileName}>{store?.ownerName || 'Jai Suresh'}</Text>
                <Text style={styles.profileRole}>Store Manager</Text>
                
                <View style={styles.kycBadge}>
                  <View style={styles.kycDot} />
                  <Text style={styles.kycText}>
                    {kycStatus === KycStatus.Approved ? 'KYC APPROVED' : kycStatus === KycStatus.PendingReview ? 'KYC UNDER REVIEW' : 'KYC PENDING'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Profile Content Cards */}
          <View style={styles.cardsContainer}>
            <TouchableOpacity style={styles.glassCard} onPress={() => navigation.navigate('PerformanceDashboard')} activeOpacity={0.8}>
              <View style={styles.cardIconWrapper}>
                <Text style={styles.cardIcon}>📊</Text>
              </View>
              <View style={styles.cardTextWrapper}>
                <Text style={styles.cardTitle}>Performance Dashboard</Text>
                <Text style={styles.cardSubtitle}>View sales, orders, and revenue metrics</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.glassCard} onPress={() => navigation.navigate('WorkingHours')} activeOpacity={0.8}>
              <View style={styles.cardIconWrapper}>
                <Text style={styles.cardIcon}>⏰</Text>
              </View>
              <View style={styles.cardTextWrapper}>
                <Text style={styles.cardTitle}>Working Hours</Text>
                <Text style={styles.cardSubtitle}>Manage store timings and breaks</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.glassCard} onPress={() => navigation.navigate('StoreSettings')} activeOpacity={0.8}>
              <View style={styles.cardIconWrapper}>
                <Text style={styles.cardIcon}>⚙️</Text>
              </View>
              <View style={styles.cardTextWrapper}>
                <Text style={styles.cardTitle}>Store Settings</Text>
                <Text style={styles.cardSubtitle}>Update details and inventory preferences</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.glassCard} onPress={() => navigation.navigate('Ratings')} activeOpacity={0.8}>
              <View style={styles.cardIconWrapper}>
                <Text style={styles.cardIcon}>⭐</Text>
              </View>
              <View style={styles.cardTextWrapper}>
                <Text style={styles.cardTitle}>Store Ratings</Text>
                <Text style={styles.cardSubtitle}>View customer feedback and reviews</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.glassCard} onPress={() => navigation.navigate('Support')} activeOpacity={0.8}>
              <View style={styles.cardIconWrapper}>
                <Text style={styles.cardIcon}>💬</Text>
              </View>
              <View style={styles.cardTextWrapper}>
                <Text style={styles.cardTitle}>Support</Text>
                <Text style={styles.cardSubtitle}>Get help from the RapidMedico team</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* Logout Button */}
            <View style={styles.logoutContainer}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  bgTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: colors.background.sageTop },
  bgBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: colors.background.sageBottom },
  
  safeArea: { flex: 1 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { fontSize: 24, marginRight: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.brand.primaryDark },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  content: {
    paddingBottom: spacing.xl,
  },

  profileHeaderContainer: {
    width: '100%',
    shadowColor: colors.brand.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  profileHeaderGradient: {
    paddingTop: 40,
    paddingBottom: 64,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  blurCircleTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  blurCircleBottomLeft: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  profileInfoContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  avatarText: {
    fontSize: 40,
    color: 'white',
    fontWeight: '800',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'white',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileName: {
    ...typography.h1,
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profileRole: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  kycDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#82f9c0',
    shadowColor: '#82f9c0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    marginRight: spacing.sm,
  },
  kycText: {
    ...typography.caption,
    color: 'white',
    letterSpacing: 1,
    fontWeight: '700',
  },

  cardsContainer: {
    paddingHorizontal: spacing.xl,
    marginTop: -32,
    zIndex: 10,
  },
  glassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.glass,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 32,
  },
  cardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTextWrapper: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.text.secondary,
    paddingLeft: spacing.sm,
  },

  logoutContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 218, 214, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: 16,
    shadowColor: '#ba1a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  logoutText: {
    ...typography.h3,
    color: '#93000a',
  },
});
