import { useState } from 'react';
import { CloudinaryService } from '../services/cloudinary/cloudinary';
import { FirestoreService } from '../services/firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { KycDocumentType } from '../types/enums';

export const useKycUpload = () => {
  const { storeId } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadDocument = async (docType: KycDocumentType, fileUri: string, metadata?: Record<string, any>) => {
    if (!storeId) throw new Error('Store ID required for KYC upload');
    setUploading(true);
    try {
      const secureUrl = await CloudinaryService.uploadImage(fileUri, (prog) => {
        setProgress(prog);
      });
      setUploading(false);
      return secureUrl;
    } catch (error) {
      setUploading(false);
      throw error;
    }
  };

  const submitKycPackage = async (kycPackage: any) => {
    if (!storeId) throw new Error('Store ID required to submit KYC');
    setUploading(true);
    try {
      const promises: Promise<void>[] = [];

      // 1. Drug License
      if (kycPackage.drugLicense?.uri) {
        const p = CloudinaryService.uploadImage(kycPackage.drugLicense.uri).then(url => {
          return FirestoreService.saveKycDocument(storeId, KycDocumentType.DrugLicense, {
            type: KycDocumentType.DrugLicense,
            storageUrl: url,
            status: 'PENDING_REVIEW',
            documentNumber: kycPackage.drugLicense.number,
            expiryDate: kycPackage.drugLicense.expiry
          });
        });
        promises.push(p);
      }

      // 2. PAN
      if (kycPackage.pan?.uri) {
        const p = CloudinaryService.uploadImage(kycPackage.pan.uri).then(url => {
          return FirestoreService.saveKycDocument(storeId, KycDocumentType.Pan, {
            type: KycDocumentType.Pan,
            storageUrl: url,
            status: 'PENDING_REVIEW',
            documentNumber: kycPackage.pan.number
          });
        });
        promises.push(p);
      }

      // 3. Aadhaar
      if (kycPackage.aadhaar?.uri) {
        const p = CloudinaryService.uploadImage(kycPackage.aadhaar.uri).then(url => {
          return FirestoreService.saveKycDocument(storeId, KycDocumentType.Aadhaar, {
            type: KycDocumentType.Aadhaar,
            storageUrl: url,
            status: 'PENDING_REVIEW',
            documentNumber: kycPackage.aadhaar.number
          });
        });
        promises.push(p);
      }

      // 4. Cancelled Cheque
      if (kycPackage.bank?.chequeUri) {
        const p = CloudinaryService.uploadImage(kycPackage.bank.chequeUri).then(url => {
          return FirestoreService.saveKycDocument(storeId, KycDocumentType.CancelledCheque, {
            type: KycDocumentType.CancelledCheque,
            storageUrl: url,
            status: 'PENDING_REVIEW',
            accountNumber: kycPackage.bank.account,
            ifsc: kycPackage.bank.ifsc,
            holderName: kycPackage.bank.holder
          });
        });
        promises.push(p);
      }

      // 5. Shop Photo
      if (kycPackage.photos?.shopPhotoUri) {
        const p = CloudinaryService.uploadImage(kycPackage.photos.shopPhotoUri).then(url => {
          return FirestoreService.saveKycDocument(storeId, KycDocumentType.ShopPhoto, {
            type: KycDocumentType.ShopPhoto,
            storageUrl: url,
            status: 'PENDING_REVIEW'
          });
        });
        promises.push(p);
      }

      // 6. Owner Photo
      if (kycPackage.photos?.ownerPhotoUri) {
        const p = CloudinaryService.uploadImage(kycPackage.photos.ownerPhotoUri).then(url => {
          return FirestoreService.saveKycDocument(storeId, KycDocumentType.OwnerPhoto, {
            type: KycDocumentType.OwnerPhoto,
            storageUrl: url,
            status: 'PENDING_REVIEW'
          });
        });
        promises.push(p);
      }

      await Promise.all(promises);
      
      setUploading(false);
      return { success: true };
    } catch (error) {
      setUploading(false);
      throw error;
    }
  };

  return { uploadDocument, submitKycPackage, uploading, progress };
};
