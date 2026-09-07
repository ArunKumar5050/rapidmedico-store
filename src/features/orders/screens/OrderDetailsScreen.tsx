import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Button } from '../../../components/ui/Button';
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

  const storeOrder = activeOrders.find((o) => o.id === orderId) || completedOrders.find((o) => o.id === orderId);
  const baseOrder = directOrder && storeOrder ? { ...storeOrder, ...directOrder } : (directOrder || storeOrder);
  const resolvedPaymentStatus = directOrder?.paymentStatus || storeOrder?.paymentStatus || baseOrder?.paymentStatus;
  const resolvedPaymentMethod = directOrder?.paymentMethod || storeOrder?.paymentMethod || (baseOrder as any)?.paymentMethod;
  const order = baseOrder ? { ...baseOrder, paymentStatus: resolvedPaymentStatus, paymentMethod: resolvedPaymentMethod } : null;

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order?.status || OrderStatus.New);
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [isEditingBill, setIsEditingBill] = useState(false);
  const [billSavedLocally, setBillSavedLocally] = useState(false);

  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [rejectSheetVisible, setRejectSheetVisible] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);

  const { acceptOrder, loading: acceptLoading } = useAcceptOrder();
  const { updateStatus, loading: updateLoading } = useUpdateOrderStatus();
  const { requestPartner, loading: deliveryLoading } = useRequestDeliveryPartner();

  useEffect(() => {
    if (order?.status) {
      setCurrentStatus(order.status);
    }
  }, [order?.status, order?.paymentStatus, order?.deliveryPartnerId, order?.storePickupOtp, order?.deliveryStatus]);

  useEffect(() => {
    if (order && !isEditingBill) {
      let initItems = (order.items || []).map((it: any, idx: number) => ({
        tempId: it.medicineId || `med-${idx}`,
        name: it.name && it.name !== 'Unknown Medicine' ? it.name : '',
        quantity: (it.quantity !== undefined && it.quantity !== null) ? it.quantity.toString() : '1',
        price: (it.price !== undefined && it.price !== null && it.price !== 0) ? it.price.toString() : '',
        dosage: it.dosage || '',
      }));

      if (initItems.length === 0) {
        initItems = [{ tempId: `temp-${Date.now()}`, name: '', quantity: '1', price: '', dosage: '' }];
      } else if (initItems.length === 1 && initItems[0].name === '' && !initItems[0].price) {
        initItems = [{ ...initItems[0], quantity: '1' }];
      }

      setEditableItems(initItems);
    }
  }, [order?.items, isEditingBill]);

  if (!order) {
    if (loadingTimeout) {
      return (
        <LinearGradient colors={[colors.background.sageTop, colors.background.sageBottom]} style={[styles.container, styles.centerContent]}>
          <Text style={{ fontSize: 44, marginBottom: spacing.md }}>🔍</Text>
          <Text style={[typography.h2, { color: colors.text.primary, marginBottom: spacing.xs, textAlign: 'center' }]}>
            Order Not Found
          </Text>
          <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.lg, textAlign: 'center', maxWidth: 300 }]}>
            This order could not be loaded or may belong to another store.
          </Text>
          <Button
            title="Go Back to Orders"
            variant="primary"
            onPress={() => navigation.goBack()}
            style={{ width: 220 }}
          />
        </LinearGradient>
      );
    }

    return (
      <LinearGradient colors={[colors.background.sageTop, colors.background.sageBottom]} style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.md }]}>
          Loading order details...
        </Text>
      </LinearGradient>
    );
  }

  const handleItemChange = (tempId: string, field: keyof EditableItem, value: string) => {
    setEditableItems(prev => prev.map(item => item.tempId === tempId ? { ...item, [field]: value } : item));
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
    return total + 100; // Delivery fee
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.trim().length !== 4) {
      Alert.alert('Incomplete OTP', 'Please enter the 4-digit OTP provided by the delivery partner.');
      return;
    }

    setVerifyOtpLoading(true);
    try {
      const collectionName = order._collection || 'customOrders';
      const res = await FirestoreService.verifyAndConfirmStorePickup(orderId, otpInput.trim(), collectionName);
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


  const hasSavedPrices = Boolean(
    order?.totalAmount &&
    order.totalAmount > 100 &&
    order.items?.some((it: any) => (it.price || 0) > 0)
  );
  const isBillSaved = hasSavedPrices || billSavedLocally;

  const isPaid = Boolean(
    ['COMPLETED', 'PAID', 'COD'].includes(String(order?.paymentStatus || '').toUpperCase()) ||
    ['COD'].includes(String(order?.paymentMethod || '').toUpperCase()) ||
    String(order?.status || '').toUpperCase() === 'PAID' ||
    String(order?._rawStatus || '').toUpperCase() === 'PAID' ||
    String(currentStatus).toUpperCase() === 'PAID'
  );

  const isAcceptedState = currentStatus === OrderStatus.Accepted ||
                          String(currentStatus).toUpperCase() === 'ACCEPTED' ||
                          String(currentStatus).toUpperCase() === 'PAID';

  const isPriceInputEditable = !isPaid && (!isBillSaved || isEditingBill);

  const isPickupOtpVerified = Boolean(
    order?.storeOtpConfirmed === true ||
    order?.storePickupOtpVerified === true ||
    order?.deliveryStatus === 'en_route_delivery' ||
    order?.deliveryStatus === 'delivered' ||
    currentStatus === OrderStatus.OutOfDelivery ||
    currentStatus === OrderStatus.PickedUp ||
    currentStatus === OrderStatus.Completed
  );

  const isPartnerAssigned = Boolean(
    order?.deliveryPartnerId ||
    currentStatus === OrderStatus.DeliveryPartnerAssigned ||
    String(order?.status).toUpperCase() === 'DELIVERY_ASSIGNED' ||
    String(order?.status).toUpperCase() === 'DELIVERY_PARTNER_ASSIGNED' ||
    String(order?.storeStatus).toUpperCase() === 'DELIVERY_ASSIGNED' ||
    String(order?.storeStatus).toUpperCase() === 'DELIVERY_PARTNER_ASSIGNED' ||
    String(currentStatus).toUpperCase() === 'DELIVERY_ASSIGNED' ||
    String(currentStatus).toUpperCase() === 'DELIVERY_PARTNER_ASSIGNED'
  );

  const isSearchingPartner = !isPartnerAssigned && !isPickupOtpVerified && (
    currentStatus === OrderStatus.DeliveryRequested ||
    String(order?.status).toUpperCase() === 'DELIVERY_REQUESTED' ||
    String(order?.storeStatus).toUpperCase() === 'DELIVERY_REQUESTED'
  );

  // OTP card is ONLY shown when partner is actually assigned and OTP not yet verified
  const showOtpCard = !isPickupOtpVerified && isPartnerAssigned;
  const showOutOfDeliveryCard = isPickupOtpVerified && (
    currentStatus === OrderStatus.OutOfDelivery ||
    currentStatus === OrderStatus.PickedUp ||
    order?.deliveryStatus === 'en_route_delivery'
  );

  const handleUpdateBill = async () => {

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

      Alert.alert('Missing Info', 'Please ensure all medicines have a valid name, quantity, and price greater than ₹0.');

      return;
    }

    if (!storeId) {

      Alert.alert('Error', 'Store ID is not available.');
      return;
    }

    const totalAmount = calculateTotal();
    const collectionName = order?._collection || 'customOrders';
    try {
      await FirestoreService.updateOrderBill(storeId, orderId, updatedItems, totalAmount, collectionName);

      if (currentStatus === OrderStatus.New || currentStatus === OrderStatus.PendingDoctorConfirmation) {
        await FirestoreService.acceptOrder(storeId, orderId, collectionName);
        setCurrentStatus(OrderStatus.Accepted);
      }

      setBillSavedLocally(true);
      setIsEditingBill(false);
      Alert.alert('Bill Updated & Locked! 🎉', 'The price has been saved. Customer can now review the bill and complete payment or select Cash on Delivery.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update bill.');
    }
  };

  const handlePrimaryAction = async () => {
    const collectionName = order?._collection || 'customOrders';
    try {
      if (currentStatus === OrderStatus.New || currentStatus === OrderStatus.PendingDoctorConfirmation) {
        await handleUpdateBill();
      } else if (isAcceptedState) {
        if (!isPaid) {
          Alert.alert('Waiting for Payment', 'Cannot start preparing until customer completes payment or selects Cash on Delivery (COD).');
          return;
        }
        const ok = await updateStatus(orderId, OrderStatus.Preparing, collectionName);
        if (ok) setCurrentStatus(OrderStatus.Preparing);
      } else if (currentStatus === OrderStatus.Preparing) {
        const ok = await updateStatus(orderId, OrderStatus.Ready, collectionName);
        if (ok) setCurrentStatus(OrderStatus.Ready);
      } else if (currentStatus === OrderStatus.Ready) {
        const res = await requestPartner(orderId, collectionName);
        if (res.success) {
          setCurrentStatus(OrderStatus.DeliveryRequested);
          Alert.alert('Delivery Partner Requested 🛵', `Broadcasting to nearby delivery partners. Estimated pickup ETA: ${res.etaMinutes || 8} mins.`);
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update order status.');
    }
  };

  // Pipeline Stepper State
  const getStepStatus = (stepIndex: number) => {
    // 0: Billed, 1: Paid, 2: Ready, 3: Dispatched
    if (stepIndex === 0) return isBillSaved ? 'done' : 'active';
    if (stepIndex === 1) return isPaid ? 'done' : (isBillSaved ? 'active' : 'pending');
    if (stepIndex === 2) {
      const isReadyOrLater = [
        OrderStatus.Ready,
        OrderStatus.DeliveryRequested,
        OrderStatus.DeliveryPartnerAssigned,
        OrderStatus.OutOfDelivery,
        OrderStatus.PickedUp,
        OrderStatus.Completed
      ].includes(currentStatus);
      return isReadyOrLater ? 'done' : (isPaid ? 'active' : 'pending');
    }
    if (stepIndex === 3) {
      return isPickupOtpVerified || currentStatus === OrderStatus.OutOfDelivery || currentStatus === OrderStatus.Completed ? 'done' : 'pending';
    }
    return 'pending';
  };

  const getStatusBadgeConfig = () => {
    if (isPickupOtpVerified || currentStatus === OrderStatus.OutOfDelivery) {
      return { bg: '#E0F2FE', text: '#0369A1', border: '#7DD3FC', label: 'OUT FOR DELIVERY 🚀' };
    }
    if (isPartnerAssigned) {
      return { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B', label: 'RIDER AT STORE 🛵' };
    }
    if (isSearchingPartner) {
      return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D', label: 'FINDING RIDER 🔍' };
    }
    switch (currentStatus) {
      case OrderStatus.New:
      case OrderStatus.PendingDoctorConfirmation:
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', label: 'NEW ORDER ✦' };
      case OrderStatus.Accepted:
        return { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', label: isPaid ? 'PAID / READY TO PREP' : 'BILLED / UNPAID' };
      case OrderStatus.Preparing:
        return { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF', label: 'PREPARING ⏳' };
      case OrderStatus.Ready:
        return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', label: 'PACKED & READY 📦' };
      case OrderStatus.Completed:
        return { bg: '#DCFCE7', text: '#166534', border: '#86EFAC', label: 'COMPLETED ✓' };
      case OrderStatus.Rejected:
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', label: 'REJECTED ✕' };
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB', label: String(currentStatus).replace(/_/g, ' ').toUpperCase() };
    }
  };

  const statusConfig = getStatusBadgeConfig();
  const assignedTime = order.assignedAt ? new Date(order.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';


  return (
    <LinearGradient colors={[colors.background.sageTop, colors.background.sageBottom]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

        {/* Clean Header with Single Back Button & Status Badge */}
        <BlurView intensity={90} tint="light" style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerMainTitle}>Order Details</Text>
            <Text style={styles.headerSubId}>#{orderId.substring(0, 8).toUpperCase()}</Text>
          </View>

          <View style={[styles.headerStatusPill, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
            <Text style={[styles.headerStatusText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>
        </BlurView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hero Order Overview Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroOrderNumber}>Order #{orderId.substring(0, 8).toUpperCase()}</Text>
                <Text style={styles.heroMetaText}>🕒 Assigned at {assignedTime}</Text>
              </View>
              <View style={styles.orderTypeTag}>
                <Text style={styles.orderTypeTagText}>📋 Prescription Order</Text>
              </View>
            </View>

            {/* Payment Chip */}
            <View style={styles.paymentRow}>
              <View style={[
                styles.paymentChip,
                isPaid ? styles.paymentChipPaid : styles.paymentChipPending
              ]}>
                <Text style={[
                  styles.paymentChipText,
                  isPaid ? styles.paymentChipTextPaid : styles.paymentChipTextPending
                ]}>
                  {isPaid 
                    ? (order.paymentMethod === 'COD' ? '💵 Cash on Delivery Confirmed' : '✅ Paid Online')
                    : '⏳ Payment / COD Selection Pending'}
                </Text>
              </View>
            </View>

            {/* 4-Step Pipeline Stepper */}
            <View style={styles.stepperContainer}>
              <View style={styles.stepperProgressLine} />
              
              {[
                { label: '1. Billed', status: getStepStatus(0) },
                { label: '2. Paid', status: getStepStatus(1) },
                { label: '3. Ready', status: getStepStatus(2) },
                { label: '4. Dispatched', status: getStepStatus(3) },
              ].map((step, idx) => (
                <View key={idx} style={styles.stepItem}>
                  <View style={[
                    styles.stepCircle,
                    step.status === 'done' && styles.stepCircleDone,
                    step.status === 'active' && styles.stepCircleActive,
                    step.status === 'pending' && styles.stepCirclePending,
                  ]}>
                    <Text style={[
                      styles.stepCircleText,
                      step.status === 'done' && styles.stepCircleTextDone,
                      step.status === 'active' && styles.stepCircleTextActive,
                    ]}>
                      {step.status === 'done' ? '✓' : idx + 1}
                    </Text>
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    step.status === 'active' && styles.stepLabelActive,
                    step.status === 'done' && styles.stepLabelDone,
                  ]}>
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Contextual Action Banner */}
          {!isBillSaved && (currentStatus === OrderStatus.New || currentStatus === OrderStatus.PendingDoctorConfirmation) && (
            <View style={styles.bannerWarning}>
              <View style={styles.bannerIconBox}>
                <Text style={styles.bannerIcon}>⚠️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Action Needed: Set Medicine Prices</Text>
                <Text style={styles.bannerDesc}>
                  Enter the unit price for each medicine below and tap "Update Bill" so the customer can review and proceed.
                </Text>
              </View>
            </View>
          )}

          {isBillSaved && (currentStatus === OrderStatus.New || isAcceptedState) && !isPaid && (
            <View style={styles.bannerInfo}>
              <View style={[styles.bannerIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.bannerIcon}>⏳</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: '#3730A3' }]}>Bill Sent • Waiting for Customer Payment</Text>
                <Text style={[styles.bannerDesc, { color: '#4F46E5' }]}>
                  The invoice has been sent to the customer. Once payment is completed or Cash on Delivery is chosen, preparation unlocks.
                </Text>
              </View>
            </View>
          )}

          {/* Searching for Delivery Partner Banner */}
          {isSearchingPartner && (
            <View style={styles.bannerSearching}>
              <ActivityIndicator size="small" color="#B45309" style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerSearchingTitle}>Finding Nearby Delivery Partner 🛵</Text>
                <Text style={styles.bannerSearchingDesc}>
                  Broadcasting request to nearby riders. You will be notified as soon as a rider accepts this order.
                </Text>
              </View>
            </View>
          )}

          {/* Delivery Partner OTP Verification Card (ONLY when partner is assigned & waiting for pickup) */}
          {showOtpCard && (
            <View style={styles.otpCard}>
              <View style={styles.otpCardHeader}>
                <View style={styles.otpBadgeCircle}>
                  <Text style={{ fontSize: 24 }}>🛵</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.otpCardTitle}>Delivery Partner Arrived</Text>
                  <Text style={styles.otpCardSubtitle}>Verify pickup PIN before handing over medicines</Text>
                </View>
                <View style={styles.otpRequiredTag}>
                  <Text style={styles.otpRequiredTagText}>PIN REQUIRED</Text>
                </View>
              </View>

              {/* Partner Details */}
              <View style={styles.riderInfoBox}>
                <View style={styles.riderRow}>
                  <Text style={styles.riderName}>
                    👤 {order.deliveryPartnerName || 'RapidMedico Partner'}
                  </Text>
                  {order.deliveryPartnerPhone ? (
                    <Text style={styles.riderPhone}>📞 {order.deliveryPartnerPhone}</Text>
                  ) : null}
                </View>
                {order.deliveryPartnerVehicle ? (
                  <Text style={styles.riderVehicle}>🛵 Vehicle: {order.deliveryPartnerVehicle}</Text>
                ) : null}
              </View>

              <View style={styles.otpPromptBox}>
                <Text style={styles.otpPromptText}>
                  Ask the rider for their <Text style={{ fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold', color: colors.brand.primaryDark }}>4-digit Pickup PIN</Text> shown on their screen.
                </Text>
              </View>

              {/* 4-digit PIN Input */}
              <View style={styles.otpInputContainer}>
                <TextInput
                  style={styles.otpInputField}
                  placeholder="••••"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otpInput}
                  onChangeText={setOtpInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={styles.verifyOtpBtn}
                activeOpacity={0.85}
                onPress={handleVerifyOtp}
                disabled={verifyOtpLoading}
              >
                <LinearGradient
                  colors={[colors.brand.secondary, colors.brand.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.verifyOtpBtnGradient}
                >
                  {verifyOtpLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyOtpBtnText}>VERIFY PIN & HAND OVER MEDICINE 🚀</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Remove Dev PIN Badge as per user request */}
            </View>
          )}

          {/* Out for Delivery Card (Handover Complete) */}
          {showOutOfDeliveryCard && (
            <View style={styles.dispatchedCard}>
              <View style={styles.dispatchedHeader}>
                <Text style={{ fontSize: 26, marginRight: spacing.sm }}>✅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dispatchedTitle}>Out for Delivery</Text>
                  <Text style={styles.dispatchedSubtitle}>Parcel successfully handed over to delivery partner</Text>
                </View>
                <View style={styles.dispatchedPill}>
                  <Text style={styles.dispatchedPillText}>DISPATCHED</Text>
                </View>
              </View>
              {order.deliveryPartnerName ? (
                <Text style={styles.dispatchedRiderText}>
                  🛵 Rider: <Text style={{ fontWeight: '700',
    fontFamily: 'Nunito_700Bold', color: '#151D19' }}>{order.deliveryPartnerName}</Text>
                  {order.deliveryPartnerPhone ? ` • 📞 ${order.deliveryPartnerPhone}` : ''}
                </Text>
              ) : null}
            </View>
          )}

          {/* Customer Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIconBox}>
                <Text style={{ fontSize: 16 }}>👤</Text>
              </View>
              <Text style={styles.cardTitle}>Customer Details</Text>
              <View style={styles.privacyBadge}>
                <Text style={styles.privacyBadgeText}>🔒 SECURED</Text>
              </View>
            </View>

            <View style={styles.customerGrid}>
              <View style={styles.customerField}>
                <Text style={styles.fieldLabel}>CUSTOMER NAME</Text>
                <Text style={styles.fieldValue}>{order.customerFirstName || 'Customer'}</Text>
              </View>
              <View style={styles.customerField}>
                <Text style={styles.fieldLabel}>PHONE PRIVACY</Text>
                <Text style={styles.fieldValueMuted}>Routed via RapidMedico</Text>
              </View>
            </View>

            <View style={styles.addressContainer}>
              <View style={styles.addressHeaderRow}>
                <Text style={styles.fieldLabel}>DELIVERY ADDRESS</Text>
              </View>
              <View style={styles.addressBox}>
                <Text style={styles.addressText}>
                  Delivery address verified. Partner receives live GPS routing upon parcel dispatch.
                </Text>
              </View>
            </View>

            {order.customerNotes ? (
              <View style={styles.notesContainer}>
                <Text style={styles.fieldLabel}>CUSTOMER INSTRUCTIONS</Text>
                <View style={styles.notesBox}>
                  <Text style={{ fontSize: 14, marginRight: 6 }}>💬</Text>
                  <Text style={styles.notesText}>{order.customerNotes}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Prescription Uploads Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIconBox}>
                <Text style={{ fontSize: 16 }}>📄</Text>
              </View>
              <Text style={styles.cardTitle}>Prescription Uploads</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{order.prescriptionUrls?.length || 0}</Text>
              </View>
            </View>

            <View style={styles.prescriptionsGrid}>
              {order.prescriptionUrls && order.prescriptionUrls.length > 0 ? (
                order.prescriptionUrls.map((url, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.prescriptionThumb}
                    activeOpacity={0.8}
                    onPress={() => setPrescriptionModalVisible(true)}
                  >
                    <Image source={{ uri: url }} style={styles.prescriptionImage} />
                    <View style={styles.prescriptionZoomOverlay}>
                      <Text style={{ color: 'white', fontSize: 18 }}>🔍 View</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noPrescriptionBox}>
                  <Text style={styles.noPrescriptionText}>No digital prescription files attached</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bill Editor & Items Table */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIconBox}>
                <Text style={{ fontSize: 16 }}>🧾</Text>
              </View>
              <Text style={styles.cardTitle}>Prescription & Billing</Text>
              <View style={[
                styles.billLockBadge,
                !isPriceInputEditable ? styles.billLockBadgeLocked : styles.billLockBadgeEdit
              ]}>
                <Text style={[
                  styles.billLockBadgeText,
                  !isPriceInputEditable ? styles.billLockBadgeTextLocked : styles.billLockBadgeTextEdit
                ]}>
                  {!isPriceInputEditable ? '🔒 PRICING LOCKED' : '✏️ EDITING PRICES'}
                </Text>
              </View>
            </View>

            {/* Medicine Items */}
            <View style={styles.itemsTable}>
              {editableItems.length > 0 ? (
                editableItems.map((item, idx) => (
                  <View key={item.tempId} style={styles.itemRowCard}>
                    <View style={styles.itemRowHeader}>
                      <View style={styles.itemIndexPill}>
                        <Text style={styles.itemIndexText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.itemNameText}>{item.name || `Medicine #${idx + 1}`}</Text>
                      {item.dosage ? (
                        <Text style={styles.itemDosageText}>({item.dosage})</Text>
                      ) : null}
                    </View>

                    <View style={styles.itemInputRow}>
                      <View style={styles.qtyBadge}>
                        <Text style={styles.qtyLabel}>Qty: </Text>
                        <Text style={styles.qtyValue}>{item.quantity}</Text>
                      </View>

                      <View style={styles.priceInputWrapper}>
                        <Text style={styles.currencyPrefix}>₹</Text>
                        {isPriceInputEditable ? (
                          <TextInput
                            style={styles.priceInput}
                            placeholder="0.00"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={item.price}
                            onChangeText={(val) => handleItemChange(item.tempId, 'price', val)}
                          />
                        ) : (
                          <Text style={styles.lockedPriceText}>{item.price || '0.00'}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyItemsBox}>
                  <Text style={styles.emptyItemsText}>No items specified in this order.</Text>
                </View>
              )}
            </View>

            {/* Invoice Breakdown */}
            <View style={styles.invoiceTotals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Medicines Subtotal</Text>
                <Text style={styles.totalRowValue}>
                  ₹{Math.max(0, (order.totalAmount || calculateTotal()) - 100).toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Delivery Fee</Text>
                <Text style={styles.totalRowValue}>₹100.00</Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.grandTotalRow}>
                <View>
                  <Text style={styles.grandTotalLabel}>Total Amount</Text>
                  <Text style={styles.grandTotalSub}>Inclusive of all taxes</Text>
                </View>
                <Text style={styles.grandTotalValue}>
                  ₹{(order.totalAmount || calculateTotal()).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Generous bottom spacer so content is never hidden behind floating dock */}
          <View style={{ height: 140 }} />
        </ScrollView>


        {/* Floating Action Dock (Footer) */}
        <BlurView intensity={95} tint="light" style={styles.footerDock}>
          <View style={styles.footerInner}>

            {/* STATE 1: Unbilled or Editing Bill -> Reject & Update Bill */}
            {isPriceInputEditable && (
              <View style={styles.buttonRow}>
                {(currentStatus === OrderStatus.New || currentStatus === OrderStatus.PendingDoctorConfirmation) && (
                  <TouchableOpacity
                    style={styles.btnSecondaryReject}
                    onPress={() => setRejectSheetVisible(true)}
                  >
                    <Text style={styles.btnSecondaryRejectText}>Reject</Text>
                  </TouchableOpacity>
                )}
                {isEditingBill && isAcceptedState && (
                  <TouchableOpacity
                    style={styles.btnSecondaryCancel}
                    onPress={() => setIsEditingBill(false)}
                  >
                    <Text style={styles.btnSecondaryCancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.btnPrimaryGradient, { flex: 1 }]}
                  activeOpacity={0.85}
                  onPress={handleUpdateBill}
                >
                  <LinearGradient
                    colors={[colors.brand.secondary, colors.brand.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientInner}
                  >
                    <Text style={styles.btnPrimaryText}>Update Bill 🧾</Text>

                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}


            {/* STATE 2: Bill Saved & Waiting for Payment / COD */}
            {!isPriceInputEditable && (currentStatus === OrderStatus.New || isAcceptedState) && !isPaid && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.btnEditBill}
                  onPress={() => setIsEditingBill(true)}
                >
                  <Text style={styles.btnEditBillText}>✏️ Edit Bill</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnFullWidth, { flex: 1, marginLeft: 8, opacity: 0.5 }]}
                  disabled={true}
                >
                  <LinearGradient
                    colors={['#9ca3af', '#6b7280']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientInner}
                  >
                    <Text style={[styles.btnPrimaryText, { fontSize: 13 }]}>Waiting for Payment...</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* STATE 3: Bill Saved & Paid / COD -> Start Preparing */}
            {!isPriceInputEditable && (currentStatus === OrderStatus.New || isAcceptedState) && isPaid && (
              <TouchableOpacity
                style={styles.btnFullWidth}
                activeOpacity={0.85}
                onPress={handlePrimaryAction}
              >
                <LinearGradient
                  colors={[colors.brand.secondary, colors.brand.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientInner}
                >
                  <Text style={styles.btnPrimaryText}>Start Preparing Order 🚀</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* STATE 4: Preparing -> Mark as Packed & Ready */}

            {currentStatus === OrderStatus.Preparing && (
              <TouchableOpacity
                style={styles.btnFullWidth}
                activeOpacity={0.85}
                onPress={handlePrimaryAction}
                disabled={updateLoading}
              >
                <LinearGradient
                  colors={[colors.brand.secondary, colors.brand.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientInner}
                >
                  {updateLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Mark as Packed & Ready 📦</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* STATE 5: Packed & Ready -> Request Delivery Partner */}
            {currentStatus === OrderStatus.Ready && (
              <TouchableOpacity
                style={styles.btnFullWidth}
                activeOpacity={0.85}
                onPress={handlePrimaryAction}
                disabled={deliveryLoading}
              >
                <LinearGradient
                  colors={[colors.brand.secondary, colors.brand.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientInner}
                >
                  {deliveryLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Request Delivery Partner 🛵</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* STATE 6: Searching for Rider */}
            {isSearchingPartner && (
              <View style={styles.searchingFooterBox}>
                <ActivityIndicator size="small" color="#B45309" style={{ marginRight: 8 }} />
                <Text style={styles.searchingFooterText}>Searching for Nearby Delivery Partner...</Text>
              </View>
            )}

            {/* STATE 7: Partner Assigned -> Prompts store to use OTP card above */}
            {showOtpCard && (
              <View style={styles.riderAssignedFooterBox}>
                <Text style={styles.riderAssignedFooterText}>
                  🛵 Rider at Store • Enter Pickup PIN Above to Hand Over
                </Text>
              </View>
            )}

            {/* STATE 8: Dispatched */}
            {showOutOfDeliveryCard && (
              <View style={styles.dispatchedFooterBox}>
                <Text style={styles.dispatchedFooterText}>✅ Parcel Handed Over & Dispatched</Text>
              </View>
            )}

          </View>
        </BlurView>

        {/* Prescription Viewer Modal */}
        <PrescriptionViewerModal
          visible={prescriptionModalVisible}
          urls={order.prescriptionUrls || []}
          onClose={() => setPrescriptionModalVisible(false)}
        />

        {/* Reject Order Sheet */}
        <RejectOrderBottomSheet
          visible={rejectSheetVisible}
          orderId={orderId}
          collectionName={order._collection}
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
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: spacing.xl },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    zIndex: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.primary,
    marginLeft: -1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  headerMainTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.primary,
  },
  headerSubId: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    color: colors.brand.primary,
    letterSpacing: 0.5,
  },
  headerStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerStatusText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: 0.5,
  },

  // Scroll Content
  scrollContent: {
    padding: spacing.lg,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 182, 0.12)',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroOrderNumber: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.brand.primaryDark,
    letterSpacing: -0.5,
  },
  heroMetaText: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.secondary,
    marginTop: 4,
  },
  orderTypeTag: {
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 119, 182, 0.25)',
  },
  orderTypeTagText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.brand.primaryDark,
  },
  paymentRow: {
    marginTop: spacing.md,
  },
  paymentChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  paymentChipPaid: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  paymentChipPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  paymentChipText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },
  paymentChipTextPaid: {
    color: '#166534',
  },
  paymentChipTextPending: {
    color: '#92400E',
  },

  // 4-Step Stepper
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    position: 'relative',
  },
  stepperProgressLine: {
    position: 'absolute',
    top: spacing.md + 14,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: 0,
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 1,
    width: 65,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleDone: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  stepCircleActive: {
    backgroundColor: '#E0F2FE',
    borderColor: colors.brand.primary,
  },
  stepCirclePending: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#9CA3AF',
  },
  stepCircleTextDone: {
    color: '#FFFFFF',
  },
  stepCircleTextActive: {
    color: colors.brand.primary,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.brand.primary,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
  },
  stepLabelDone: {
    color: '#374151',
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },

  // Alert Banners
  bannerWarning: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bannerInfo: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  bannerSearching: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bannerIcon: { fontSize: 18 },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: '#92400E',
    marginBottom: 2,
  },
  bannerDesc: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#B45309',
    lineHeight: 18,
  },
  bannerSearchingTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: '#92400E',
    marginBottom: 2,
  },
  bannerSearchingDesc: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#B45309',
    lineHeight: 16,
  },

  // Delivery Partner OTP Card
  otpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  otpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  otpBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  otpCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.text.primary,
  },
  otpCardSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.secondary,
    marginTop: 2,
  },
  otpRequiredTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  otpRequiredTagText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#B45309',
  },
  riderInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  riderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riderName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.primary,
  },
  riderPhone: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    color: colors.brand.primary,
  },
  riderVehicle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.secondary,
    marginTop: 4,
  },
  otpPromptBox: {
    backgroundColor: '#E0F2FE',
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  otpPromptText: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#0369A1',
    textAlign: 'center',
    lineHeight: 18,
  },
  otpInputContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  otpInputField: {
    width: '100%',
    height: 62,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 16,
    color: colors.brand.primaryDark,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  verifyOtpBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  verifyOtpBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyOtpBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: 0.5,
  },
  devPinBadge: {
    marginTop: spacing.sm,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  devPinText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#4B5563',
  },

  // Out for Delivery Card
  dispatchedCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  dispatchedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dispatchedTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#166534',
  },
  dispatchedSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#15803D',
    marginTop: 2,
  },
  dispatchedPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dispatchedPillText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#166534',
  },
  dispatchedRiderText: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#374151',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },

  // Generic Card
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardHeaderIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 119, 182, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.brand.primaryDark,
    flex: 1,
  },
  privacyBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  privacyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: '#6B7280',
  },
  countBadge: {
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.brand.primaryDark,
  },

  // Customer Info
  customerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  customerField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.muted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.primary,
  },
  fieldValueMuted: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.secondary,
  },
  addressContainer: {
    marginTop: spacing.xs,
  },
  addressHeaderRow: {
    marginBottom: 4,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8E4',
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.primary,
    lineHeight: 18,
  },
  notesContainer: {
    marginTop: spacing.md,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#854D0E',
    lineHeight: 18,
  },

  // Prescriptions Grid
  prescriptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  prescriptionThumb: {
    width: 100,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  prescriptionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  prescriptionZoomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPrescriptionBox: {
    width: '100%',
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  noPrescriptionText: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.muted,
  },

  // Bill Editor
  billLockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  billLockBadgeLocked: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  billLockBadgeEdit: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  billLockBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
  },
  billLockBadgeTextLocked: {
    color: '#065F46',
  },
  billLockBadgeTextEdit: {
    color: '#92400E',
  },

  itemsTable: {
    marginBottom: spacing.md,
  },
  itemRowCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemIndexPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 119, 182, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  itemIndexText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.brand.primaryDark,
  },
  itemNameText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.primary,
    flex: 1,
  },
  itemDosageText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.muted,
    marginLeft: 4,
  },
  itemInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qtyLabel: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.secondary,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.text.primary,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    width: 140,
    height: 42,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.primary,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.primary,
    paddingVertical: 0,
  },
  lockedPriceText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.text.primary,
  },
  emptyItemsBox: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyItemsText: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.muted,
  },

  // Totals Breakdown
  invoiceTotals: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalRowLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.secondary,
  },
  totalRowValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    color: colors.text.primary,
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: spacing.sm,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.brand.primaryDark,
  },
  grandTotalSub: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: colors.text.muted,
    marginTop: 1,
  },
  grandTotalValue: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Nunito_900Black',
    color: colors.brand.primaryDark,
  },

  // Floating Action Dock
  footerDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  footerInner: {
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  btnSecondaryReject: {
    width: 90,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryRejectText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: '#DC2626',
  },
  btnSecondaryCancel: {
    width: 90,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#6B7280',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryCancelText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: '#4B5563',
  },
  btnPrimaryGradient: {
    borderRadius: 14,
    overflow: 'hidden',
    height: 50,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  btnFullWidth: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  gradientInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: 0.3,
  },

  // Edit Bill Button
  btnEditBill: {
    width: 115,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(0, 119, 182, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEditBillText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: colors.brand.primaryDark,
  },

  // Disabled Waiting Button
  btnDisabledWaiting: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  btnDisabledWaitingText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: '#6B7280',
    textAlign: 'center',
  },

  // Footer Status States
  searchingFooterBox: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  searchingFooterText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#92400E',
  },

  riderAssignedFooterBox: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  riderAssignedFooterText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#065F46',
    textAlign: 'center',
  },

  dispatchedFooterBox: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispatchedFooterText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    color: '#166534',
  },
});
