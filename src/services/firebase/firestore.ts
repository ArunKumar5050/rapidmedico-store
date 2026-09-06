import { db } from './config';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { Store, StoreOrder, InventoryItem, KycDocument, AnalyticsDaily, StorePerformance, Announcement, SupportMessage } from '../../types/models';
import { OrderStatus, AvailabilityStatus } from '../../types/enums';

export class FirestoreService {
  // STORE PROFILE
  static async getStoreProfile(storeId: string): Promise<Store | null> {
    const docRef = doc(db, 'stores', storeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { storeId: snap.id, ...snap.data() } as Store;
  }

  static async createStoreUser(uid: string, storeId: string, email: string, role: string = 'OWNER'): Promise<void> {
    const docRef = doc(db, 'store_users', uid);
    await setDoc(docRef, {
      uid,
      storeId,
      email,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  static async getStoreUser(uid: string): Promise<any | null> {
    const docRef = doc(db, 'store_users', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data();
  }

  static async createStoreProfile(storeData: Partial<Store> & { storeId: string }): Promise<void> {
    const docRef = doc(db, 'stores', storeData.storeId);
    await setDoc(docRef, {
      ...storeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  static async updateStoreAvailability(storeId: string, availability: AvailabilityStatus): Promise<void> {
    const docRef = doc(db, 'stores', storeId);
    await updateDoc(docRef, { availability, updatedAt: new Date().toISOString() });
  }

  static async updateStoreWorkingHours(storeId: string, workingHours: any): Promise<void> {
    const docRef = doc(db, 'stores', storeId);
    await updateDoc(docRef, { workingHours, updatedAt: new Date().toISOString() });
  }

  static async updatePushToken(storeId: string, pushToken: string): Promise<void> {
    const docRef = doc(db, 'stores', storeId);
    await updateDoc(docRef, { expoPushToken: pushToken, updatedAt: new Date().toISOString() });
  }

  static subscribeStoreProfile(storeId: string, onUpdate: (store: Store | null) => void) {
    const docRef = doc(db, 'stores', storeId);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onUpdate({ storeId: snap.id, ...snap.data() } as Store);
      } else {
        onUpdate(null);
      }
    });
  }

  // HELPER: Map a Firestore document to StoreOrder
  static mapDocToStoreOrder(id: string, data: any, collectionName?: 'orders' | 'customOrders'): StoreOrder & { _storeId?: string, _collection?: string } {
    let mappedStatus = OrderStatus.New;
    const rawStatus = String(data.storeStatus || data.status || '').toUpperCase();
    
    // Store pickup OTP is confirmed ONLY when explicitly verified or en_route_delivery
    const isPickupConfirmed = Boolean(
      data.storeOtpConfirmed === true || 
      data.storePickupOtpVerified === true ||
      data.deliveryStatus === 'en_route_delivery' ||
      data.deliveryStatus === 'delivered'
    );

    if (rawStatus === 'DELIVERED' || data.status === 'delivered' || rawStatus === 'COMPLETED' || data.status === 'completed') {
      mappedStatus = OrderStatus.Completed;
    } else if (rawStatus === 'REJECTED' || rawStatus === 'CANCELLED' || data.status === 'cancelled') {
      mappedStatus = OrderStatus.Rejected;
    } else if (rawStatus === 'TIMED_OUT') {
      mappedStatus = OrderStatus.TimedOut;
    } else if (isPickupConfirmed) {
      mappedStatus = OrderStatus.OutOfDelivery;
    } else if (
      rawStatus === 'DELIVERY_PARTNER_ASSIGNED' || 
      rawStatus === 'DELIVERY_ASSIGNED' || 
      data.status === 'DELIVERY_ASSIGNED' || 
      data.status === 'delivery boy assigned' || 
      data.status === 'delivery partner assigned' ||
      data.deliveryStatus === 'en_route_pickup' ||
      Boolean(data.deliveryPartnerId) ||
      rawStatus === 'OUT_OF_DELIVERY' ||
      rawStatus === 'OUT_FOR_DELIVERY' ||
      data.status === 'out_for_delivery' ||
      data.status === 'out_of_delivery'
    ) {
      // If delivery partner is assigned or requested but pickup OTP is NOT confirmed yet,
      // it MUST remain in DeliveryPartnerAssigned state so the store can verify the OTP!
      mappedStatus = OrderStatus.DeliveryPartnerAssigned;
    } else if (rawStatus === 'DELIVERY_REQUESTED' || data.status === 'DELIVERY_REQUESTED') {
      mappedStatus = OrderStatus.DeliveryRequested;
    } else if (rawStatus === 'READY' || rawStatus === 'PACKED') {
      mappedStatus = OrderStatus.Ready;
    } else if (rawStatus === 'PREPARING') {
      mappedStatus = OrderStatus.Preparing;
    } else if (rawStatus === 'ACCEPTED' || rawStatus === 'CONFIRMED' || data.status === 'confirmed') {
      mappedStatus = OrderStatus.Accepted;
    } else if (rawStatus === 'PAID' || data.status === 'paid') {
      // Payment received (COD or Online) - Order is accepted and ready for pharmacy preparation!
      mappedStatus = (data.storeStatus && data.storeStatus !== OrderStatus.New) ? (data.storeStatus as OrderStatus) : OrderStatus.Accepted;
    } else if (rawStatus === 'PENDING_DOCTOR_CONFIRMATION') {
      mappedStatus = OrderStatus.PendingDoctorConfirmation;
    } else if (rawStatus === 'PENDING') {
      mappedStatus = OrderStatus.New;
    } else if (data.storeStatus) {
      mappedStatus = data.storeStatus as OrderStatus;
    } else if (data.status) {
      if (typeof data.status === 'string' && data.status.toUpperCase() === 'PENDING') {
        mappedStatus = OrderStatus.New;
      }
    }

    let orderItems = data.items;
    if (orderItems && Array.isArray(orderItems)) {
      orderItems = orderItems.map((item: any, index: number) => ({
        ...item,
        medicineId: item.medicineId || item.id || `med-${index}`,
        quantity: item.quantity !== undefined ? item.quantity : (item.qty || 1),
        price: item.price !== undefined ? item.price : (item.unitPrice || 0)
      }));
    } else if (!orderItems && data.medicines && Array.isArray(data.medicines)) {
      orderItems = data.medicines.map((med: string, index: number) => ({
        medicineId: `med-${index}`,
        name: med,
        quantity: 1,
        price: data.price || 0
      }));
    } else if (!orderItems) {
      orderItems = [{ medicineId: 'med-1', name: data.medicineName || 'Unknown Medicine', quantity: 1, price: data.price || 0 }];
    }

    const assignedAtIso = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.assignedAt || data.createdAt || new Date().toISOString());
    const respondByAtIso = new Date(new Date(assignedAtIso).getTime() + 90000).toISOString();
    
    let pUrls: string[] = [];
    if (Array.isArray(data.prescriptionUrls)) pUrls = [...data.prescriptionUrls];
    else if (typeof data.prescriptionUrls === 'string') pUrls = [data.prescriptionUrls];
    if (data.prescriptionUrl) pUrls.push(data.prescriptionUrl);
    if (data.imageUrl) pUrls.push(data.imageUrl);
    if (Array.isArray(data.imageUrls)) pUrls = [...pUrls, ...data.imageUrls];
    if (Array.isArray(data.images)) pUrls = [...pUrls, ...data.images];
    if (Array.isArray(data.medicineImageUrls)) pUrls = [...pUrls, ...data.medicineImageUrls];
    
    // Resolve payment status reliably across COD, Razorpay, or status flags
    const isCod = String(data.paymentMethod || '').toUpperCase() === 'COD' || String(data.paymentStatus || '').toUpperCase() === 'COD';
    const isCompletedPay = String(data.paymentStatus || '').toUpperCase() === 'COMPLETED' || String(data.status || '').toLowerCase() === 'paid';
    const resolvedPaymentStatus = isCod ? 'COD' : (isCompletedPay ? 'COMPLETED' : (data.paymentStatus || 'PENDING'));

    return {
      id,
      customerFirstName: data.userName || data.customerName || 'Customer',
      status: mappedStatus,
      items: orderItems,
      prescriptionUrls: pUrls,
      totalAmount: data.billAmount || data.price || data.totalAmount,
      assignedAt: assignedAtIso,
      respondByAt: respondByAtIso,
      paymentStatus: resolvedPaymentStatus,
      paymentMethod: data.paymentMethod,
      _rawStatus: data.status,
      storePickupOtp: data.storePickupOtp,
      deliveryOtp: data.deliveryOtp,
      storeOtpConfirmed: Boolean(data.storeOtpConfirmed),
      storePickupOtpVerified: Boolean(data.storePickupOtpVerified),
      deliveryStatus: data.deliveryStatus,
      deliveryPartnerId: data.deliveryPartnerId,
      deliveryPartnerName: data.deliveryPartnerName,
      deliveryPartnerPhone: data.deliveryPartnerPhone,
      deliveryPartnerVehicle: data.deliveryPartnerVehicle,
      deliveryPartnerAssignedAt: data.deliveryPartnerAssignedAt,
      _storeId: data.storeId,
      _collection: collectionName
    };
  }

  // Subscribe to a single order document in real-time
  static subscribeOrder(orderId: string, onUpdate: (order: StoreOrder | null) => void) {
    const customRef = doc(db, 'customOrders', orderId);
    const orderRef = doc(db, 'orders', orderId);
    
    let currentCustom: StoreOrder | null = null;
    let currentOrder: StoreOrder | null = null;

    const emit = () => {
      // Prioritize customOrders when it exists and has items
      if (currentCustom && currentCustom.items && currentCustom.items.length > 0) {
        onUpdate(currentCustom);
      } else if (currentOrder) {
        onUpdate(currentOrder);
      } else if (currentCustom) {
        onUpdate(currentCustom);
      }
    };

    const unsubCustom = onSnapshot(customRef, (snap) => {
      if (snap.exists()) {
        currentCustom = FirestoreService.mapDocToStoreOrder(snap.id, snap.data(), 'customOrders');
        emit();
      }
    }, (error) => {
      console.warn('[FirestoreService] subscribeOrder custom error:', error);
    });

    const unsubOrder = onSnapshot(orderRef, (snap) => {
      if (snap.exists()) {
        currentOrder = FirestoreService.mapDocToStoreOrder(snap.id, snap.data(), 'orders');
        emit();
      }
    }, (error) => {
      console.warn('[FirestoreService] subscribeOrder normal error:', error);
    });

    return () => {
      unsubCustom();
      unsubOrder();
    };
  }

  // ORDERS (STORE PRIVACY Projection `storeOrders/{storeId}/orders`)
  static subscribeActiveOrders(storeId: string, onUpdate: (orders: StoreOrder[]) => void) {
    const customOrdersCol = collection(db, 'customOrders');
    const ordersCol = collection(db, 'orders');
    
    const qCustom = query(customOrdersCol, limit(100));
    const qOrders = query(ordersCol, limit(100));
    
    let customOrdersList: StoreOrder[] = [];
    let ordersList: StoreOrder[] = [];
    
    const activeAllowedStatuses = [
      OrderStatus.New, 
      OrderStatus.PendingDoctorConfirmation,
      OrderStatus.Accepted, 
      OrderStatus.Preparing, 
      OrderStatus.Ready,
      OrderStatus.DeliveryRequested, 
      OrderStatus.DeliveryPartnerAssigned,
      OrderStatus.OutOfDelivery, 
      OrderStatus.PickedUp
    ];

    const emitUpdate = () => {
      // Deduplicate orders across customOrders and orders collections
      // Prioritize customOrders because it has complete itemized bill and prescription data
      const orderMap = new Map<string, StoreOrder>();
      ordersList.forEach(o => orderMap.set(o.id, o));
      customOrdersList.forEach(o => orderMap.set(o.id, o));
      
      let combined = Array.from(orderMap.values());
      
      combined = combined.filter(o => {
        if (!storeId) return true;
        // Unassigned or unclaimed orders visible to all stores
        if (!o._storeId) return true;
        // Orders assigned to this store visible
        return o._storeId === storeId;
      }).filter(o => {
        // Only exclude finished/cancelled orders from the active pipeline
        if (o.status === OrderStatus.Completed || o.status === OrderStatus.Rejected || o.status === OrderStatus.TimedOut) {
          return false;
        }
        return true;
      });

      combined = combined.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
      onUpdate(combined);
    };

    const unsubCustom = onSnapshot(qCustom, (snapshot) => {
      customOrdersList = snapshot.docs.map((docSnap) => FirestoreService.mapDocToStoreOrder(docSnap.id, docSnap.data(), 'customOrders'));
      emitUpdate();
    });

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      ordersList = snapshot.docs.map((docSnap) => FirestoreService.mapDocToStoreOrder(docSnap.id, docSnap.data(), 'orders'));
      emitUpdate();
    });

    return () => {
      unsubCustom();
      unsubOrders();
    };
  }

  static subscribeOrderHistory(storeId: string, onUpdate: (orders: StoreOrder[]) => void) {
    const customOrdersCol = collection(db, 'customOrders');
    const ordersCol = collection(db, 'orders');

    const qCustom = storeId 
      ? query(customOrdersCol, where('storeId', '==', storeId), limit(50))
      : query(customOrdersCol, limit(50));
      
    const qOrders = storeId 
      ? query(ordersCol, where('storeId', '==', storeId), limit(50))
      : query(ordersCol, limit(50));
      
    let customOrdersList: StoreOrder[] = [];
    let ordersList: StoreOrder[] = [];

    const emitUpdate = () => {
      const orderMap = new Map<string, StoreOrder>();
      ordersList.forEach(o => orderMap.set(o.id, o));
      customOrdersList.forEach(o => orderMap.set(o.id, o));

      let combined = Array.from(orderMap.values());
      
      combined = combined.filter(o => [OrderStatus.Completed, OrderStatus.Rejected, OrderStatus.TimedOut].includes(o.status));
      combined = combined.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
      
      onUpdate(combined);
    };

    const unsubCustom = onSnapshot(qCustom, (snapshot) => {
      customOrdersList = snapshot.docs.map((docSnap) => FirestoreService.mapDocToStoreOrder(docSnap.id, docSnap.data(), 'customOrders'));
      emitUpdate();
    });

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      ordersList = snapshot.docs.map((docSnap) => FirestoreService.mapDocToStoreOrder(docSnap.id, docSnap.data(), 'orders'));
      emitUpdate();
    });

    return () => {
      unsubCustom();
      unsubOrders();
    };
  }

