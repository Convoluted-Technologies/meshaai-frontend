import fs from 'fs';
import path from 'path';
import {
  PresetMeal,
  PresetVersionHistory,
  Order,
  PaymentRecord,
  RefundRecord,
  CustomerUser,
  SystemSettings,
  AdminUser,
} from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_DIR = path.join(DATA_DIR, 'presets_history');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    writeJsonFile(filename, fallback);
    return fallback;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  const tempPath = path.join(DATA_DIR, `${filename}.tmp`);
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

// --- PRESETS & CATALOG VERSIONING ---

export function getPresetsFromStore(): PresetMeal[] {
  return readJsonFile<PresetMeal[]>('presets.json', []);
}

export function savePresetsToStore(
  presets: PresetMeal[],
  actor = 'ADMIN',
  reason = 'Catalog updated'
): PresetVersionHistory {
  ensureDataDir();
  const currentPresets = getPresetsFromStore();
  const versionId = `v_${Date.now()}`;
  const timestamp = new Date().toISOString();

  // Save version snapshot
  const versionRecord: PresetVersionHistory = {
    versionId,
    timestamp,
    presetSnapshot: currentPresets,
    changeReason: reason,
    changedBy: actor,
  };

  const versionFilePath = path.join(HISTORY_DIR, `${versionId}.json`);
  fs.writeFileSync(versionFilePath, JSON.stringify(versionRecord, null, 2), 'utf-8');

  // Update history list
  const historyList = readJsonFile<PresetVersionHistory[]>('presets_history.json', []);
  historyList.unshift(versionRecord);
  writeJsonFile('presets_history.json', historyList);

  // Write new presets
  writeJsonFile('presets.json', presets);
  return versionRecord;
}

export function getPresetHistory(): PresetVersionHistory[] {
  return readJsonFile<PresetVersionHistory[]>('presets_history.json', []);
}

export function rollbackPresetVersion(versionId: string, actor = 'ADMIN'): PresetMeal[] {
  const historyList = getPresetHistory();
  const target = historyList.find((v) => v.versionId === versionId);
  if (!target) {
    throw new Error(`Version ${versionId} not found`);
  }

  savePresetsToStore(target.presetSnapshot, actor, `Rollback to version ${versionId}`);
  return target.presetSnapshot;
}

// --- ORDERS ---

export function getOrdersFromStore(): Order[] {
  return readJsonFile<Order[]>('orders.json', []);
}

export function saveOrderToStore(order: Order): void {
  const orders = getOrdersFromStore();
  const idx = orders.findIndex((o) => o.id === order.id || o.code === order.code);
  if (idx >= 0) {
    orders[idx] = order;
  } else {
    orders.unshift(order);
  }
  writeJsonFile('orders.json', orders);
}

export function findOrderByCodeOrId(identifier: string): Order | undefined {
  const orders = getOrdersFromStore();
  return orders.find(
    (o) =>
      o.id === identifier ||
      o.code.toUpperCase() === identifier.toUpperCase() ||
      o.paymentTxRef === identifier
  );
}

export function findOrderByCodeAndPhone(code: string, phone: string): Order | undefined {
  const orders = getOrdersFromStore();
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return orders.find(
    (o) =>
      o.code.toUpperCase() === code.toUpperCase() &&
      o.phone.replace(/[^0-9]/g, '') === cleanPhone
  );
}

// --- PAYMENTS & REFUNDS ---

export function getPaymentsFromStore(): PaymentRecord[] {
  return readJsonFile<PaymentRecord[]>('payments.json', []);
}

export function savePaymentToStore(payment: PaymentRecord): void {
  const payments = getPaymentsFromStore();
  const idx = payments.findIndex((p) => p.id === payment.id || p.txRef === payment.txRef);
  if (idx >= 0) {
    payments[idx] = payment;
  } else {
    payments.unshift(payment);
  }
  writeJsonFile('payments.json', payments);
}

export function getRefundsFromStore(): RefundRecord[] {
  return readJsonFile<RefundRecord[]>('refunds.json', []);
}

export function saveRefundToStore(refund: RefundRecord): void {
  const refunds = getRefundsFromStore();
  refunds.unshift(refund);
  writeJsonFile('refunds.json', refunds);
}

// --- CUSTOMERS & BLOCKED PHONES ---

export function getCustomersFromStore(): CustomerUser[] {
  return readJsonFile<CustomerUser[]>('customers.json', []);
}

export function saveCustomerToStore(customer: CustomerUser): void {
  const customers = getCustomersFromStore();
  const idx = customers.findIndex(
    (c) => c.id === customer.id || (c.phone && c.phone === customer.phone)
  );
  if (idx >= 0) {
    customers[idx] = customer;
  } else {
    customers.push(customer);
  }
  writeJsonFile('customers.json', customers);
}

export function getBlockedPhonesFromStore(): string[] {
  return readJsonFile<string[]>('blocked_phones.json', []);
}

export function toggleBlockedPhoneStore(phone: string, block: boolean): string[] {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  let list = getBlockedPhonesFromStore();
  if (block) {
    if (!list.includes(cleanPhone)) list.push(cleanPhone);
  } else {
    list = list.filter((p) => p !== cleanPhone);
  }
  writeJsonFile('blocked_phones.json', list);
  return list;
}

export function isPhoneBlocked(phone: string): boolean {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const list = getBlockedPhonesFromStore();
  return list.includes(cleanPhone);
}

// --- SETTINGS ---

export function getSettingsFromStore(): SystemSettings {
  const defaultSettings: SystemSettings = {
    shopName: 'Meshaai Kitchen & Grill',
    isOrderingPaused: false,
    operatingHours: { open: '06:30', close: '22:30', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    deliveryZone: { centerLat: 6.5244, centerLng: 3.3792, maxRadiusKm: 20.0 },
    deliveryFee: { type: 'DISTANCE_BANDED', flatFeeKobo: 50000, baseDistanceKm: 3.0, perKmKobo: 10000 },
    limits: { maxQtyPerLine: 10, maxQtyPerOrder: 25 },
    paymentExpiryMinutes: 15,
  };
  return readJsonFile<SystemSettings>('settings.json', defaultSettings);
}

export function saveSettingsToStore(settings: SystemSettings): void {
  writeJsonFile('settings.json', settings);
}

// --- IDEMPOTENCY KEY STORE ---

export function getIdempotentOrder(key: string): Order | undefined {
  const mapping = readJsonFile<Record<string, string>>('idempotency.json', {});
  const orderId = mapping[key];
  if (!orderId) return undefined;
  return findOrderByCodeOrId(orderId);
}

export function saveIdempotencyKey(key: string, orderId: string): void {
  const mapping = readJsonFile<Record<string, string>>('idempotency.json', {});
  mapping[key] = orderId;
  writeJsonFile('idempotency.json', mapping);
}
