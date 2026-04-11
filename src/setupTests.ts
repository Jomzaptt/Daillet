import { beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from './lib/db';

beforeEach(async () => {
  await db.delete();
  await db.open();
});
