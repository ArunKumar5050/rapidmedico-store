import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, typography, spacing, components } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { OrderStatus } from '../../../types/enums';
import { StoreOrder, StoreOrderItem } from '../../../types/models';
import { PrescriptionViewerModal } from '../modals/PrescriptionViewerModal';
import { RejectOrderBottomSheet } from '../modals/RejectOrderBottomSheet';
import { useAcceptOrder } from '../../../hooks/useAcceptOrder';
import { useUpdateOrderStatus } from '../../../hooks/useUpdateOrderStatus';
import { useRequestDeliveryPartner } from '../../../hooks/useRequestDeliveryPartner';
import { useOrderStore } from '../../../store/useOrderStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { FirestoreService } from '../../../services/firebase/firestore';

interface EditableItem {
  tempId: string;
  name: string;
  quantity: string;
  price: string;
  dosage?: string;
}

export const OrderDetailsScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const { activeOrders, completedOrders } = useOrderStore();
  const { storeId } = useAuthStore();
  
  const [directOrder, setDirectOrder] = useState<StoreOrder | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const unsub = FirestoreService.subscribeOrder(orderId, (fetched) => {
      if (fetched) {
        setDirectOrder(fetched);
      }
    });

    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 4000);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [orderId]);

  const order = directOrder || activeOrders.find((o) => o.id === orderId) || completedOrders.find((o) => o.id === orderId);

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order?.status || OrderStatus.New);
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);

  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [rejectSheetVisible, setRejectSheetVisible] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);

  const { acceptOrder, loading: acceptLoading } = useAcceptOrder();
  const { updateStatus, loading: updateLoading } = useUpdateOrderStatus();
  const { requestPartner, loading: deliveryLoading } = useRequestDeliveryPartner();

  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status);
    }
  }, [order?.status]);

  useEffect(() => {
    if (order && editableItems.length === 0) {
      let initItems = (order.items || []).map((it: StoreOrderItem, idx: number) => ({
        tempId: it.medicineId || `med-${Date.now()}-${idx}`,
        name: it.name && it.name !== 'Unknown Medicine' ? it.name : '',
        quantity: it.quantity ? it.quantity.toString() : '1',
        price: it.price ? it.price.toString() : '',
        dosage: it.dosage,
      }));

      if (initItems.length === 1 && initItems[0].name === '' && !initItems[0].price) {
        initItems = [{ ...initItems[0], quantity: '1' }];
      }

      setEditableItems(initItems);
    }
  }, [order]);

  if (!order) {
    if (loadingTimeout) {
      return (
        <LinearGradient colors={[colors.background.sageTop, colors.background.sageBottom]} style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
          <Text style={{ fontSize: 36, marginBottom: spacing.md }}>🔍</Text>
          <Text style={[typography.h2, { color: colors.text.primary, marginBottom: spacing.xs, textAlign: 'center' }]}>
            Order Not Found
          </Text>
          <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.lg, textAlign: 'center' }]}>
            This order could not be loaded or may belong to another store.
          </Text>
          <Button
            title="Go Back to Orders"
            variant="primary"
            onPress={() => navigation.goBack()}
            style={{ width: 200 }}
          />
        </LinearGradient>
      );
    }

    return (
      <LinearGradient colors={[colors.background.sageTop, colors.background.sageBottom]} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.md }]}>
          Loading order details...
        </Text>
      </LinearGradient>
    );
  }

  const handleItemChange = (tempId: string, field: keyof EditableItem, value: string) => {
    setEditableItems(prev => prev.map(item => item.tempId === tempId ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (tempId: string) => {
    setEditableItems(prev => prev.filter(item => item.tempId !== tempId));
  };

  const handleAddItem = () => {
    setEditableItems(prev => [
      ...prev,
      { tempId: `new-${Date.now()}`, name: '', quantity: '1', price: '' }
    ]);
  };

  const calculateTotal = () => {
    let total = 0;
    editableItems.forEach(item => {
      const p = parseFloat(item.price);
      const q = parseInt(item.quantity, 10);
      if (!isNaN(p) && !isNaN(q)) {
        total += p * q;
      }
    });
    return total + 40; // Delivery fee
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.trim().length !== 4) {
      Alert.alert('Incomplete OTP', 'Please enter the 4-digit OTP provided by the delivery partner.');
      return;
    }

    setVerifyOtpLoading(true);
    try {
      const res = await FirestoreService.verifyAndConfirmStorePickup(orderId, otpInput.trim());
      if (res.success) {
        setCurrentStatus(OrderStatus.OutOfDelivery);
        setOtpInput('');
        Alert.alert(
          'Delivery Partner Verified! 🎉',
          'Store status changed to "OUT_OF_DELIVERY". The parcel has been successfully handed over to the delivery partner.'
        );
      } else {
        Alert.alert('Verification Failed', res.error || 'The OTP entered is incorrect. Please check the code with the delivery partner.');
      }
    } catch (e: any) {
      Alert.alert('Verification Error', e.message || 'Failed to verify delivery partner OTP.');
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (needsPricing) {
      let isValid = true;
      const updatedItems = editableItems.map(item => {
        const p = parseFloat(item.price);
        const q = parseInt(item.quantity, 10);
        if (!item.name.trim() || isNaN(p) || p <= 0 || isNaN(q) || q <= 0) {
          isValid = false;
        }
        const updatedItem: any = { medicineId: item.tempId, name: item.name, quantity: q, price: p };
        if (item.dosage) {
          updatedItem.dosage = item.dosage;
        }
        return updatedItem;
      });

      if (!isValid || updatedItems.length === 0) {
        Alert.alert('Missing Info', 'Please ensure all medicines have a valid name, quantity, and price.');
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
      const isPaid = ['COMPLETED', 'completed', 'PAID', 'paid', 'COD', 'cod'].includes(order.paymentStatus || '');
      if (!isPaid) {
        Alert.alert('Payment Pending', 'Cannot start preparing until customer completes the payment or selects Cash on Delivery.');
        return;
      }
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

  const isPaid = ['COMPLETED', 'completed', 'PAID', 'paid', 'COD', 'cod'].includes(order.paymentStatus || '');
  const needsPricing = currentStatus === OrderStatus.New || 
                       (currentStatus === OrderStatus.Accepted && (!order.totalAmount || order.totalAmount === 0));

  return (
    <LinearGradient colors={[colors.background.sageTop, colors.background.sageBottom]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <BlurView intensity={80} tint="light" style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>RapidMedico</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{currentStatus.replace(/_/g, ' ')}</Text>
          </View>
        </BlurView>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.pageTitleContainer}>
            <View>
              <Text style={[styles.orderId, styles.textGlow]}>Order #{orderId.substring(0, 8).toUpperCase()}</Text>
              <Text style={styles.timestamp}>Assigned: {new Date(order.assignedAt).toLocaleTimeString()}</Text>
            </View>
          </View>

          {needsPricing && (
            <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.amberGradient}>
              <Text style={styles.amberGradientIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.amberGradientTitle}>Action Required: Price Prescription</Text>
                <Text style={styles.amberGradientDesc}>This order contains prescription items that need pricing before the customer can proceed to payment.</Text>
              </View>
            </LinearGradient>
          )}

          {currentStatus === OrderStatus.Accepted && !isPaid && (
            <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.amberGradient}>
              <Text style={styles.amberGradientIcon}>⌛</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.amberGradientTitle}>Waiting for Customer to Pay</Text>
                <Text style={styles.amberGradientDesc}>Customer needs to complete payment or select COD before you can prepare the order.</Text>
              </View>
            </LinearGradient>
          )}

          {/* Delivery Partner Pickup & OTP Verification Card */}
          {currentStatus === OrderStatus.DeliveryRequested && (
            <BlurView intensity={50} tint="light" style={[styles.glassCard, styles.otpVerificationCard]}>
              <View style={styles.otpCardHeader}>
                <View style={styles.otpIconBadge}>
                  <Text style={styles.otpIconText}>🛵</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.otpCardTitle}>Partner Verification</Text>
                  <Text style={styles.otpCardSubtitle}>Awaiting partner arrival</Text>
                </View>
                <Badge label="AWAITING OTP" status="warning" />
              </View>

              <View style={styles.otpInstructionBox}>
                <Text style={styles.otpInstructionText}>
                  When the delivery boy arrives at your store, ask him for the <Text style={{ fontWeight: '800', color: colors.brand.primaryDark }}>4-digit Pickup OTP</Text>. Enter it below to verify the right person and hand over the medicine parcel.
                </Text>
              </View>

              {order.deliveryPartnerName ? (
                <View style={styles.partnerInfoRow}>
                  <Text style={styles.partnerInfoText}>
                    👤 Assigned Partner: <Text style={{ fontWeight: '700' }}>{order.deliveryPartnerName}</Text>
                    {order.deliveryPartnerPhone ? ` • 📞 ${order.deliveryPartnerPhone}` : ''}
                  </Text>
                </View>
              ) : null}

              <View style={styles.otpInputSection}>
                <Text style={styles.otpInputLabel}>ENTER 4-DIGIT PICKUP OTP</Text>
                <View style={styles.otpInputRow}>
                  <TextInput
                    style={styles.otpInputField}
                    placeholder="••••"
                    placeholderTextColor="rgba(0,0,0,0.2)"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={otpInput}
                    onChangeText={setOtpInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <Button
                  title="VERIFY OTP & HAND OVER"
                  variant="accept"
                  size="large"
                  loading={verifyOtpLoading}
                  onPress={handleVerifyOtp}
                  style={{ marginTop: spacing.md, width: '100%' }}
                />
              </View>
            </BlurView>
          )}

          {/* Delivery Partner Assigned / Out of Delivery Card */}
          {(currentStatus === OrderStatus.OutOfDelivery || currentStatus === OrderStatus.DeliveryPartnerAssigned || currentStatus === OrderStatus.PickedUp) && (
            <BlurView intensity={40} tint="light" style={[styles.glassCard, styles.partnerAssignedCard]}>
              <View style={styles.assignedHeaderRow}>
                <Text style={styles.assignedIcon}>🛵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignedTitle}>Out for Delivery</Text>
                  <Text style={styles.assignedSubtitle}>OTP verified & parcel handed over</Text>
                </View>
                <Badge label="OUT OF DELIVERY" status={OrderStatus.OutOfDelivery} />
              </View>

              {order.deliveryPartnerName && (
                <View style={styles.assignedPartnerDetails}>
                  <Text style={styles.assignedPartnerText}>
                    Partner: <Text style={{ fontWeight: '700', color: colors.text.primary }}>{order.deliveryPartnerName}</Text>
                  </Text>
                  {order.deliveryPartnerPhone ? (
                    <Text style={styles.assignedPartnerText}>Phone: <Text style={{ color: colors.text.primary }}>{order.deliveryPartnerPhone}</Text></Text>
                  ) : null}
                  {order.deliveryPartnerVehicle ? (
                    <Text style={styles.assignedPartnerText}>Vehicle: <Text style={{ color: colors.text.primary }}>{order.deliveryPartnerVehicle}</Text></Text>
                  ) : null}
                </View>
              )}
            </BlurView>
          )}

          {/* Customer Info */}
          <BlurView intensity={50} tint="light" style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderIcon}>👤</Text>
              <Text style={styles.cardTitle}>Customer Information</Text>
            </View>
            <View style={styles.customerInfoGrid}>
              <View style={styles.customerInfoBlock}>
                <Text style={styles.labelSm}>NAME</Text>
                <Text style={styles.bodyLg}>{order.customerFirstName}</Text>
              </View>
              <View style={styles.customerInfoBlock}>
                <Text style={styles.labelSm}>CONTACT</Text>
                <Text style={styles.bodyLg}>Hidden for privacy</Text>
              </View>
            </View>
            {order.customerNotes && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={styles.labelSm}>NOTES</Text>
                <Text style={styles.addressBox}>{order.customerNotes}</Text>
              </View>
            )}
            <View style={{ marginTop: spacing.sm }}>
              <Text style={styles.labelSm}>DELIVERY ADDRESS</Text>
              <Text style={styles.addressBox}>Address hidden per privacy architecture. All delivery contacts route through RapidMedico.</Text>
            </View>
          </BlurView>

          {/* Prescription Uploads */}
          <BlurView intensity={50} tint="light" style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderIcon}>📄</Text>
              <Text style={styles.cardTitle}>Prescription Uploads</Text>
            </View>
            <View style={styles.prescriptionsGrid}>
              {order.prescriptionUrls && order.prescriptionUrls.length > 0 ? (
                order.prescriptionUrls.map((url, idx) => (
                  <TouchableOpacity key={idx} style={styles.prescriptionImgWrapper} onPress={() => setPrescriptionModalVisible(true)}>
                    <Image source={{ uri: url }} style={styles.prescriptionImg} />
                    <View style={styles.prescriptionImgOverlay}>
                      <Text style={{ color: 'white', fontSize: 24 }}>🔍</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noPrescriptionBox}>
                  <Text style={styles.noPrescriptionText}>No prescriptions attached</Text>
                </View>
              )}
            </View>
          </BlurView>

          {/* Bill Editor */}
          <BlurView intensity={50} tint="light" style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderIcon}>🧾</Text>
              <Text style={styles.cardTitle}>Bill Editor</Text>
            </View>
            
            <View style={styles.billItemsContainer}>
              {needsPricing ? (
                <>
                  {editableItems.map((item, idx) => (
                    <View key={item.tempId} style={styles.billItemEdit}>
                      <View style={styles.billItemEditHeader}>
                        <TextInput
                          style={[styles.inputEdit, { flex: 1 }]}
                          placeholder="Medicine Name"
                          value={item.name}
                          onChangeText={(val) => handleItemChange(item.tempId, 'name', val)}
                        />
                        <TouchableOpacity onPress={() => handleRemoveItem(item.tempId)} style={styles.deleteIconBtn}>
                          <Text style={{ fontSize: 18, color: colors.alert.urgent }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.billItemEditRow}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.labelSmNormal}>Qty:</Text>
                          <TextInput
                            style={[styles.inputEdit, { flex: 1, marginLeft: spacing.xs }]}
                            placeholder="1"
                            keyboardType="numeric"
                            value={item.quantity}
                            onChangeText={(val) => handleItemChange(item.tempId, 'quantity', val)}
                          />
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: spacing.sm }}>
                          <Text style={styles.currencySymbolEdit}>₹</Text>
                          <TextInput
                            style={[styles.inputEdit, { flex: 1 }]}
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={item.price}
                            onChangeText={(val) => handleItemChange(item.tempId, 'price', val)}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
                    <Text style={styles.addItemText}>+ Add Item</Text>
                  </TouchableOpacity>
                </>
              ) : (
                (order.items || []).map((item: StoreOrderItem, idx: number) => (
                  <View key={idx} style={styles.billItemRead}>
                    <View>
                      <Text style={styles.billItemReadName}>{item.name}</Text>
                      <Text style={styles.billItemReadQty}>Qty: {item.quantity} {item.dosage ? `(${item.dosage})` : ''}</Text>
                    </View>
                    <Text style={styles.billItemReadPrice}>₹{(item.price || 0).toFixed(2)}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.totalsContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabelSub}>Subtotal</Text>
                <Text style={styles.totalAmountSub}>₹{needsPricing ? (calculateTotal() - 40).toFixed(2) : ((order.totalAmount || 0) - 40).toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabelSub}>Delivery Fee</Text>
                <Text style={styles.totalAmountSub}>₹40.00</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.totalLabelGrand}>Total</Text>
                <Text style={styles.totalAmountGrand}>₹{needsPricing ? calculateTotal().toFixed(2) : (order.totalAmount || 0).toFixed(2)}</Text>
              </View>
            </View>
          </BlurView>
          
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Fixed Bottom Actions */}
        <BlurView intensity={90} tint="light" style={styles.footer}>
          <View style={styles.footerContainer}>
            {needsPricing && (
              <>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => setRejectSheetVisible(true)}>
                  <Text style={styles.rejectBtnText}>Reject Order</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.emeraldGradientBtn} onPress={handlePrimaryAction}>
                  <LinearGradient colors={[colors.brand.primary, colors.brand.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emeraldGradientBtnInner}>
                    <Text style={styles.emeraldGradientBtnText}>Send Payment Link</Text>
                    <Text style={{ fontSize: 16, color: 'white', marginLeft: 8 }}>🚀</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {currentStatus === OrderStatus.Accepted && !needsPricing && (
              <TouchableOpacity style={styles.emeraldGradientBtn} onPress={handlePrimaryAction}>
                <LinearGradient colors={[colors.brand.primary, colors.brand.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emeraldGradientBtnInner}>
                  <Text style={styles.emeraldGradientBtnText}>Start Preparing</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {currentStatus === OrderStatus.Preparing && (
              <TouchableOpacity style={styles.emeraldGradientBtn} onPress={handlePrimaryAction}>
                <LinearGradient colors={[colors.brand.primary, colors.brand.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emeraldGradientBtnInner}>
                  <Text style={styles.emeraldGradientBtnText}>Mark as Packed & Ready</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {currentStatus === OrderStatus.Ready && (
              <TouchableOpacity style={styles.emeraldGradientBtn} onPress={handlePrimaryAction}>
                <LinearGradient colors={[colors.brand.primary, colors.brand.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emeraldGradientBtnInner}>
                  <Text style={styles.emeraldGradientBtnText}>Request Delivery Partner</Text>
                  <Text style={{ fontSize: 16, color: 'white', marginLeft: 8 }}>🛵</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            {currentStatus === OrderStatus.DeliveryRequested && (
              <View style={styles.statusBoxFooter}>
                <Text style={styles.statusBoxText}>Awaiting Delivery Partner (Enter OTP above)</Text>
              </View>
            )}

            {(currentStatus === OrderStatus.OutOfDelivery || currentStatus === OrderStatus.DeliveryPartnerAssigned || currentStatus === OrderStatus.PickedUp) && (
              <View style={styles.statusBoxFooter}>
                <Text style={styles.statusBoxText}>✅ Out for Delivery</Text>
              </View>
            )}
          </View>
        </BlurView>

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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.glass,
    zIndex: 10,
  },
  backButton: {
    padding: spacing.xs,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  backIcon: { fontSize: 24, color: colors.brand.primaryDark },
  headerTitle: {
    ...typography.h2,
    color: colors.brand.primaryDark,
    flex: 1,
    textAlign: 'center',
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 185, 95, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 185, 95, 0.3)',
  },
  headerBadgeText: {
    ...typography.caption,
    color: '#ffb95f',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  
  content: { padding: spacing.xl },
  pageTitleContainer: { marginBottom: spacing.lg },
  orderId: { ...typography.h1, color: colors.brand.primaryDark, fontWeight: '700' },
  textGlow: {
    textShadowColor: 'rgba(16, 185, 129, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  timestamp: { ...typography.body, color: colors.text.secondary, marginTop: 4 },
  
  amberGradient: {
    borderRadius: 12,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  amberGradientIcon: { fontSize: 24, marginRight: spacing.sm, marginTop: 2 },
  amberGradientTitle: { ...typography.h3, color: '#fff', marginBottom: 4 },
  amberGradientDesc: { ...typography.body, color: 'rgba(255, 255, 255, 0.9)' },
  
  glassCard: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.glass,
    backgroundColor: 'rgba(255,255,255,0.3)',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 32,
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  cardHeaderIcon: { fontSize: 20, marginRight: spacing.sm },
  cardTitle: { ...typography.h3, color: colors.brand.primaryDark },
  
  customerInfoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  customerInfoBlock: { width: '50%', marginBottom: spacing.sm },
  labelSm: { ...typography.caption, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  bodyLg: { ...typography.bodyStrong, color: colors.text.primary, fontSize: 16 },
  addressBox: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.glass,
    overflow: 'hidden',
  },
  
  prescriptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  prescriptionImgWrapper: {
    width: 100,
    height: 133,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.glass,
    overflow: 'hidden',
    position: 'relative',
  },
  prescriptionImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  prescriptionImgOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPrescriptionBox: {
    width: '100%',
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.glass,
  },
  noPrescriptionText: { ...typography.body, color: colors.text.secondary },
  
  billItemsContainer: { marginBottom: spacing.lg },
  billItemEdit: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.glass,
    marginBottom: spacing.md,
  },
  billItemEditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  deleteIconBtn: { padding: spacing.xs },
  billItemEditRow: { flexDirection: 'row', alignItems: 'center' },
  inputEdit: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    ...typography.body,
  },
  labelSmNormal: { ...typography.body, color: colors.text.secondary },
  currencySymbolEdit: { ...typography.body, color: colors.text.secondary, marginRight: 4 },
  
  addItemBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    borderRadius: 8,
    marginTop: spacing.xs,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  addItemText: { ...typography.caption, color: colors.brand.primaryDark, fontWeight: '700' },
  
  billItemRead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.glass,
  },
  billItemReadName: { ...typography.bodyStrong, color: colors.text.primary },
  billItemReadQty: { ...typography.caption, color: colors.text.secondary },
  billItemReadPrice: { ...typography.bodyStrong, color: colors.text.primary },
  
  totalsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.glass,
    paddingTop: spacing.md,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  totalLabelSub: { ...typography.body, color: colors.text.secondary },
  totalAmountSub: { ...typography.bodyStrong, color: colors.text.primary },
  grandTotalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.glass,
  },
  totalLabelGrand: { ...typography.h3, color: colors.brand.primaryDark },
  totalAmountGrand: { ...typography.h2, color: colors.brand.primaryDark, fontWeight: '700' },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border.glass,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl + 10,
  },
  footerContainer: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  rejectBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.alert.urgent,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: { ...typography.caption, color: colors.alert.urgent, fontWeight: '700' },
  emeraldGradientBtn: { flex: 1, borderRadius: 12, overflow: 'hidden', shadowColor: colors.brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  emeraldGradientBtnInner: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  emeraldGradientBtnText: { ...typography.caption, color: 'white', fontWeight: '700' },
  
  statusBoxFooter: { flex: 1, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border.glass },
  statusBoxText: { ...typography.bodyStrong, color: colors.brand.primaryDark },
  
  // OTP Verification Card Styles
  otpVerificationCard: {
    borderColor: colors.brand.primaryLight,
    borderWidth: 1.5,
  },
  otpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  otpIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  otpIconText: { fontSize: 24 },
  otpCardTitle: { ...typography.h3, color: colors.text.primary },
  otpCardSubtitle: { ...typography.caption, color: colors.text.secondary },
  otpInstructionBox: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  otpInstructionText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  partnerInfoRow: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  partnerInfoText: {
    ...typography.caption,
    color: colors.text.primary,
    fontSize: 13,
  },
  otpInputSection: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  otpInputLabel: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  otpInputRow: {
    flexDirection: 'row',
    width: '100%',
  },
  otpInputField: {
    width: '100%',
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.brand.primaryLight,
    backgroundColor: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 16,
    color: colors.brand.primaryDark,
  },

  // Partner Assigned Card Styles
  partnerAssignedCard: {
    borderColor: colors.brand.primaryLight,
    borderWidth: 1.5,
  },
  assignedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  assignedTitle: {
    ...typography.h3,
    color: colors.brand.primaryDark,
  },
  assignedSubtitle: {
    ...typography.caption,
    color: colors.brand.primary,
    marginTop: 2,
  },
  assignedPartnerDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  assignedPartnerText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
