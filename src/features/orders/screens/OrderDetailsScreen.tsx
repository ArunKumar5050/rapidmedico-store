import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { OrderStatus } from '../../../types/enums';
import { PrescriptionViewerModal } from '../modals/PrescriptionViewerModal';
import { RejectOrderBottomSheet } from '../modals/RejectOrderBottomSheet';
import { useAcceptOrder } from '../../../hooks/useAcceptOrder';
import { useUpdateOrderStatus } from '../../../hooks/useUpdateOrderStatus';
import { useRequestDeliveryPartner } from '../../../hooks/useRequestDeliveryPartner';
import { useOrderStore } from '../../../store/useOrderStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { FirestoreService } from '../../../services/firebase/firestore';

export const OrderDetailsScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const { activeOrders } = useOrderStore();
  const { storeId } = useAuthStore();
  
  const order = activeOrders.find((o) => o.id === orderId);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order?.status || OrderStatus.New);
  const [prices, setPrices] = useState<{ [medicineId: string]: string }>({});

  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [rejectSheetVisible, setRejectSheetVisible] = useState(false);

  const { acceptOrder, loading: acceptLoading } = useAcceptOrder();
  const { updateStatus, loading: updateLoading } = useUpdateOrderStatus();
  const { requestPartner, loading: deliveryLoading } = useRequestDeliveryPartner();

  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status);
    }
  }, [order?.status]);

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </SafeAreaView>
    );
  }

  const handlePriceChange = (medicineId: string, value: string) => {
    setPrices(prev => ({ ...prev, [medicineId]: value }));
  };

  const calculateTotal = () => {
    let total = 0;
    order.items.forEach(item => {
      const price = parseFloat(prices[item.medicineId] || '0');
      if (!isNaN(price) && item.quantity) {
        total += price * item.quantity;
      }
    });
    return total + 200; // Adding 200 delivery charge
  };

  const handlePrimaryAction = async () => {
    if (currentStatus === OrderStatus.New) {
      // Validate prices
      let isValid = true;
      const updatedItems = order.items.map(item => {
        const price = parseFloat(prices[item.medicineId] || '0');
        if (isNaN(price) || price <= 0) {
          isValid = false;
        }
        return { ...item, price };
      });

      if (!isValid) {
        Alert.alert('Missing Prices', 'Please enter a valid price for all medicines in the order.');
        return;
      }

      if (!storeId) {
         Alert.alert('Error', 'Store ID is not available.');
         return;
      }

      const totalAmount = calculateTotal();

      try {
        await FirestoreService.updateOrderBill(storeId, orderId, updatedItems, totalAmount);
        const ok = await acceptOrder(orderId);
        if (ok) {
           setCurrentStatus(OrderStatus.Accepted);
        }
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to update order bill.');
      }
    } else if (currentStatus === OrderStatus.Accepted) {
      const ok = await updateStatus(orderId, OrderStatus.Preparing);
      if (ok) setCurrentStatus(OrderStatus.Preparing);
    } else if (currentStatus === OrderStatus.Preparing) {
      const ok = await updateStatus(orderId, OrderStatus.Ready);
      if (ok) setCurrentStatus(OrderStatus.Ready);
    } else if (currentStatus === OrderStatus.Ready) {
      const res = await requestPartner(orderId);
      if (res.success) {
        setCurrentStatus(OrderStatus.DeliveryRequested);
        Alert.alert('Delivery Partner Requested', `Partner assigned. Estimated pickup ETA: ${res.etaMinutes || 8} mins.`);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orderId}>Order #{orderId.substring(0, 8)}</Text>
            <Text style={styles.timestamp}>Assigned: {new Date(order.assignedAt).toLocaleTimeString()}</Text>
          </View>
          <Badge label={currentStatus} status={currentStatus} />
        </View>

        {/* Customer & Privacy Box */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Information</Text>
          <Text style={styles.customerName}>Customer: {order.customerFirstName}</Text>
          {order.customerNotes && (
            <Text style={styles.notesText}>Note: "{order.customerNotes}"</Text>
          )}
          <Text style={styles.privacyBanner}>
            🔒 Customer phone, email & address hidden per privacy architecture. All delivery contacts route through Rapidmedi.
          </Text>
        </View>

        {/* Prescription Attachment */}
        {order.prescriptionUrls && order.prescriptionUrls.length > 0 && (
          <TouchableOpacity
            style={styles.prescriptionCard}
            onPress={() => setPrescriptionModalVisible(true)}
          >
            <Text style={styles.prescriptionIcon}>📄</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.prescriptionTitle}>Doctor Prescription Attached</Text>
              <Text style={styles.prescriptionSub}>Tap to view full screen scan</Text>
            </View>
            <Text style={styles.viewBadge}>VIEW →</Text>
          </TouchableOpacity>
        )}

        {/* Medicines List & Pricing Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medicines & Billing ({order.items.length})</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>Quantity: {item.quantity}</Text>
                {item.dosage && <Text style={styles.itemQty}>Dosage: {item.dosage}</Text>}
              </View>
              {currentStatus === OrderStatus.New ? (
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={prices[item.medicineId] || ''}
                    onChangeText={(val) => handlePriceChange(item.medicineId, val)}
                  />
                </View>
              ) : (
                <Text style={styles.itemPrice}>
                  ₹{(item.price || 0).toFixed(2)}
                </Text>
              )}
            </View>
          ))}
          
          <View style={[styles.totalRow, { borderTopWidth: 0, marginTop: 0, paddingTop: 0 }]}>
            <Text style={[styles.totalLabel, { fontSize: 14, color: '#666' }]}>Delivery Charge:</Text>
            <Text style={[styles.totalAmount, { fontSize: 14, color: '#666' }]}>
               ₹200.00
            </Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total:</Text>
            <Text style={styles.totalAmount}>
               ₹{currentStatus === OrderStatus.New ? calculateTotal().toFixed(2) : (order.totalAmount || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Vertical Order Timeline (Section 34) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Fulfillment Timeline</Text>
          <View style={styles.timelineContainer}>
            {[
              { status: OrderStatus.New, label: 'Assigned by Routing Engine' },
              { status: OrderStatus.Accepted, label: 'Accepted by Store' },
              { status: OrderStatus.Preparing, label: 'Medicines Being Prepared' },
              { status: OrderStatus.Ready, label: 'Packed & Ready for Pickup' },
              { status: OrderStatus.DeliveryRequested, label: 'Delivery Partner Requested' },
            ].map((t, idx) => {
              const isPastOrCurrent =
                Object.values(OrderStatus).indexOf(currentStatus) >=
                Object.values(OrderStatus).indexOf(t.status);
              return (
                <View key={idx} style={styles.timelineRow}>
                  <View style={[styles.dot, isPastOrCurrent && styles.dotActive]} />
                  <Text style={[styles.timelineLabel, isPastOrCurrent && styles.timelineLabelActive]}>
                    {t.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {currentStatus === OrderStatus.New && (
          <>
            <Button
              title="ACCEPT ORDER & GENERATE BILL"
              variant="accept"
              size="large"
              loading={acceptLoading}
              onPress={handlePrimaryAction}
              style={styles.primaryBtn}
            />
            <View style={{ height: spacing.xs }} />
            <Button
              title="Reject Order"
              variant="reject"
              onPress={() => setRejectSheetVisible(true)}
              style={styles.secondaryBtn}
            />
          </>
        )}

        {currentStatus === OrderStatus.Accepted && (
          <Button
            title="START PREPARING MEDICINES"
            variant="primary"
            size="large"
            loading={updateLoading}
            onPress={handlePrimaryAction}
            style={styles.primaryBtn}
          />
        )}

        {currentStatus === OrderStatus.Preparing && (
          <Button
            title="MARK AS PACKED & READY"
            variant="accept"
            size="large"
            loading={updateLoading}
            onPress={handlePrimaryAction}
            style={styles.primaryBtn}
          />
        )}

        {currentStatus === OrderStatus.Ready && (
          <Button
            title="REQUEST DELIVERY PARTNER 🛵"
            variant="primary"
            size="large"
            loading={deliveryLoading}
            onPress={handlePrimaryAction}
            style={styles.primaryBtn}
          />
        )}

        {currentStatus === OrderStatus.DeliveryRequested && (
          <View style={styles.statusBox}>
            <Text style={styles.statusBoxText}>✅ Delivery Partner Requested — Awaiting Pickup</Text>
          </View>
        )}
      </View>

      {/* Modals */}
      <PrescriptionViewerModal
        visible={prescriptionModalVisible}
        urls={order.prescriptionUrls || []}
        onClose={() => setPrescriptionModalVisible(false)}
      />

      <RejectOrderBottomSheet
        visible={rejectSheetVisible}
        orderId={orderId}
        onClose={() => setRejectSheetVisible(false)}
        onSuccess={() => {
          setCurrentStatus(OrderStatus.Rejected);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  orderId: { ...typography.h1, color: colors.text.primary },
  timestamp: { ...typography.caption, color: colors.text.secondary },
  card: { backgroundColor: colors.background.secondary, padding: spacing.lg, borderRadius: 16, marginBottom: spacing.md },
  cardTitle: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.sm },
  customerName: { ...typography.bodyStrong, color: colors.text.primary },
  notesText: { ...typography.body, color: colors.text.secondary, fontStyle: 'italic', marginTop: 2 },
  privacyBanner: { ...typography.caption, color: colors.text.muted, marginTop: spacing.sm, fontStyle: 'italic' },
  prescriptionCard: {
    backgroundColor: '#E6F4EA',
    borderColor: colors.brand.primary,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  prescriptionIcon: { fontSize: 28, marginRight: spacing.md },
  prescriptionTitle: { ...typography.bodyStrong, color: colors.brand.primaryDark },
  prescriptionSub: { ...typography.caption, color: colors.text.secondary },
  viewBadge: { ...typography.caption, color: colors.brand.primary, fontWeight: '700' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.default },
  itemName: { ...typography.bodyStrong, color: colors.text.primary, flexWrap: 'wrap' },
  itemQty: { ...typography.caption, color: colors.text.secondary },
  priceInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border.default, borderRadius: 8, paddingHorizontal: spacing.sm, backgroundColor: colors.background.primary, width: 80 },
  currencySymbol: { ...typography.body, color: colors.text.secondary, marginRight: 2 },
  priceInput: { flex: 1, ...typography.body, paddingVertical: spacing.xs },
  itemPrice: { ...typography.bodyStrong, color: colors.text.primary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, marginTop: spacing.sm },
  totalLabel: { ...typography.h2, color: colors.text.primary },
  totalAmount: { ...typography.h1, color: colors.brand.primary },
  timelineContainer: { marginTop: spacing.xs },
  timelineRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.background.tertiary, marginRight: spacing.sm },
  dotActive: { backgroundColor: colors.brand.primary },
  timelineLabel: { ...typography.caption, color: colors.text.muted },
  timelineLabelActive: { ...typography.bodyStrong, color: colors.text.primary },
  footer: { padding: spacing.lg, backgroundColor: colors.background.primary, borderTopWidth: 1, borderTopColor: colors.border.default },
  primaryBtn: { width: '100%' },
  secondaryBtn: { width: '100%' },
  statusBox: { backgroundColor: colors.brand.primaryLight, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  statusBoxText: { ...typography.bodyStrong, color: colors.brand.primaryDark },
});
