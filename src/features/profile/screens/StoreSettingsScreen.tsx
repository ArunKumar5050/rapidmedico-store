import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';

export const StoreSettingsScreen = ({ navigation }: any) => {
  const [businessName, setBusinessName] = useState('Apollo Pharmacy Indiranagar');
  const [category, setCategory] = useState('PHARMACY');
  const [soundPref, setSoundPref] = useState('Loud Siren (Default)');

  const handleSave = () => {
    Alert.alert('Settings Saved', 'Store settings updated successfully.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Store Settings</Text>
        <Text style={styles.subtitle}>Configure business identity, alert tones & app preferences.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Display Pharmacy Name</Text>
          <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Store Category</Text>
          <TextInput style={styles.input} value={category} onChangeText={setCategory} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Order Alert Sound Preference</Text>
          <TouchableOpacity
            style={styles.pickerTile}
            onPress={() => Alert.alert('Alert Tone', 'High urgency siren configured per safety spec. Sound cannot be muted.')}
          >
            <Text style={styles.pickerText}>🔊 {soundPref}</Text>
          </TouchableOpacity>
        </View>

        <Button title="SAVE SETTINGS" size="large" onPress={handleSave} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.text.primary, marginBottom: 2 },
  subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
  fieldGroup: { marginBottom: spacing.md },
  label: { ...typography.bodyStrong, color: colors.text.primary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.background.secondary, borderRadius: 12, padding: spacing.md, ...typography.body, borderWidth: 1, borderColor: colors.border.default },
  pickerTile: { backgroundColor: colors.background.secondary, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border.default },
  pickerText: { ...typography.bodyStrong, color: colors.brand.primary },
});
