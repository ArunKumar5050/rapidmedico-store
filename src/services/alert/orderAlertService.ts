import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Platform, Vibration } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

export interface AlertOrderPayload {
  orderId: string;
  customerFirstName: string;
  itemCount: number;
  hasPrescription: boolean;
  respondByAt: string;
}

type AlertCallback = (payload: AlertOrderPayload) => void;

// Dynamically require expo-notifications ONLY outside of Expo Go
// Static import triggers auto-listener registration in PushTokenEmitter which Expo Go SDK 53+ blocks on module evaluation
let Notifications: any = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    console.warn('[OrderAlertService] Could not load expo-notifications:', e);
  }
}

class OrderAlertService {
  private sound: AudioPlayer | null = null;
  private isAlerting = false;
  private alertListeners: Set<AlertCallback> = new Set();

  async initializeNotificationChannel(): Promise<void> {
    if (isExpoGo || !Notifications) {
      console.log('[OrderAlertService] Notification channel init skipped in Expo Go');
      return;
    }
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('high_importance_orders', {
          name: 'New Order Alerts',
          description: 'Loud unmissable alerts when a new medical order is assigned to your store',
          importance: Notifications.AndroidImportance?.MAX ?? 5,
          vibrationPattern: [0, 500, 200, 500, 200, 500],
          sound: 'new_order_alert.mp3',
          enableVibrate: true,
          enableLights: true,
          lightColor: '#0F9D6C',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC ?? 1,
        });
      }

      // Configure notification handler for foreground display
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch (err) {
      console.warn('[OrderAlertService] Notification channel init warning:', err);
    }
  }

  async registerPushToken(): Promise<string | null> {
    if (isExpoGo || !Notifications) {
      console.warn('[OrderAlertService] Remote push notifications are unsupported in Expo Go on SDK 53+. Use a development build for real push tokens.');
      return 'mock-expo-go-push-token';
    }
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.warn('[OrderAlertService] Push notification permissions denied');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch (error) {
      console.warn('[OrderAlertService] registerPushToken error:', error);
      return null;
    }
  }

  onOrderAlert(callback: AlertCallback) {
    this.alertListeners.add(callback);
    return () => {
      this.alertListeners.delete(callback);
    };
  }

  async startForegroundAlert(payload: AlertOrderPayload): Promise<void> {
    if (this.isAlerting) return;
    this.isAlerting = true;

    // 1. Keep awake
    try {
      await activateKeepAwakeAsync('orderAlertTag');
    } catch (e) {
      console.warn('[OrderAlertService] KeepAwake failed:', e);
    }

    // 2. Play Sound (expo-audio)
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'duckOthers',
      });

      try {
        this.sound = createAudioPlayer(require('../../../assets/sounds/new_order_alert.mp3'));
        // Loop the player by listening to finish event or relying on auto-loop if supported
        this.sound.loop = true;
        this.sound.play();
      } catch (soundErr) {
        console.warn('[OrderAlertService] Sound file unavailable, using vibration only:', soundErr);
      }
    } catch (e) {
      console.warn('[OrderAlertService] Audio mode setup fallback:', e);
    }

    // 3. Vibration & Haptics pattern
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 800, 400, 800, 400, 800], true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // 4. Notify active listeners
    this.alertListeners.forEach((listener) => listener(payload));
  }

  async stopAlert(): Promise<void> {
    if (!this.isAlerting) return;
    this.isAlerting = false;

    // Stop vibration
    Vibration.cancel();

    // Stop keep awake
    try {
      deactivateKeepAwake('orderAlertTag');
    } catch (e) {}

    // Unload audio
    if (this.sound) {
      try {
        this.sound.pause();
        this.sound.remove(); // Release memory
      } catch (e) {}
      this.sound = null;
    }
  }
}

export const orderAlertService = new OrderAlertService();
