import { describe, it, expect, beforeEach } from 'vitest';
import { db, encrypt, initializeDb } from './db';
import 'fake-indexeddb/auto';

describe('Stress Test', () => {
  beforeEach(async () => {
    await initializeDb();
  });

  it('should efficiently process 5 years of daily records', async () => {
    // 5 years * 365 days * 3 records/day = 5475 records
    // Generate them
    const records = [];
    let currentTimestamp = Date.now() - 5 * 365 * 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < 5475; i++) {
      const dateObj = new Date(currentTimestamp);
      const dateStr = dateObj.toISOString().split('T')[0];
      
      records.push({
        type: 'expense' as const,
        amount: encrypt((Math.random() * 100).toFixed(2)),
        categoryId: (i % 6) + 1,
        note: encrypt('stress test'),
        date: dateStr,
        timestamp: currentTimestamp
      });
      
      // Advance by ~8 hours
      currentTimestamp += 8 * 60 * 60 * 1000;
    }

    // Measure insertion time
    const startInsert = performance.now();
    await db.records.bulkAdd(records);
    const insertTime = performance.now() - startInsert;
    
    // Insertion should be fast (IndexedDB handles this well, especially Dexie)
    console.log(`Insertion of 5475 records took ${insertTime}ms`);
    expect(insertTime).toBeLessThan(5000);

    // Measure query time for a specific month
    const startQuery = performance.now();
    const monthRecords = await db.records
      .where('date')
      .between('2023-01-01', '2023-01-31')
      .toArray();
    
    const queryTime = performance.now() - startQuery;
    console.log(`Querying 1 month of records took ${queryTime}ms`);
    expect(monthRecords.length).toBeGreaterThan(0);
    expect(queryTime).toBeLessThan(1000);
    
    // Measure full fetch for yearly report
    const startFullQuery = performance.now();
    const allExpenses = await db.records.where('type').equals('expense').toArray();
    const fullQueryTime = performance.now() - startFullQuery;
    
    console.log(`Fetching all 5475 expense records took ${fullQueryTime}ms`);
    expect(allExpenses.length).toBe(records.length);
    // Full query should be well under 2 seconds for reports
    expect(fullQueryTime).toBeLessThan(2000);
  });
});
