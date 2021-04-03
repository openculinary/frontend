import * as assert from 'assert';

import { db } from './database';
import { packageVersion } from 'document';

describe('database load and store', () => {

    beforeEach(async () => {
        await db.open();
    });

    afterEach(async () => {
        await db.delete();
    });

    it.skip('load database from document', async () => {
        await db.loadFromDocument('document', packageVersion);
        const total = await db.starred.count();
        assert.equal(total, 1);
    });

});
