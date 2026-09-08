import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey || 'AIzaSyDoqbjpy3pFiuvMCBhxffJH27bHBNaKTTA',
  authDomain: extra.firebaseAuthDomain || 'rapidmedi.firebaseapp.com',
  projectId: extra.firebaseProjectId || 'rapidmedi',
  storageBucket: extra.firebaseStorageBucket || 'rapidmedi.firebasestorage.app',
  messagingSenderId: extra.firebaseMessagingSenderId || '553213794552',
  appId: extra.firebaseAppId || '1:553213794552:web:db1bdac54f2a80d791430d',
  measurementId: extra.firebaseMeasurementId || 'G-71EYHYR629',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let authInstance: any;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  authInstance = getAuth(app);
}

export const auth = authInstance;

// Force long-polling to prevent "client is offline" errors on Android Emulators
let dbInstance;
try {
  dbInstance = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch (e) {
  // If already initialized during hot reload
  dbInstance = getFirestore(app);
}
export const db = dbInstance;

export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