  static async updateOrderBill(storeId: string, orderId: string, items: any[], totalAmount: number, collectionName: string = 'customOrders'): Promise<void> {
    const docRef = doc(db, collectionName, orderId);
    
    const itemizedBill = items.map(item => ({
      medicine: item.name,
      qty: item.quantity || 1,
      unitPrice: item.price,
      price: item.price * (item.quantity || 1)
    }));

    await updateDoc(docRef, {
      items,
      itemizedBill,
      deliveryCharge: 100,
      billAmount: totalAmount,
      storeId, // Lock the order to this store
      billGeneratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static async acceptOrder(storeId: string, orderId: string, collectionName: string = 'customOrders'): Promise<void> {
    const docRef = doc(db, collectionName, orderId);
    await updateDoc(docRef, {
      status: 'confirmed',
      storeStatus: OrderStatus.Accepted,
      storeId,
      updatedAt: new Date().toISOString()
    });
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus | string, collectionName: string = 'customOrders'): Promise<void> {
    const docRef = doc(db, collectionName, orderId);
    let customerAppStatus = 'confirmed';
    if (status === OrderStatus.Completed) customerAppStatus = 'completed';
    else if (status === OrderStatus.DeliveryPartnerAssigned || status === 'delivery boy assigned') customerAppStatus = 'delivery boy assigned';
    
    const updateData: any = {
      storeStatus: status,
      status: customerAppStatus,
      updatedAt: new Date().toISOString()
    };

    // When store requests delivery partner: generate storePickupOtp only
    // (Delivery boy shows this to store owner to verify pickup)
    if (
      status === OrderStatus.DeliveryRequested ||
      status === 'DELIVERY_REQUESTED' ||
      status === OrderStatus.Ready
    ) {
      const storePickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
      updateData.storePickupOtp = storePickupOtp;
      updateData.deliveryRequestedAt = new Date().toISOString();
    } else if (
      status === OrderStatus.OutOfDelivery ||
      status === 'OUT_OF_DELIVERY' ||
      status === 'out_for_delivery'
    ) {
      updateData.status = 'delivery boy assigned';
      updateData.storeStatus = OrderStatus.OutOfDelivery;
      updateData.deliveryStatus = 'en_route_delivery';
      updateData.deliveryPartnerAssignedAt = new Date().toISOString();
    } else if (
      status === OrderStatus.DeliveryPartnerAssigned ||
      status === 'DELIVERY_PARTNER_ASSIGNED' ||
      status === 'delivery boy assigned' ||
      status === 'delivery partner assigned'
    ) {
      updateData.status = 'DELIVERY_ASSIGNED';
      updateData.storeStatus = OrderStatus.DeliveryPartnerAssigned;
      updateData.deliveryStatus = 'en_route_pickup';
      updateData.deliveryPartnerAssignedAt = new Date().toISOString();
    }
    
    await updateDoc(docRef, updateData);
  }

  /**
   * Verify store pickup OTP entered by the store owner with the "storePickupOtp" in database
   * and transition order status to 'delivery boy assigned' with storeStatus 'OUT_OF_DELIVERY'
   */
  static async verifyAndConfirmStorePickup(orderId: string, enteredOtp: string, collectionName: string = 'customOrders'): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, collectionName, orderId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return { success: false, error: 'Order not found in database.' };
      }

      const data = snap.data();
      // Fetch storePickupOtp from Firestore document (with fallbacks for robustness)
      const expectedOtp = data.storePickupOtp || data.pickupPin || data.pickupOtp || data.deliveryOtp || data.otp;

      if (!expectedOtp) {
        return { success: false, error: 'No pickup OTP found in database for this order.' };
      }

      // Verify the OTP provided by the delivery boy matches the storePickupOtp
      if (String(expectedOtp).trim() !== String(enteredOtp).trim()) {
        return { success: false, error: 'Invalid OTP. The code entered does not match the Store Pickup OTP.' };
      }

      // Preserve or generate customer deliveryOtp for customer doorstep verification
      const deliveryOtp = data.deliveryOtp || data.otp || Math.floor(1000 + Math.random() * 9000).toString();
      const nowIso = new Date().toISOString();
      const updatePayload: any = {
        status: 'delivery boy assigned',
        storeStatus: OrderStatus.OutOfDelivery,
        deliveryStatus: 'en_route_delivery',
        deliveryOtp: deliveryOtp,
        otp: deliveryOtp,
        storeOtpConfirmed: true,
        storePickupOtpVerified: true,
        pickedUpAt: nowIso,
        deliveryPartnerAssignedAt: nowIso,
        updatedAt: nowIso,
      };

      await updateDoc(docRef, updatePayload);

      // Also update backup 'orders' collection if used
      try {
        const altRef = doc(db, 'orders', orderId);
        await updateDoc(altRef, updatePayload);
      } catch (_) {}

      return { success: true };
    } catch (e: any) {
      console.error('[FirestoreService] verifyAndConfirmStorePickup error:', e);
      return { success: false, error: e.message || 'Failed to verify OTP.' };
    }
  }

