import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, db, initializeDb } from './db';
import 'fake-indexeddb/auto';

describe('Database and Encryption', () => {
  it('should encrypt and decrypt correctly', () => {
    const original = '100.50';
    const encrypted = encrypt(original);
    
    expect(encrypted).not.toBe(original);
    expect(decrypt(encrypted)).toBe(original);
  });

  it('should handle decrypting empty or invalid strings gracefully', () => {
    expect(decrypt('')).toBe('');
    expect(decrypt('invalid-encrypted-string')).toBe('');
  });

  it('should initialize default categories', async () => {
    await initializeDb();
    const categories = await db.categories.toArray();
    
    expect(categories.length).toBeGreaterThan(0);
    
    const expenses = categories.filter(c => c.type === 'expense');
    expect(expenses.length).toBe(6);
    expect(decrypt(expenses[0].name)).toBe('食');
    
    const incomes = categories.filter(c => c.type === 'income');
    expect(incomes.length).toBe(5);
    expect(decrypt(incomes[0].name)).toBe('工资');
  });

  it('should add and retrieve a record', async () => {
    await initializeDb();
    
    await db.records.add({
      type: 'expense',
      amount: encrypt('50.00'),
      categoryId: 1,
      note: encrypt('Lunch'),
      date: '2023-10-01',
      timestamp: Date.now()
    });

    const records = await db.records.toArray();
    expect(records.length).toBe(1);
    expect(decrypt(records[0].amount)).toBe('50.00');
    expect(decrypt(records[0].note)).toBe('Lunch');
  });

  it('should create and retrieve an event', async () => {
    const eventId = await db.events.add({
      name: encrypt('Trip'),
      startDate: '2023-10-01',
      endDate: '2023-10-07'
    });

    const event = await db.events.get(eventId);
    expect(event).toBeDefined();
    expect(decrypt(event!.name)).toBe('Trip');
  });
});
