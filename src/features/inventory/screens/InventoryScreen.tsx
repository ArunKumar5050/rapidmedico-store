import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Switch, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { InventoryItem } from '../../../types/models';
import { FirestoreService } from '../../../services/firebase/firestore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

export const InventoryScreen = ({ navigation }: any) => {
  const { storeId } = useAuthStore();
  const { isOnline } = useNetworkStatus();
  const [search, setSearch] = useState('');

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { medicineId: '1', name: 'Paracetamol 650mg', genericName: 'Acetaminophen', packSize: 'Strip of 15', inStock: true, lowStock: false },
    { medicineId: '2', name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', packSize: 'Strip of 10', inStock: false, lowStock: true },
    { medicineId: '3', name: 'Cetirizine 10mg', genericName: 'Cetirizine HCl', packSize: 'Strip of 10', inStock: true, lowStock: false },
    { medicineId: '4', name: 'Azithromycin 500mg', genericName: 'Azithromycin', packSize: 'Strip of 5', inStock: true, lowStock: false },
    { medicineId: '5', name: 'Omeprazole 20mg', genericName: 'Omeprazole', packSize: 'Strip of 14', inStock: true, lowStock: false },
  ]);

  useEffect(() => {
    if (storeId) {
      const unsub = FirestoreService.subscribeInventory(storeId, (items) => {
        if (items && items.length > 0) setInventory(items);
      });
      return () => unsub();
    }
  }, [storeId]);

  const handleToggleStock = async (medicineId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic local update
    setInventory((prev) =>
      prev.map((item) => (item.medicineId === medicineId ? { ...item, inStock: nextStatus } : item))
    );

    if (storeId) {
      try {
        await FirestoreService.updateInventoryStock(storeId, medicineId, nextStatus);
      } catch (err) {
        console.warn('[Inventory] Failed to update Firestore, queued locally:', err);
      }
    }
  };

  const handleBulkToggle = (inStock: boolean) => {
    Alert.alert(
      inStock ? 'Mark All In Stock' : 'Mark All Out of Stock',
      `Are you sure you want to mark all ${inventory.length} items as ${inStock ? 'In Stock' : 'Out of Stock'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setInventory((prev) => prev.map((item) => ({ ...item, inStock })));
          },
        },
      ]
    );
  };

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.genericName && item.genericName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Store Inventory ({inventory.length})</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddMedicine')}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>⚡ Offline mode — Inventory edits will sync upon reconnect.</Text>
          </View>
        )}

        <TextInput
          placeholder="Search medicine name or generic composition..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />

        <View style={styles.bulkRow}>
          <TouchableOpacity onPress={() => handleBulkToggle(true)} style={styles.bulkBtn}>
            <Text style={styles.bulkBtnText}>✓ Mark All In Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleBulkToggle(false)} style={styles.bulkBtn}>
            <Text style={styles.bulkBtnText}>✕ Mark All Out of Stock</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredInventory}
        keyExtractor={(item) => item.medicineId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{item.name}</Text>
                {item.genericName && <Text style={styles.medGeneric}>{item.genericName}</Text>}
                <Text style={styles.medPack}>{item.packSize || 'Single Unit'}</Text>
                {item.lowStock && <Text style={styles.lowStockBadge}>⚠️ Low Stock Flagged</Text>}
              </View>

              <View style={styles.toggleGroup}>
                <Text
                  style={[
                    styles.stockLabel,
                    { color: item.inStock ? colors.status.success : colors.action.reject },
                  ]}
                >
                  {item.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                </Text>
                <Switch
                  value={item.inStock}
                  onValueChange={() => handleToggleStock(item.medicineId, item.inStock)}
                  trackColor={{ false: colors.background.tertiary, true: '#A8E0C8' }}
                  thumbColor={item.inStock ? colors.brand.primary : '#999'}
                />
              </View>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border.default },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.h1, color: colors.text.primary },
  addBtn: { backgroundColor: colors.brand.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { ...typography.button, color: '#FFF', fontSize: 14 },
  offlineBanner: { backgroundColor: colors.status.warningLight, padding: spacing.sm, borderRadius: 8, marginBottom: spacing.md },
  offlineText: { ...typography.caption, color: colors.status.warning, fontWeight: '600' },
  searchInput: { backgroundColor: colors.background.secondary, padding: spacing.md, borderRadius: 12, ...typography.body, marginBottom: spacing.sm },
  bulkRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bulkBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  bulkBtnText: { ...typography.caption, color: colors.brand.primary, fontWeight: '700' },
  list: { padding: spacing.lg },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medName: { ...typography.bodyStrong, color: colors.text.primary },
  medGeneric: { ...typography.caption, color: colors.text.secondary },
  medPack: { ...typography.caption, color: colors.text.muted },
  lowStockBadge: { ...typography.caption, color: colors.status.warning, fontWeight: '700', marginTop: 2 },
  toggleGroup: { alignItems: 'flex-end' },
  stockLabel: { ...typography.caption, fontWeight: '700', marginBottom: 4 },
});
