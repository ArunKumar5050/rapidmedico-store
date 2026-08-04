import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Badge } from '../../../components/ui/Badge';
import { KycStatus } from '../../../types/enums';

export const ProfileScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.storeName}>Apollo Pharmacy</Text>
          <Text style={styles.ownerText}>Owner: Arun Kumar (+91 9876543210)</Text>
          <Badge label="KYC APPROVED" status={KycStatus.Approved} style={{ marginTop: spacing.xs }} />
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PerformanceDashboard')}>
            <Text style={styles.menuText}>📊 Performance Dashboard & Reliability Score</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('WorkingHours')}>
            <Text style={styles.menuText}>⏰ Working Hours & Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('HolidayMode')}>
            <Text style={styles.menuText}>🏖️ Holiday / Vacation Mode</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('StoreSettings')}>
            <Text style={styles.menuText}>⚙️ Store Settings & Alert Sounds</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Ratings')}>
            <Text style={styles.menuText}>⭐ Store Ratings & Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Support')}>
            <Text style={styles.menuText}>💬 Rapidmedi Store Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg },
  header: { backgroundColor: colors.background.secondary, padding: spacing.lg, borderRadius: 16, marginBottom: spacing.lg },
  storeName: { ...typography.h1, color: colors.text.primary },
  ownerText: { ...typography.body, color: colors.text.secondary, marginTop: 2 },
  menuSection: { backgroundColor: colors.background.primary },
  menuItem: { backgroundColor: colors.background.secondary, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
  menuText: { ...typography.bodyStrong, color: colors.text.primary },
});
