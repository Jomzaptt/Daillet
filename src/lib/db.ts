import Dexie, { Table } from 'dexie';
import CryptoJS from 'crypto-js';

// Encryption key (in a real app this would be user-provided or derived from a password)
// For this demo, we'll use a fixed key or generate one on first load
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const SECRET_KEY = isBrowser ? (window.localStorage.getItem('daillet_secret_key') || 'daillet-default-secret-key') : 'test-secret-key';
if (isBrowser && !window.localStorage.getItem('daillet_secret_key')) {
  window.localStorage.setItem('daillet_secret_key', SECRET_KEY);
}

export function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error("Failed to decrypt data", e);
    return "";
  }
}

export interface Category {
  id?: number;
  type: 'expense' | 'income';
  name: string; // encrypted
  isDefault: boolean;
  icon: string;
}

export interface RecordItem {
  id?: number;
  type: 'expense' | 'income';
  amount: string; // encrypted number
  categoryId: number;
  note: string; // encrypted string
  date: string; // YYYY-MM-DD
  timestamp: number;
  eventId?: number; // for special events
}

export interface EventItem {
  id?: number;
  name: string; // encrypted
  startDate: string;
  endDate: string;
}

export class DailletDB extends Dexie {
  categories!: Table<Category, number>;
  records!: Table<RecordItem, number>;
  events!: Table<EventItem, number>;

  constructor() {
    super('DailletDB');
    this.version(1).stores({
      categories: '++id, type',
      records: '++id, type, date, categoryId, eventId',
      events: '++id'
    });
    this.version(2).stores({
      categories: '++id, type',
      records: '++id, type, date, categoryId, eventId, [type+date]',
      events: '++id'
    });
  }
}

export const db = new DailletDB();

// Default categories
export const DEFAULT_EXPENSE_CATEGORIES = ['食', '住', '行', '饮', '玩', '买'];
export const DEFAULT_INCOME_CATEGORIES = ['工资', '红包', '兼职', '生活费', '股票基金'];

export async function initializeDb() {
  const count = await db.categories.count();
  if (count === 0) {
    const expenses = DEFAULT_EXPENSE_CATEGORIES.map(name => ({
      type: 'expense' as const,
      name: encrypt(name),
      isDefault: true,
      icon: 'Wallet'
    }));
    
    const incomes = DEFAULT_INCOME_CATEGORIES.map(name => ({
      type: 'income' as const,
      name: encrypt(name),
      isDefault: true,
      icon: 'Banknote'
    }));

    await db.categories.bulkAdd([...expenses, ...incomes]);
  }
}
