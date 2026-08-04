import * as CryptoJS from 'crypto-js';

const CLOUD_NAME = 'nffrbaq1';
const API_KEY = '991948769391834';
const API_SECRET = 'CCbDlNTIXPk3lc1zTOoyxj7zmhg';

export class CloudinaryService {
  /**
   * Uploads an image to Cloudinary using the signed REST API.
   * @param fileUri Local URI of the file to upload
   * @param onProgress Optional progress callback
   * @returns The secure URL of the uploaded image
   */
  static async uploadImage(fileUri: string, onProgress?: (progress: number) => void): Promise<string> {
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      
      // The string to sign must contain all parameters (except file, api_key, resource_type, signature) 
      // sorted alphabetically by parameter name.
      const stringToSign = `timestamp=${timestamp}${API_SECRET}`;
      const signature = CryptoJS.SHA1(stringToSign).toString(CryptoJS.enc.Hex);

      const formData = new FormData();
      // Extract filename and type from URI
      const filename = fileUri.split('/').pop() || 'upload.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      // @ts-ignore - React Native FormData accepts an object with uri, name, type
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: type,
      });
      formData.append('api_key', API_KEY);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
      
      // React Native fetch doesn't natively support upload progress yet (needs XMLHttpRequest)
      // For simplicity, we use fetch here. If progress is crucial, we'd need to use XMLHttpRequest.
      
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              onProgress((e.loaded / e.total) * 100);
            }
          });
        }
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } else {
            console.error('[CloudinaryService] Upload failed:', xhr.responseText);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = (e) => {
          console.error('[CloudinaryService] Network error:', e);
          reject(new Error('Network error during upload'));
        };
        
        xhr.send(formData);
      });

    } catch (error) {
      console.error('[CloudinaryService] prepare upload error:', error);
      throw error;
    }
  }
}
