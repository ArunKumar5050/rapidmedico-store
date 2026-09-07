import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/useAuthStore';
import { FirestoreService } from '../../../services/firebase/firestore';

const DEFAULT_SCHEDULE = {
  mon: { open: '08:00 AM', close: '10:00 PM', closed: false },
  tue: { open: '08:00 AM', close: '10:00 PM', closed: false },
  wed: { open: '08:00 AM', close: '10:00 PM', closed: false },
  thu: { open: '08:00 AM', close: '10:00 PM', closed: false },
  fri: { open: '08:00 AM', close: '10:00 PM', closed: false },
  sat: { open: '08:00 AM', close: '10:00 PM', closed: false },
  sun: { open: '09:00 AM', close: '08:00 PM', closed: false },
};

export const WorkingHoursScreen = ({ navigation }: any) => {
  const { store } = useAuthStore();
  const [schedule, setSchedule] = useState<any>(DEFAULT_SCHEDULE);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (store?.workingHours) {
      setSchedule(store.workingHours);
    }
  }, [store?.workingHours]);

  const toggleDayClosed = (dayKey: string) => {
    setSchedule((prev: any) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], closed: !prev[dayKey].closed },
    }));
  };

  const handleTimeChange = (dayKey: string, field: 'open' | 'close', value: string) => {
    setSchedule((prev: any) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!store?.storeId) return;
    setIsSaving(true);
    try {
      await FirestoreService.updateStoreWorkingHours(store.storeId, schedule);
      Alert.alert('Working Hours Saved', 'Your store working schedule has been updated.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save working hours.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Store Working Hours</Text>
        <Text style={styles.subtitle}>
          Incoming order assignments are automatically paused outside your operating hours unless overridden manually.
        </Text>

        {Object.entries(schedule).map(([day, val]: [string, any]) => (
          <View key={day} style={styles.dayRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={styles.dayName}>{day.toUpperCase()}</Text>
              {!val.closed ? (
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={styles.timeInput}
                    value={val.open}
                    onChangeText={(txt) => handleTimeChange(day, 'open', txt)}
                    placeholder="08:00 AM"
                    placeholderTextColor={colors.text.muted}
                  />
                  <Text style={styles.toText}>to</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={val.close}
                    onChangeText={(txt) => handleTimeChange(day, 'close', txt)}
                    placeholder="10:00 PM"
                    placeholderTextColor={colors.text.muted}
                  />
                </View>
              ) : (
                <Text style={styles.closedText}>CLOSED</Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.closedLabel}>{val.closed ? 'Closed Today' : 'Open'}</Text>
              <Switch
                value={!val.closed}
                onValueChange={() => toggleDayClosed(day)}
                trackColor={{ false: colors.background.tertiary, true: colors.brand.primaryLight }}
                thumbColor={!val.closed ? colors.brand.primary : '#999'}
              />
            </View>
          </View>
        ))}

        <Button title={isSaving ? "SAVING..." : "SAVE WORKING HOURS"} size="large" onPress={handleSave} disabled={isSaving} style={{ marginTop: spacing.lg }} />
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
  dayName: { ...typography.bodyStrong, color: colors.text.primary, marginBottom: 4 },
  timeInputRow: { flexDirection: 'row', alignItems: 'center' },
  timeInput: { 
    ...typography.caption, 
    color: colors.text.primary, 
    backgroundColor: colors.background.primary, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 4,
    minWidth: 75,
    textAlign: 'center'
  },
  toText: { ...typography.caption, color: colors.text.muted, marginHorizontal: 6 },
  closedText: { ...typography.caption, color: colors.alert.urgent, marginTop: 4 },
  closedLabel: { ...typography.caption, color: colors.text.muted, marginBottom: 2 },
});
