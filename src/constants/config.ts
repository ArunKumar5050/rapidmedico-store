export const APP_CONFIG = {
  appName: 'RapidMedico Store',
  brandName: 'RapidMedico',
  supportIdentity: 'RapidMedico Store Support',
  deepLinkScheme: 'rapidmedico-store://',
  bundleId: 'com.rapidmedico.store',
  firebaseProjectId: 'rapidmedico',

  // Order & Alert Constants
  responseWindowSeconds: 90,
  otpLength: 6,
  otpResendCooldownSeconds: 30,
  maxOtpAttempts: 5,

  // Image & KYC Constants
  imageMaxDimensionPx: 1600,
  kycImageMaxDimensionPx: 2000,
  imageMaxFileSizeMb: 10,
  expiryReminderDays: [30, 14, 7, 1],

  // Storage Paths
  storageKycPath: (storeId: string, filename: string) => `kyc/${storeId}/${filename}`,
};

export const REJECTION_REASON_LABELS = {
  OUT_OF_STOCK: 'Medicine Out of Stock',
  CLOSING_SOON: 'Store Closing Soon',
  PRESCRIPTION_UNCLEAR: 'Prescription Image Unclear',
  CANNOT_FULFILL_QUANTITY: 'Cannot Fulfill Quantity',
  OTHER: 'Other (specify note)',
};

export const KYC_DOC_LABELS = {
  DRUG_LICENSE: 'Drug License',
  PAN: 'PAN Card',
  AADHAAR: 'Aadhaar Card',
  GST: 'GST Registration (Optional)',
  CANCELLED_CHEQUE: 'Bank Cancelled Cheque',
  SHOP_PHOTO: 'Shop Photos (1-5)',
  OWNER_PHOTO: 'Owner Photo',
  STORE_LOGO: 'Store Logo (Optional)',
};
