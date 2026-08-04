import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';

export const HolidayModeScreen = ({ navigation }: any) => {
  const [isHolidayActive, setIsHolidayActive] = useState(false);
  const [startDate, setStartDate] = useState('2026-08-05');
  const [endDate, setEndDate] = useState('2026-08-10');

  const handleToggleHoliday = (val: boolean) => {
    setIsHolidayActive(val);
    if (val) {
      Alert.alert(
        'Holiday Mode Enabled',
        'Your store availability is set to OFF. No new order assignments will be routed to your store during this period.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Holiday / Vacation Mode</Text>
        <Text style={styles.subtitle}>
          Temporarily pause incoming orders for planned store closures, inventory audits, or holidays.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Enable Holiday Mode</Text>
              <Text style={styles.cardSub}>Auto-sets store to Offline</Text>
            </View>
            <Switch
              value={isHolidayActive}
              onValueChange={handleToggleHoliday}
              trackColor={{ false: colors.background.tertiary, true: '#A8E0C8' }}
              thumbColor={isHolidayActive ? colors.brand.primary : '#999'}
            />
          </View>
        </View>

        {isHolidayActive && (
          <View style={styles.activeBanner}>
            <Text style={styles.activeTitle}>🏖️ Holiday Mode Active</Text>
            <Text style={styles.activeText}>Scheduled Range: {startDate} to {endDate}</Text>
            <Button
              title="End Holiday Mode Early"
              variant="outline"
              onPress={() => setIsHolidayActive(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.text.primary, marginBottom: 2 },
  subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
  card: { backgroundColor: colors.background.secondary, padding: spacing.lg, borderRadius: 16, marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...typography.h2, color: colors.text.primary },
  cardSub: { ...typography.caption, color: colors.text.secondary },
  activeBanner: { backgroundColor: '#E6F5F0', padding: spacing.lg, borderRadius: 16, borderColor: colors.brand.primary, borderWidth: 1.5 },
  activeTitle: { ...typography.h2, color: colors.brand.primaryDark },
  activeText: { ...typography.body, color: colors.text.primary, marginTop: 4 },
});
