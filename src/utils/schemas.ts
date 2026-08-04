import { z } from 'zod';
import { RejectionReason } from '../types/enums';

export const StoreRegistrationSchema = z.object({
  businessName: z.string().min(2, 'Business Name must be at least 2 characters').max(100),
  ownerName: z.string().min(2, 'Owner Name must be at least 2 characters').max(50),
  phone: z.string().regex(/^\+\d{10,15}$/, 'Phone must be valid E.164 format (e.g. +919876543210)'),
  category: z.enum(['PHARMACY', 'MEDICAL_STORE', 'CHEMIST']),
  city: z.string().min(2, 'City name is required'),
});

export type StoreRegistrationInput = z.infer<typeof StoreRegistrationSchema>;

export const RespondToOrderInputSchema = z.object({
  orderId: z.string().min(1, 'Order ID required'),
  action: z.enum(['ACCEPT', 'REJECT']),
  items: z.array(z.any()).optional(),
  totalAmount: z.number().optional(),
  rejectionReason: z.nativeEnum(RejectionReason).optional(),
  rejectionNote: z.string().min(5, 'Rejection note must be at least 5 characters').optional(),
}).refine(
  (data) => data.action !== 'REJECT' || !!data.rejectionReason,
  { message: 'Rejection reason is required when rejecting an order', path: ['rejectionReason'] }
).refine(
  (data) => data.rejectionReason !== RejectionReason.Other || (data.rejectionNote && data.rejectionNote.length >= 5),
  { message: '5+ character note required when reason is "Other"', path: ['rejectionNote'] }
);

export type RespondToOrderInput = z.infer<typeof RespondToOrderInputSchema>;

export const KycDrugLicenseSchema = z.object({
  licenseNumber: z.string().min(4, 'License number must be at least 4 characters'),
  expiryDate: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d > new Date();
  }, 'Expiry date must be a valid future date'),
  imageUrl: z.string().min(1, 'License document photo required'),
});

export const KycPanSchema = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)'),
  imageUrl: z.string().min(1, 'PAN card photo required'),
});

export const KycAadhaarSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
  imageUrl: z.string().min(1, 'Aadhaar photo required'),
});

export const KycGstSchema = z.object({
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  imageUrl: z.string().optional(),
});

export const KycBankDetailsSchema = z.object({
  accountNumber: z.string().regex(/^\d{9,18}$/, 'Account number must be 9-18 digits'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code (e.g. SBIN0001234)'),
  accountHolderName: z.string().min(2, 'Account holder name required'),
  chequeImageUrl: z.string().min(1, 'Cancelled cheque photo required'),
});
