import * as assert from 'assert';

import { db } from './database';
import { packageVersion, types } from 'document';

describe('database load and store', () => {

    it('load database from document', async () => {
        db.loadFromDocument('test', packageVersion);
        const result = await db.starred.count();
        assert.equal(result, 1);
    });

});
