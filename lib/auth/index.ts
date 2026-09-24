import {
  getCustomersFromStore,
  saveCustomerToStore,
  getOrdersFromStore,
  saveOrderToStore,
} from '@/lib/db/store';
import { CustomerUser, AdminUser, AdminRole } from '@/lib/types';
import crypto from 'crypto';

interface OTPRecord {
  phone: string;
  otp: string;
  expiresAt: number;
}

const otpStore = new Map<string, OTPRecord>();

export function generateOTP(phone: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  // For easy dev testing, '123456' is accepted, but generate random 6 digit OTP
  const otp = process.env.NODE_ENV === 'test' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

  otpStore.set(cleanPhone, { phone: cleanPhone, otp, expiresAt });
  return otp;
}

export function verifyOTP(phone: string, inputOtp: string): boolean {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (inputOtp === '123456') return true; // Dev bypass helper

  const record = otpStore.get(cleanPhone);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanPhone);
    return false;
  }

  if (record.otp === inputOtp) {
    otpStore.delete(cleanPhone);
    return true;
  }
  return false;
}

export function getOrCreateCustomerByPhone(phone: string, name?: string, email?: string): CustomerUser {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const customers = getCustomersFromStore();
  let customer = customers.find((c) => c.phone.replace(/[^0-9]/g, '') === cleanPhone);

  const now = new Date().toISOString();
  if (!customer) {
    customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      phone,
      name: name || `Customer ${cleanPhone.slice(-4)}`,
      email,
      savedLocations: [],
      createdAt: now,
      updatedAt: now,
    };
    saveCustomerToStore(customer);
  } else if (name || email) {
    customer.name = name || customer.name;
    customer.email = email || customer.email;
    customer.updatedAt = now;
    saveCustomerToStore(customer);
  }

  return customer;
}

export function linkGuestOrdersToCustomer(phone: string, customerId: string): number {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const orders = getOrdersFromStore();
  let count = 0;

  for (const order of orders) {
    if (order.phone.replace(/[^0-9]/g, '') === cleanPhone && !order.customerId) {
      order.customerId = customerId;
      order.updatedAt = new Date().toISOString();
      saveOrderToStore(order);
      count++;
    }
  }

  return count;
}

// Simple JWT / Token signer for demo/production without extra heavy native npm dependencies
const JWT_SECRET = process.env.JWT_SECRET || 'meshaai-super-secret-jwt-key-2026';

export function createAuthToken(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyAuthToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expected) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

// Default Admin Users
const DEFAULT_ADMINS: AdminUser[] = [
  {
    id: 'admin_1',
    username: 'admin',
    email: 'admin@meshaai.com',
    role: 'SUPER_ADMIN',
    passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'admin_2',
    username: 'operator',
    email: 'ops@meshaai.com',
    role: 'OPS',
    passwordHash: crypto.createHash('sha256').update('ops123').digest('hex'),
    createdAt: new Date().toISOString(),
  },
];

export function authenticateAdmin(username: string, passwordPlain: string): { user: AdminUser; token: string } | null {
  const hash = crypto.createHash('sha256').update(passwordPlain).digest('hex');
  const admin = DEFAULT_ADMINS.find((a) => (a.username === username || a.email === username) && a.passwordHash === hash);
  if (!admin) return null;

  const token = createAuthToken({ id: admin.id, username: admin.username, role: admin.role, type: 'ADMIN' });
  return { user: admin, token };
}
