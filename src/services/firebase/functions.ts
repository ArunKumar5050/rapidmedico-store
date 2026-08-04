import { functions } from './config';
import { httpsCallable } from 'firebase/functions';
import { RespondToOrderInput } from '../../utils/schemas';
import { OrderStatus, AvailabilityStatus } from '../../types/enums';

export class FunctionsService {
  static async submitKyc(storeId: string, documents: any): Promise<{ success: boolean }> {
    const callable = httpsCallable(functions, 'submitKyc');
    const res = await callable({ storeId, documents });
    return res.data as { success: boolean };
  }

  static async respondToOrder(input: RespondToOrderInput): Promise<{ success: boolean; message?: string }> {
    const callable = httpsCallable(functions, 'respondToOrder');
    const res = await callable(input);
    return res.data as { success: boolean; message?: string };
  }

  static async updateOrderStatus(orderId: string, nextStatus: OrderStatus): Promise<{ success: boolean }> {
    const callable = httpsCallable(functions, 'updateOrderStatus');
    const res = await callable({ orderId, nextStatus });
    return res.data as { success: boolean };
  }

  static async requestDeliveryPartner(orderId: string): Promise<{ success: boolean; etaMinutes?: number }> {
    const callable = httpsCallable(functions, 'requestDeliveryPartner');
    const res = await callable({ orderId });
    return res.data as { success: boolean; etaMinutes?: number };
  }

  static async updateInventory(storeId: string, updates: any[]): Promise<{ success: boolean }> {
    const callable = httpsCallable(functions, 'updateInventory');
    const res = await callable({ storeId, updates });
    return res.data as { success: boolean };
  }

  static async toggleAvailability(storeId: string, availability: AvailabilityStatus): Promise<{ success: boolean }> {
    const callable = httpsCallable(functions, 'toggleAvailability');
    const res = await callable({ storeId, availability });
    return res.data as { success: boolean };
  }

  static async reportIssue(storeId: string, issue: { category: string; description: string; orderId?: string }): Promise<{ success: boolean; threadId: string }> {
    const callable = httpsCallable(functions, 'reportIssue');
    const res = await callable({ storeId, ...issue });
    return res.data as { success: boolean; threadId: string };
  }
}