  // INVENTORY
  static async getInventory(storeId: string): Promise<InventoryItem[]> {
    const invCol = collection(db, 'stores', storeId, 'inventory');
    const snap = await getDocs(invCol);
    return snap.docs.map((d) => ({ medicineId: d.id, ...d.data() } as InventoryItem));
  }

  static subscribeInventory(storeId: string, onUpdate: (items: InventoryItem[]) => void) {
    const invCol = collection(db, 'stores', storeId, 'inventory');
    return onSnapshot(invCol, (snap) => {
      const items = snap.docs.map((d) => ({ medicineId: d.id, ...d.data() } as InventoryItem));
      onUpdate(items);
    });
  }

  static async updateInventoryStock(storeId: string, medicineId: string, inStock: boolean): Promise<void> {
    const docRef = doc(db, 'stores', storeId, 'inventory', medicineId);
    await updateDoc(docRef, { inStock, updatedAt: new Date().toISOString() });
  }

  // KYC DOCS
  static subscribeKycDocs(storeId: string, onUpdate: (docs: KycDocument[]) => void) {
    const kycCol = collection(db, 'stores', storeId, 'kyc');
    return onSnapshot(kycCol, (snap) => {
      const docs = snap.docs.map((d) => ({ type: d.id, ...d.data() } as KycDocument));
      onUpdate(docs);
    });
  }

  static async saveKycDocument(storeId: string, docType: string, docData: any): Promise<void> {
    const docRef = doc(db, 'stores', storeId, 'kyc', docType);
    await setDoc(docRef, {
      ...docData,
      submittedAt: new Date().toISOString(),
    }, { merge: true });
  }

  // ANNOUNCEMENTS
  static subscribeAnnouncements(onUpdate: (items: Announcement[]) => void) {
    const annCol = collection(db, 'announcements');
    const q = query(annCol, orderBy('publishedAt', 'desc'), limit(20));
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
      onUpdate(items);
    });
  }

  // PERFORMANCE
  static async fetchOrdersForMetrics(storeId: string): Promise<any[]> {
    const ordersCol = collection(db, 'customOrders');
    // Fetch all orders for this store
    const q = query(ordersCol, where('storeId', '==', storeId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  static async getStorePerformance(storeId: string): Promise<StorePerformance | null> {
    const docRef = doc(db, 'stores', storeId, 'performance', 'summary');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as StorePerformance;
  }
}
