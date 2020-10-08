import { db } from '../../src/app/database';

declare function afterEach(cb: () => void): void;
afterEach(async () => {
  await db.close();
});
