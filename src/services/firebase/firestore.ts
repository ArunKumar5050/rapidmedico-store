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
  static mapDocToStoreOrder(id: string, data: any): StoreOrder & { _storeId?: string } {
    let mappedStatus = OrderStatus.New;
    const rawStatus = String(data.storeStatus || data.status || '').toUpperCase();
    
    if (rawStatus === 'OUT_OF_DELIVERY' || rawStatus === 'OUT_FOR_DELIVERY' || data.status === 'out_for_delivery' || data.status === 'out_of_delivery') {
      mappedStatus = OrderStatus.OutOfDelivery;
    } else if (rawStatus === 'DELIVERY_PARTNER_ASSIGNED' || data.status === 'delivery boy assigned' || data.status === 'delivery partner assigned') {
      mappedStatus = OrderStatus.DeliveryPartnerAssigned;
    } else if (rawStatus === 'DELIVERY_REQUESTED' || data.status === 'DELIVERY_REQUESTED') {
      mappedStatus = OrderStatus.DeliveryRequested;
    } else if (rawStatus === 'READY' || rawStatus === 'PACKED') {
      mappedStatus = OrderStatus.Ready;
    } else if (rawStatus === 'PREPARING') {
      mappedStatus = OrderStatus.Preparing;
    } else if (rawStatus === 'ACCEPTED' || rawStatus === 'CONFIRMED' || data.status === 'confirmed') {
      mappedStatus = OrderStatus.Accepted;
    } else if (rawStatus === 'COMPLETED' || rawStatus === 'PAID' || rawStatus === 'DELIVERED' || data.status === 'paid' || data.status === 'completed' || data.status === 'delivered') {
      mappedStatus = OrderStatus.Completed;
    } else if (rawStatus === 'REJECTED' || rawStatus === 'CANCELLED' || data.status === 'cancelled') {
      mappedStatus = OrderStatus.Rejected;
    } else if (rawStatus === 'TIMED_OUT') {
      mappedStatus = OrderStatus.TimedOut;
    } else if (data.storeStatus) {
      mappedStatus = data.storeStatus as OrderStatus;
    }

    let orderItems = data.items;
    if (!orderItems && data.medicines && Array.isArray(data.medicines)) {
      orderItems = data.medicines.map((med: string, index: number) => ({
        medicineId: `med-${index}`,
        name: med,
        quantity: 1,
        price: data.price || 0
      }));
    } else if (!orderItems) {
      orderItems = [{ medicineId: 'med-1', name: data.medicineName || 'Unknown Medicine', quantity: 1, price: data.price }];
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
    
    const expectedOtp = data.storePickupOtp || data.pickupPin || data.pickupOtp || data.deliveryOtp || data.otp;

    return {
      id,
      customerFirstName: data.userName || data.customerName || 'Customer',
      status: mappedStatus,
      items: orderItems,
      prescriptionUrls: pUrls,
      totalAmount: data.billAmount || data.price || data.totalAmount,
      assignedAt: assignedAtIso,
      respondByAt: respondByAtIso,
      paymentStatus: data.paymentStatus,
      storePickupOtp: expectedOtp,
      deliveryOtp: data.deliveryOtp || expectedOtp,
      pickupOtp: data.pickupOtp || expectedOtp,
      otp: expectedOtp,
      deliveryPartnerId: data.deliveryPartnerId,
      deliveryPartnerName: data.deliveryPartnerName,
      deliveryPartnerPhone: data.deliveryPartnerPhone,
      deliveryPartnerVehicle: data.deliveryPartnerVehicle,
      deliveryPartnerAssignedAt: data.deliveryPartnerAssignedAt,
      _storeId: data.storeId
    };
  }

  // Subscribe to a single order document in real-time
  static subscribeOrder(orderId: string, onUpdate: (order: StoreOrder | null) => void) {
    const docRef = doc(db, 'customOrders', orderId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(FirestoreService.mapDocToStoreOrder(docSnap.id, docSnap.data()));
      } else {
        // Check backup 'orders' collection if not in customOrders
        const altRef = doc(db, 'orders', orderId);
        getDoc(altRef).then((altSnap) => {
          if (altSnap.exists()) {
            onUpdate(FirestoreService.mapDocToStoreOrder(altSnap.id, altSnap.data()));
          } else {
            onUpdate(null);
          }
        }).catch(() => onUpdate(null));
      }
    }, (error) => {
      console.warn('[FirestoreService] subscribeOrder error:', error);
      getDoc(docRef).then((snap) => {
        if (snap.exists()) {
          onUpdate(FirestoreService.mapDocToStoreOrder(snap.id, snap.data()));
        } else {
          onUpdate(null);
        }
      }).catch(() => onUpdate(null));
    });
  }

  // ORDERS (STORE PRIVACY Projection `storeOrders/{storeId}/orders`)
  static subscribeActiveOrders(storeId: string, onUpdate: (orders: StoreOrder[]) => void) {
    const ordersCol = collection(db, 'customOrders');
    // For direct integration, fetch all orders that are either unassigned (processing) or assigned to this store.
    const q = query(ordersCol, limit(100)); // Simpler query, filter on client to avoid index issues
    return onSnapshot(q, (snapshot) => {
      let orders = snapshot.docs
        .map((docSnap) => FirestoreService.mapDocToStoreOrder(docSnap.id, docSnap.data()))
        .filter(o => 
          // Show orders that are unassigned (New), assigned to this store, or show all if storeId not set yet
          !storeId || (o.status === OrderStatus.New && !o._storeId) || o._storeId === storeId || !o._storeId
        )
        .filter(o => [
          OrderStatus.New,
          OrderStatus.Accepted,
          OrderStatus.Preparing,
          OrderStatus.Ready,
          OrderStatus.DeliveryRequested,
          OrderStatus.DeliveryPartnerAssigned,
          OrderStatus.OutOfDelivery,
          OrderStatus.PickedUp
        ].includes(o.status));

      // Client-side sort to avoid missing Firestore Index errors
      orders = orders.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
      onUpdate(orders);
    });
  }

  static subscribeOrderHistory(storeId: string, onUpdate: (orders: StoreOrder[]) => void) {
    const ordersCol = collection(db, 'customOrders');
    const q = storeId 
      ? query(ordersCol, where('storeId', '==', storeId), limit(50))
      : query(ordersCol, limit(50));
      
    return onSnapshot(q, (snapshot) => {
      let orders = snapshot.docs
        .map((docSnap) => FirestoreService.mapDocToStoreOrder(docSnap.id, docSnap.data()))
        .filter(o => [OrderStatus.Completed, OrderStatus.Rejected, OrderStatus.TimedOut].includes(o.status));

      orders = orders.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
      onUpdate(orders);
    });
  }

  static async updateOrderBill(storeId: string, orderId: string, items: any[], totalAmount: number): Promise<void> {
    const docRef = doc(db, 'customOrders', orderId);
    
    const itemizedBill = items.map(item => ({
      medicine: item.name,
      price: item.price * (item.quantity || 1)
    }));

    await updateDoc(docRef, {
      items,
      itemizedBill,
      deliveryCharge: 200,
      billAmount: totalAmount,
      storeId, // Lock the order to this store
      billGeneratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static async acceptOrder(storeId: string, orderId: string): Promise<void> {
    const docRef = doc(db, 'customOrders', orderId);
    await updateDoc(docRef, {
      status: 'confirmed',
      storeStatus: OrderStatus.Accepted,
      storeId,
      updatedAt: new Date().toISOString()
    });
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus | string): Promise<void> {
    const docRef = doc(db, 'customOrders', orderId);
    let customerAppStatus = 'confirmed';
    if (status === OrderStatus.Completed) customerAppStatus = 'completed';
    else if (status === OrderStatus.DeliveryPartnerAssigned || status === 'delivery boy assigned') customerAppStatus = 'delivery boy assigned';
    
    const updateData: any = {
      storeStatus: status,
      status: customerAppStatus,
      updatedAt: new Date().toISOString()
    };

    // When store requests delivery partner, generate random 4-digit OTP and save to database
    if (
      status === OrderStatus.DeliveryRequested ||
      status === 'DELIVERY_REQUESTED' ||
      status === OrderStatus.Ready
    ) {
      const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
      updateData.deliveryOtp = randomOtp;
      updateData.pickupOtp = randomOtp;
      updateData.storePickupOtp = randomOtp;
      updateData.pickupPin = randomOtp;
      updateData.otp = randomOtp;
      updateData.deliveryRequestedAt = new Date().toISOString();
    } else if (
      status === OrderStatus.OutOfDelivery ||
      status === 'OUT_OF_DELIVERY' ||
      status === 'out_for_delivery' ||
      status === OrderStatus.DeliveryPartnerAssigned ||
      status === 'DELIVERY_PARTNER_ASSIGNED' ||
      status === 'delivery boy assigned' ||
      status === 'delivery partner assigned'
    ) {
      const randomDeliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
      updateData.status = 'delivery boy assigned';
      updateData.storeStatus = OrderStatus.OutOfDelivery;
      updateData.deliveryStatus = 'en_route_delivery';
      updateData.deliveryOtp = randomDeliveryOtp; // Generate OTP named 'deliveryOtp' in the database
      updateData.otp = randomDeliveryOtp;
      updateData.deliveryPartnerAssignedAt = new Date().toISOString();
    }
    
    await updateDoc(docRef, updateData);
  }

  /**
   * Verify store pickup OTP entered by the store owner with the "storePickupOtp" in database
   * and transition order status to 'delivery boy assigned' with storeStatus 'OUT_OF_DELIVERY'
   */
  static async verifyAndConfirmStorePickup(orderId: string, enteredOtp: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, 'customOrders', orderId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return { success: false, error: 'Order not found in database.' };
      }

      const data = snap.data();
      // Specifically fetch storePickupOtp from Firestore document
      const expectedOtp = data.storePickupOtp || data.pickupPin || data.pickupOtp || data.deliveryOtp || data.otp;

      if (!expectedOtp) {
        return { success: false, error: 'No pickup OTP found in database for this order.' };
      }

      // Verify the OTP provided by the delivery boy matches the storePickupOtp
      if (String(expectedOtp).trim() !== String(enteredOtp).trim()) {
        return { success: false, error: 'Invalid OTP. The code entered does not match the Delivery Partner’s Store Pickup OTP.' };
      }

      // Preserve existing deliveryOtp from customer order, or generate only if missing
      const finalDeliveryOtp = data.deliveryOtp || data.otp || Math.floor(1000 + Math.random() * 9000).toString();
      const nowIso = new Date().toISOString();
      const updatePayload: any = {
        status: 'delivery boy assigned',
        storeStatus: OrderStatus.OutOfDelivery,
        deliveryStatus: 'en_route_delivery',
        deliveryOtp: finalDeliveryOtp,
        otp: finalDeliveryOtp,
        storeOtpConfirmed: true,
        storePickupOtpVerified: true,
        verifiedStorePickupOtp: String(enteredOtp).trim(),
        pickedUpAt: nowIso,
        deliveryPartnerAssignedAt: nowIso,
        updatedAt: nowIso,
      };

      await updateDoc(docRef, updatePayload);

      // Also update backup 'orders' collection if used
      try {
        const altRef = doc(db, 'orders', orderId);
        await updateDoc(altRef, {
          status: 'delivery boy assigned',
          storeStatus: OrderStatus.OutOfDelivery,
          deliveryStatus: 'en_route_delivery',
          deliveryOtp: finalDeliveryOtp,
          otp: finalDeliveryOtp,
          storeOtpConfirmed: true,
          storePickupOtpVerified: true,
          verifiedStorePickupOtp: String(enteredOtp).trim(),
          pickedUpAt: nowIso,
          updatedAt: nowIso,
        });
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
