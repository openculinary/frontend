import * as assert from 'assert';

import { db } from './database';
import { packageVersion, types } from 'document';

describe('test', () => {
    it('load database state from document', async () => {
        db.starred.add(new types.Starred('example', packageVersion));
        const result = await db.starred.count();
        assert.equal(result, 1);
    });
});
