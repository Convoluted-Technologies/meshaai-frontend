import { Order } from '@/lib/types';
import { logEvent } from '@/lib/utils/logger';

export interface INotificationProvider {
  sendSMS(toPhone: string, message: string): Promise<boolean>;
  sendWhatsApp(toPhone: string, message: string): Promise<boolean>;
}

export class ConsoleMockNotificationProvider implements INotificationProvider {
  async sendSMS(toPhone: string, message: string): Promise<boolean> {
    logEvent('INFO', 'SMS_NOTIFICATION_SENT', { toPhone, message });
    return true;
  }

  async sendWhatsApp(toPhone: string, message: string): Promise<boolean> {
    logEvent('INFO', 'WHATSAPP_NOTIFICATION_SENT', { toPhone, message });
    return true;
  }
}

// Global active notification provider (can be swapped with Termii or Twilio provider)
let currentProvider: INotificationProvider = new ConsoleMockNotificationProvider();

export function setNotificationProvider(provider: INotificationProvider) {
  currentProvider = provider;
}

export async function notifyCustomerOrderEvent(
  order: Order,
  eventType: 'PAID' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
) {
  let message = '';
  switch (eventType) {
    case 'PAID':
      message = `[Meshaai] Payment confirmed! Your order #${order.code} has been received and is being prepared. Track: /track?code=${order.code}&phone=${encodeURIComponent(order.phone)}`;
      break;
    case 'OUT_FOR_DELIVERY':
      message = `[Meshaai] Good news! Order #${order.code} is out for delivery with rider ${order.rider?.name || 'our dispatch team'} (${order.rider?.phone || ''}). Give them code: ${order.deliveryProof?.code}`;
      break;
    case 'DELIVERED':
      message = `[Meshaai] Order #${order.code} has been delivered! Enjoy your meal. Thanks for choosing Meshaai!`;
      break;
    case 'CANCELLED':
      message = `[Meshaai] Order #${order.code} was cancelled. If you paid, a refund has been initiated.`;
      break;
  }

  await currentProvider.sendSMS(order.phone, message);
}
