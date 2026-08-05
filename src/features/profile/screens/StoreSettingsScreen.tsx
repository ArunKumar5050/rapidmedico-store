import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/useAuthStore';
import { FirestoreService } from '../../../services/firebase/firestore';

export const StoreSettingsScreen = ({ navigation }: any) => {
  const { store, storeId, setStore } = useAuthStore();
  const [businessName, setBusinessName] = useState(store?.businessName || '');
  const [category, setCategory] = useState(store?.category || 'PHARMACY');
  const [soundPref, setSoundPref] = useState('Loud Siren (Default)');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) {
      setBusinessName(store.businessName);
      setCategory(store.category || 'PHARMACY');
    }
  }, [store]);

  const handleSave = async () => {
    if (!businessName) {
      Alert.alert('Required Field', 'Business name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      if (storeId) {
        await FirestoreService.createStoreProfile({
          storeId,
          businessName,
          category,
        });
        if (store) {
          setStore({ ...store, businessName, category });
        }
      }
      setSaving(false);
      Alert.alert('Settings Saved', 'Store settings updated successfully.');
      navigation.goBack();
    } catch (err: any) {
      setSaving(false);
      Alert.alert('Save Failed', err.message || 'Unable to update store settings.');
    }
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

        <Button title="SAVE SETTINGS" size="large" loading={saving} onPress={handleSave} style={{ marginTop: spacing.md }} />
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
