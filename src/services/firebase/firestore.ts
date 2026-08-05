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

  // ORDERS (STORE PRIVACY Projection `storeOrders/{storeId}/orders`)
  static subscribeActiveOrders(storeId: string, onUpdate: (orders: StoreOrder[]) => void) {
    const ordersCol = collection(db, 'customOrders');
    // For direct integration, fetch all orders that are either unassigned (processing) or assigned to this store.
    const q = query(ordersCol, limit(100)); // Simpler query, filter on client to avoid index issues
    return onSnapshot(q, (snapshot) => {
      let orders = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          
          // Determine status
          let mappedStatus = OrderStatus.New;
          if (data.storeStatus) {
            mappedStatus = data.storeStatus as OrderStatus;
          } else if (data.status === 'confirmed') {
            mappedStatus = OrderStatus.Accepted;
          } else if (data.status === 'paid' || data.status === 'completed') {
            mappedStatus = OrderStatus.Completed;
          }

          // Map CustomOrder medicines array to StoreOrder items array
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

          const assignedAtIso = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
          const respondByAtIso = new Date(new Date(assignedAtIso).getTime() + 90000).toISOString();
          
          return {
            id: docSnap.id,
            customerFirstName: data.userName || 'Customer',
            customerLastName: '',
            status: mappedStatus,
            items: orderItems,
            prescriptionUrls: data.prescriptionUrls || [],
            totalAmount: data.billAmount,
            assignedAt: assignedAtIso,
            respondByAt: respondByAtIso,
            _storeId: data.storeId // to filter
          } as StoreOrder & { _storeId?: string };
        })
        .filter(o => 
          // Only show orders that are either unassigned (New) or assigned to THIS store
          (o.status === OrderStatus.New && !o._storeId) || o._storeId === storeId
        )
        .filter(o => [OrderStatus.New, OrderStatus.Accepted, OrderStatus.Preparing, OrderStatus.Ready, OrderStatus.DeliveryRequested].includes(o.status));

      // Client-side sort to avoid missing Firestore Index errors
      orders = orders.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
      onUpdate(orders);
    });
  }

  static subscribeOrderHistory(storeId: string, onUpdate: (orders: StoreOrder[]) => void) {
    const ordersCol = collection(db, 'customOrders');
    const q = query(ordersCol, where('storeId', '==', storeId), limit(50));
    return onSnapshot(q, (snapshot) => {
      let orders = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          let mappedStatus = data.storeStatus as OrderStatus || OrderStatus.Completed;
          // Map CustomOrder medicines array to StoreOrder items array
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

          return {
            id: docSnap.id,
            customerFirstName: data.userName || 'Customer',
            customerLastName: '',
            status: mappedStatus,
            items: orderItems,
            totalAmount: data.billAmount,
            assignedAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            respondByAt: new Date(Date.now() + 10 * 60000).toISOString() // Fake timeout
          } as StoreOrder;
      }).filter(o => [OrderStatus.Completed, OrderStatus.Rejected, OrderStatus.TimedOut].includes(o.status));

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

  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const docRef = doc(db, 'customOrders', orderId);
    let customerAppStatus = 'confirmed';
    if (status === OrderStatus.Completed) customerAppStatus = 'completed';
    
    await updateDoc(docRef, {
      storeStatus: status,
      status: customerAppStatus,
      updatedAt: new Date().toISOString()
    });
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
  static async getStorePerformance(storeId: string): Promise<StorePerformance | null> {
    const docRef = doc(db, 'stores', storeId, 'performance', 'summary');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as StorePerformance;
  }
}
