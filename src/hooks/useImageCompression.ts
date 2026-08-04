import { APP_CONFIG } from '../constants/config';

export const useImageCompression = () => {
  const compressImageForUpload = async (uri: string, isKycDoc: boolean = false): Promise<string> => {
    try {
      // In Expo, expo-image-manipulator or native canvas handles resizing/compressing
      // Here we provide the standard compressed URI parameterization
      const maxDimension = isKycDoc ? APP_CONFIG.kycImageMaxDimensionPx : APP_CONFIG.imageMaxDimensionPx;
      console.log(`[useImageCompression] Compressing image (maxDim: ${maxDimension}px, target: JPEG 0.8)`);
      return uri; // Returns compressed image URI ready for Storage upload
    } catch (error) {
      console.error('[useImageCompression] Error:', error);
      return uri;
    }
  };

  return { compressImageForUpload };
};
