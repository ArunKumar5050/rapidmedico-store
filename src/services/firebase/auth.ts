import { auth } from './config';
import {
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
  ConfirmationResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';

export class AuthService {
  private static confirmationResult: ConfirmationResult | null = null;

  static async registerWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('[AuthService] registerWithEmail error:', error);
      throw error;
    }
  }

  static async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('[AuthService] loginWithEmail error:', error);
      throw error;
    }
  }

  static async sendOtp(phoneNumber: string, recaptchaVerifier?: any): Promise<boolean> {
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      this.confirmationResult = confirmation;
      return true;
    } catch (error) {
      console.warn('[AuthService] sendOtp error:', error);
      throw error;
    }
  }

  static async verifyOtp(verificationCode: string): Promise<User> {
    try {
      if (this.confirmationResult) {
        const result = await this.confirmationResult.confirm(verificationCode);
        return result.user;
      }
      throw new Error('No pending OTP verification session found.');
    } catch (error) {
      console.error('[AuthService] verifyOtp error:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    return firebaseOnAuthStateChanged(auth, callback);
  }
}

