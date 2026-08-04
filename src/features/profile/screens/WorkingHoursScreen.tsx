import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';

export const WorkingHoursScreen = ({ navigation }: any) => {
  const [schedule, setSchedule] = useState({
    mon: { open: '08:00 AM', close: '10:00 PM', closed: false },
    tue: { open: '08:00 AM', close: '10:00 PM', closed: false },
    wed: { open: '08:00 AM', close: '10:00 PM', closed: false },
    thu: { open: '08:00 AM', close: '10:00 PM', closed: false },
    fri: { open: '08:00 AM', close: '10:00 PM', closed: false },
    sat: { open: '08:00 AM', close: '10:00 PM', closed: false },
    sun: { open: '09:00 AM', close: '08:00 PM', closed: false },
  });

  const toggleDayClosed = (dayKey: string) => {
    setSchedule((prev: any) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], closed: !prev[dayKey].closed },
    }));
  };

  const handleSave = () => {
    Alert.alert('Working Hours Saved', 'Your store working schedule has been updated.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Store Working Hours</Text>
        <Text style={styles.subtitle}>
          Incoming order assignments are automatically paused outside your operating hours unless overridden manually.
        </Text>

        {Object.entries(schedule).map(([day, val]) => (
          <View key={day} style={styles.dayRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dayName}>{day.toUpperCase()}</Text>
              <Text style={styles.timeText}>{val.closed ? 'CLOSED' : `${val.open} - ${val.close}`}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.closedLabel}>{val.closed ? 'Closed Today' : 'Open'}</Text>
              <Switch
                value={!val.closed}
                onValueChange={() => toggleDayClosed(day)}
                trackColor={{ false: colors.background.tertiary, true: '#A8E0C8' }}
                thumbColor={!val.closed ? colors.brand.primary : '#999'}
              />
            </View>
          </View>
        ))}

        <Button title="SAVE WORKING HOURS" size="large" onPress={handleSave} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.text.primary, marginBottom: 2 },
  subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  dayName: { ...typography.bodyStrong, color: colors.text.primary },
  timeText: { ...typography.caption, color: colors.text.secondary },
  closedLabel: { ...typography.caption, color: colors.text.muted, marginBottom: 2 },
});
