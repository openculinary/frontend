import * as assert from 'assert';

import { db } from './database';
import { packageVersion } from 'document';

describe('test', () => {
    it('load database state from document', async () => {
        await db.starred.count();
    });
});
