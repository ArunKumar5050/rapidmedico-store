import { OrderStatus, KycStatus, KycDocumentType, RejectionReason, AvailabilityStatus, StoreCategory } from './enums';

export interface Store {
  storeId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  category: StoreCategory | string;
  streetAddress?: string;
  city: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  kycStatus: KycStatus;
  availability: AvailabilityStatus;
  workingHours: { [day: string]: { open: string; close: string; closed: boolean } };
  createdAt: string;
  updatedAt?: string;
  logoUrl?: string;
  expoPushToken?: string;
}

export interface StoreOrderItem {
  medicineId: string;
  name: string;
  quantity: number;
  inStock?: boolean;
  price?: number;
  dosage?: string;
}

export interface StoreOrder {
  id: string;
  status: OrderStatus;
  customerFirstName: string;
  items: StoreOrderItem[];
  prescriptionUrls?: string[];
  medicineImageUrls?: string[];
  customerNotes?: string;
  respondByAt: string;
  rejectionReason?: RejectionReason;
  rejectionNote?: string;
  assignedAt: string;
  paymentStatus?: string;
  paymentMethod?: string;
  _rawStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  totalAmount?: number;
  billGeneratedAt?: string;
  storePickupOtp?: string;  // OTP delivery boy shows to store owner at pickup
  deliveryOtp?: string;     // OTP delivery boy shows to customer at doorstep
  storeOtpConfirmed?: boolean;
  storePickupOtpVerified?: boolean;
  deliveryStatus?: string;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  deliveryPartnerVehicle?: string;
  deliveryPartnerAssignedAt?: string;
  // STRICT PRIVACY ARCHITECTURE ENFORCED:
  // customerPhone, customerEmail, customerAddress, customerLat, customerLng, paymentMethod NEVER EXIST HERE.
  _collection?: 'orders' | 'customOrders';
  storeStatus?: string;
  _storeId?: string;
}

export interface InventoryItem {
  medicineId: string;
  name: string;
  genericName?: string;
  packSize?: string;
  inStock: boolean;
  priceOverride?: number;
  lowStock: boolean;
  category?: string;
  updatedAt?: string;
}

export interface KycDocument {
  type: KycDocumentType;
  storageUrl: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  expiryDate?: string;
  documentNumber?: string;
  submittedAt: string;
}

export interface AnalyticsDaily {
  date: string;
  ordersReceived: number;
  ordersAccepted: number;
  ordersRejected: number;
  ordersCompleted: number;
  avgPrepTimeMinutes: number;
  estimatedRevenue: number;
}

export interface StorePerformance {
  acceptanceRate: number;
  cancellationRate: number;
  avgPrepTimeMinutes: number;
  latePrepCount: number;
  responseTimeSeconds: number;
  reliabilityScore: number;
  storeRating: number;
  inventoryAccuracy: number;
}

export interface StoreRating {
  ratingId: string;
  stars: number;
  feedbackCategory?: string;
  createdAt: string;
  // Anonymized customer rating
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  isImportant?: boolean;
  read?: boolean;
}

export interface SupportMessage {
  id: string;
  sender: 'STORE' | 'SUPPORT';
  message: string;
  timestamp: string;
  orderIdContext?: string;
}
