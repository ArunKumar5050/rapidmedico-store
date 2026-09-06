import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey || 'AIzaSyDoqbjpy3pFiuvMCBhxffJH27bHBNaKTTA',
  authDomain: extra.firebaseAuthDomain || 'rapidmedico.firebaseapp.com',
  projectId: extra.firebaseProjectId || 'rapidmedico',
  storageBucket: extra.firebaseStorageBucket || 'rapidmedico.firebasestorage.app',
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

let analyticsInstance: any = null;
isSupported().then((supported) => {
  if (supported) {
    analyticsInstance = getAnalytics(app);
  }
}).catch(() => {});

export const auth = authInstance;
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = analyticsInstance;

export default app;
