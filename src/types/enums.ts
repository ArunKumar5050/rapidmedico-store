export enum OrderStatus {
  New = 'NEW',
  Accepted = 'ACCEPTED',
  Preparing = 'PREPARING',
  Ready = 'READY',
  DeliveryRequested = 'DELIVERY_REQUESTED',
  DeliveryPartnerAssigned = 'DELIVERY_PARTNER_ASSIGNED',
  OutOfDelivery = 'OUT_OF_DELIVERY',
  PickedUp = 'PICKED_UP',
  Completed = 'COMPLETED',
  Rejected = 'REJECTED',
  TimedOut = 'TIMED_OUT',
  PendingDoctorConfirmation = 'PENDING_DOCTOR_CONFIRMATION'
}

export enum KycStatus {
  NotStarted = 'NOT_STARTED',
  PendingReview = 'PENDING_REVIEW',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  SuspendedExpired = 'SUSPENDED_EXPIRED'
}

export enum KycDocumentType {
  DrugLicense = 'DRUG_LICENSE',
  Pan = 'PAN',
  Aadhaar = 'AADHAAR',
  Gst = 'GST',
  CancelledCheque = 'CANCELLED_CHEQUE',
  ShopPhoto = 'SHOP_PHOTO',
  OwnerPhoto = 'OWNER_PHOTO',
  StoreLogo = 'STORE_LOGO'
}

export enum RejectionReason {
  OutOfStock = 'OUT_OF_STOCK',
  ClosingSoon = 'CLOSING_SOON',
  PrescriptionUnclear = 'PRESCRIPTION_UNCLEAR',
  CannotFulfillQuantity = 'CANNOT_FULFILL_QUANTITY',
  Other = 'OTHER'
}

export enum AvailabilityStatus {
  Online = 'ONLINE',
  Offline = 'OFFLINE',
  Holiday = 'HOLIDAY'
}

export enum StoreCategory {
  Pharmacy = 'PHARMACY',
  MedicalStore = 'MEDICAL_STORE',
  Chemist = 'CHEMIST'
}
